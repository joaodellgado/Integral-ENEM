import { shouldDebugClientLogs } from "../db/schema.js";
const senderDiagnostics = {
    lastSendAt: null,
    lastSendError: null,
    lastSendStatus: null,
    lastBatchSize: 0,
};
const ALLOWED_TABLES = new Set([
    "listas",
    "lista_respostas",
    "lista_itens",
    "admin_logs",
    "flashcard_decks",
    "flashcard_topics",
    "flashcard_subtopics",
    "flashcard_cards",
    "flashcard_study_progress",
]);
function getSupabaseClient() {
    const client = window.supabaseClient;
    return client || null;
}
function makeSendError(message, status = 500) {
    const err = new Error(message);
    err.status = status;
    return err;
}
function makePermanentSendError(message, reason, status = 422) {
    const err = new Error(message);
    err.status = status;
    err.permanent = true;
    err.reason = reason;
    return err;
}
function parsePayload(evt) {
    const payload = evt.payload;
    if (!payload || typeof payload !== "object")
        return null;
    if (payload.oversizedDisposition === "metadata_only")
        return null;
    return payload;
}
async function applyDelete(builder, filters) {
    let chain = builder.delete();
    for (const filter of filters || []) {
        if (!filter || typeof filter !== "object")
            continue;
        if (filter.op === "eq" && typeof chain.eq === "function") {
            chain = chain.eq(filter.column, filter.value);
            continue;
        }
        if (filter.op === "in" && typeof chain.in === "function") {
            chain = chain.in(filter.column, Array.isArray(filter.values) ? filter.values : []);
            continue;
        }
    }
    const result = await Promise.resolve(chain);
    if (result?.error)
        throw makeSendError(result.error.message || "Delete failed", result.error.status || 500);
}
function isSchemaIncompatibleIdError(error) {
    const msg = String(error?.message || "").toLowerCase();
    return (msg.includes("invalid input syntax for type uuid") ||
        (msg.includes("uuid") && msg.includes("syntax")) ||
        msg.includes("violates") && msg.includes("constraint") && msg.includes("id"));
}
export function getOutboxSenderDiagnostics() {
    return { ...senderDiagnostics };
}
function estimateBatchBytes(events) {
    try {
        return new TextEncoder().encode(JSON.stringify(events.map((e) => ({ id: e.id, type: e.type, key: e.key, payload: e.payload })))).byteLength;
    }
    catch {
        return JSON.stringify(events).length;
    }
}
function pushFail(result, evt, error, permanent = false, reason) {
    result.failed.push({
        id: evt.id,
        status: error.status,
        permanent,
        reason,
        error: error.message || (permanent ? "Permanent send error" : "Send error"),
    });
}
function normalizeDeleteFilters(filters) {
    const all = Array.isArray(filters) ? filters.filter(Boolean) : [];
    const staticEq = [];
    let dynamicColumn = null;
    let dynamicValues = [];
    for (const f of all) {
        if (f.op === "in" && Array.isArray(f.values)) {
            if (dynamicColumn)
                return null;
            dynamicColumn = String(f.column || "");
            dynamicValues = [...f.values];
            continue;
        }
        if (f.op === "eq") {
            const col = String(f.column || "");
            if (!dynamicColumn && /(^id$|_id$)/.test(col)) {
                dynamicColumn = col;
                dynamicValues = [f.value];
            }
            else {
                staticEq.push({ column: col, value: f.value });
            }
            continue;
        }
        return null;
    }
    if (!dynamicColumn || !dynamicValues.length)
        return null;
    return { dynamicColumn, dynamicValues, staticEq };
}
async function applyGroupedDelete(supabase, table, dynamicColumn, values, staticEq) {
    let chain = supabase.from(table).delete();
    for (const filter of staticEq) {
        if (typeof chain.eq === "function") {
            chain = chain.eq(filter.column, filter.value);
        }
    }
    if (typeof chain.in !== "function")
        throw makeSendError("Delete in() unavailable", 500);
    const result = await chain.in(dynamicColumn, values);
    if (result?.error)
        throw makeSendError(result.error.message || "Delete failed", result.error.status || 500);
}
export async function sendBatchToSupabase(events) {
    const supabase = getSupabaseClient();
    if (!supabase)
        throw makeSendError("Supabase client unavailable for outbox sender", 503);
    const globalRef = window;
    globalRef.__syncOutboxSending = true;
    const startedAt = performance.now ? performance.now() : Date.now();
    const result = {
        sentIds: [],
        failed: [],
        metrics: {
            groupedRequestsCount: 0,
            bytes: estimateBatchBytes(events),
            durationMs: 0,
            totalEvents: events.length,
        },
    };
    try {
        senderDiagnostics.lastBatchSize = events.length;
        const upsertGroups = new Map();
        const deleteGroups = new Map();
        const deleteSingles = [];
        const rpcSingles = [];
        for (const evt of events) {
            const payload = parsePayload(evt);
            if (!payload) {
                if (shouldDebugClientLogs()) {
                    console.warn("[SYNC] Skipping metadata-only or invalid outbox payload", { id: evt.id, type: evt.type, key: evt.key });
                }
                result.sentIds.push(evt.id);
                continue;
            }
            if (payload.op === "UPSERT") {
                if (!ALLOWED_TABLES.has(payload.table)) {
                    console.warn("[SYNC] Dropping outbox event with unauthorized table", { table: payload.table, id: evt.id, op: "UPSERT" });
                    result.sentIds.push(evt.id);
                    continue;
                }
                const key = `${payload.table}|${payload.onConflict || "id"}`;
                const existing = upsertGroups.get(key) || { table: payload.table, onConflict: payload.onConflict || "id", rows: [], events: [] };
                existing.events.push(evt);
                if (Array.isArray(payload.record))
                    existing.rows.push(...payload.record);
                else
                    existing.rows.push(payload.record);
                upsertGroups.set(key, existing);
                continue;
            }
            if (payload.op === "DELETE") {
                if (!ALLOWED_TABLES.has(payload.table)) {
                    console.warn("[SYNC] Dropping outbox event with unauthorized table", { table: payload.table, id: evt.id, op: "DELETE" });
                    result.sentIds.push(evt.id);
                    continue;
                }
                const normalized = normalizeDeleteFilters(payload.filters || []);
                if (!normalized) {
                    deleteSingles.push({ evt, payload });
                    continue;
                }
                const key = `${payload.table}|${normalized.dynamicColumn}|${JSON.stringify(normalized.staticEq)}`;
                const existing = deleteGroups.get(key) || {
                    table: payload.table,
                    dynamicColumn: normalized.dynamicColumn,
                    staticEq: normalized.staticEq,
                    values: [],
                    events: [],
                };
                existing.values.push(...normalized.dynamicValues);
                existing.events.push(evt);
                deleteGroups.set(key, existing);
                continue;
            }
            if (payload.op === "RPC") {
                rpcSingles.push({ evt, payload });
            }
        }
        for (const group of upsertGroups.values()) {
            result.metrics.groupedRequestsCount += 1;
        const { error } = await supabase.from(group.table).upsert(group.rows, group.onConflict ? { onConflict: group.onConflict } : {});
        if (error) {
            console.error("[SYNC ALERT] Falha no upsert para Supabase", {
                table: group.table,
                onConflict: group.onConflict || "id",
                rows: group.rows.length,
                status: error.status || null,
                message: error.message || "unknown_error",
            });
            for (const evt of group.events) {
                if (isSchemaIncompatibleIdError(error)) {
                    console.warn("[SYNC] Outbox event marked schema_incompatible_id", { id: evt.id, type: evt.type, key: evt.key });
                        pushFail(result, evt, error, true, "schema_incompatible_id");
                    }
                    else {
                        pushFail(result, evt, error, false);
                    }
                }
            }
            else {
                for (const evt of group.events)
                    result.sentIds.push(evt.id);
            }
        }
        for (const group of deleteGroups.values()) {
            result.metrics.groupedRequestsCount += 1;
            try {
                const dedupValues = [...new Set(group.values.map((v) => String(v)))];
                await applyGroupedDelete(supabase, group.table, group.dynamicColumn, dedupValues, group.staticEq);
                for (const evt of group.events)
                    result.sentIds.push(evt.id);
            }
        catch (error) {
            const status = error?.status;
            const message = error instanceof Error ? error.message : String(error);
            console.error("[SYNC ALERT] Falha no delete agrupado para Supabase", {
                table: group.table,
                dynamicColumn: group.dynamicColumn,
                values: group.values.length,
                status: status || null,
                message,
            });
            for (const evt of group.events)
                pushFail(result, evt, { status, message }, false);
        }
        }
        for (const item of deleteSingles) {
            result.metrics.groupedRequestsCount += 1;
            try {
                await applyDelete(supabase.from(item.payload.table), item.payload.filters || []);
                result.sentIds.push(item.evt.id);
            }
        catch (error) {
            console.error("[SYNC ALERT] Falha no delete individual para Supabase", {
                table: item.payload.table,
                filters: item.payload.filters || [],
                status: error?.status || null,
                message: error instanceof Error ? error.message : String(error),
            });
            pushFail(result, item.evt, { status: error?.status, message: error instanceof Error ? error.message : String(error) }, false);
        }
    }
        for (const item of rpcSingles) {
            result.metrics.groupedRequestsCount += 1;
        if (typeof supabase.rpc !== "function") {
            console.error("[SYNC ALERT] RPC indisponivel no cliente Supabase", {
                fn: item.payload.fn,
                args: item.payload.args || {},
            });
            pushFail(result, item.evt, { status: 501, message: "Supabase rpc unavailable" }, true, "rpc_unavailable");
            continue;
        }
        const { error } = await supabase.rpc(item.payload.fn, item.payload.args || {});
        if (error) {
            console.error("[SYNC ALERT] Falha em RPC do Supabase", {
                fn: item.payload.fn,
                status: error.status || null,
                message: error.message || "unknown_error",
            });
            pushFail(result, item.evt, error, false);
        }
        else
            result.sentIds.push(item.evt.id);
        }
        result.metrics.durationMs = Math.round((performance.now ? performance.now() : Date.now()) - startedAt);
        if (shouldDebugClientLogs()) {
            console.info("[SYNC] OUTBOX batch", {
                totalEvents: result.metrics.totalEvents,
                groupedRequestsCount: result.metrics.groupedRequestsCount,
                bytes: result.metrics.bytes,
                durationMs: result.metrics.durationMs,
                failed: result.failed.length,
            });
        }
        senderDiagnostics.lastSendAt = Date.now();
        senderDiagnostics.lastSendError = result.failed.length ? `partial_failures:${result.failed.length}` : null;
        senderDiagnostics.lastSendStatus = result.failed.find((f) => typeof f.status === "number")?.status || null;
        return result;
    }
    catch (error) {
        senderDiagnostics.lastSendAt = Date.now();
        senderDiagnostics.lastSendError = error instanceof Error ? error.message : String(error);
        senderDiagnostics.lastSendStatus = error?.status || null;
        console.error("[SYNC ALERT] Falha geral ao enviar lote do outbox", {
            batchSize: events.length,
            status: senderDiagnostics.lastSendStatus,
            error: senderDiagnostics.lastSendError,
        });
        throw error;
    }
    finally {
        globalRef.__syncOutboxSending = false;
    }
}
//# sourceMappingURL=outboxSenderSupabase.js.map
