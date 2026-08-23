import { shouldDebugClientLogs, type OutboxRecord } from "../db/schema.js";

type SupabaseLike = {
  from: (table: string) => {
    upsert: (payload: unknown, options?: Record<string, unknown>) => Promise<{ error?: { message?: string; status?: number } | null }>;
    insert: (payload: unknown) => Promise<{ error?: { message?: string; status?: number } | null }>;
    update: (payload: unknown) => {
      eq: (column: string, value: unknown) => Promise<{ error?: { message?: string; status?: number } | null }>;
    };
    delete: () => {
      eq: (column: string, value: unknown) => unknown;
      in: (column: string, values: unknown[]) => Promise<{ error?: { message?: string; status?: number } | null }>;
    };
  };
  rpc?: (fn: string, args?: Record<string, unknown>) => Promise<{ error?: { message?: string; status?: number } | null }>;
};

type DbEventPayload =
  | {
      op: "UPSERT";
      table: string;
      record: Record<string, unknown> | Record<string, unknown>[];
      onConflict?: string;
    }
  | {
      op: "DELETE";
      table: string;
      filters: Array<{ op: "eq" | "in"; column: string; value?: unknown; values?: unknown[] }>;
    }
  | {
      op: "RPC";
      fn: string;
      args?: Record<string, unknown>;
    };

interface OutboxSenderDiagnostics {
  lastSendAt: number | null;
  lastSendError: string | null;
  lastSendStatus: number | null;
  lastBatchSize: number;
  droppedUnsupportedCount: number;
  lastDroppedUnsupported: {
    id: string;
    type: string;
    key: string;
    reason: string;
    payloadOp?: string | null;
  } | null;
}

const senderDiagnostics: OutboxSenderDiagnostics = {
  lastSendAt: null,
  lastSendError: null,
  lastSendStatus: null,
  lastBatchSize: 0,
  droppedUnsupportedCount: 0,
  lastDroppedUnsupported: null,
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

function getSupabaseClient(): SupabaseLike | null {
  const client = (window as unknown as { supabaseClient?: SupabaseLike }).supabaseClient;
  return client || null;
}

function makeSendError(message: string, status = 500): Error & { status: number } {
  const err = new Error(message) as Error & { status: number };
  err.status = status;
  return err;
}

function makePermanentSendError(message: string, reason: string, status = 422): Error & { status: number; permanent: true; reason: string } {
  const err = new Error(message) as Error & { status: number; permanent: true; reason: string };
  err.status = status;
  err.permanent = true;
  err.reason = reason;
  return err;
}

function parsePayload(evt: OutboxRecord): DbEventPayload | null {
  const payload = evt.payload as Record<string, unknown> | null;
  if (!payload || typeof payload !== "object") return null;
  if (payload.oversizedDisposition === "metadata_only") return null;
  return payload as unknown as DbEventPayload;
}

type DeleteFilters = Extract<DbEventPayload, { op: "DELETE" }>["filters"];

async function applyDelete(builder: ReturnType<SupabaseLike["from"]>, filters: DeleteFilters) {
  let chain: unknown = builder.delete();
  for (const filter of filters || []) {
    if (!filter || typeof filter !== "object") continue;
    if (filter.op === "eq" && typeof (chain as { eq?: unknown }).eq === "function") {
      chain = (chain as { eq: (column: string, value: unknown) => unknown }).eq(filter.column, filter.value);
      continue;
    }
    if (filter.op === "in" && typeof (chain as { in?: unknown }).in === "function") {
      chain = (chain as { in: (column: string, values: unknown[]) => Promise<{ error?: { status?: number; message?: string } | null }> }).in(
        filter.column,
        Array.isArray(filter.values) ? filter.values : [],
      );
      continue;
    }
  }
  const result = await Promise.resolve(chain as Promise<{ error?: { status?: number; message?: string } | null }>);
  if (result?.error) throw makeSendError(result.error.message || "Delete failed", result.error.status || 500);
}

function isSchemaIncompatibleIdError(error: { message?: string; status?: number } | null | undefined): boolean {
  const msg = String(error?.message || "").toLowerCase();
  return (
    msg.includes("invalid input syntax for type uuid") ||
    (msg.includes("uuid") && msg.includes("syntax")) ||
    msg.includes("violates") && msg.includes("constraint") && msg.includes("id")
  );
}

export function getOutboxSenderDiagnostics(): OutboxSenderDiagnostics {
  return { ...senderDiagnostics };
}

type PartialSendResult = {
  sentIds: string[];
  failed: Array<{ id: string; status?: number; permanent?: boolean; reason?: string; error?: string }>;
  metrics: { groupedRequestsCount: number; bytes: number; durationMs: number; totalEvents: number };
};

function notifyDroppedUnsupportedOutboxEvent(evt: OutboxRecord, reason: string, payloadOp?: string | null) {
  senderDiagnostics.droppedUnsupportedCount += 1;
  senderDiagnostics.lastDroppedUnsupported = {
    id: evt.id,
    type: evt.type,
    key: evt.key,
    reason,
    payloadOp: payloadOp ?? null,
  };
  if (shouldDebugClientLogs()) {
    console.warn("[SYNC] Dropping unsupported outbox event", {
      id: evt.id,
      type: evt.type,
      key: evt.key,
      reason,
      payloadOp: payloadOp ?? null,
    });
  }
  window.dispatchEvent(
    new CustomEvent("mm-outbox-drop", {
      detail: {
        id: evt.id,
        type: evt.type,
        key: evt.key,
        reason,
        payloadOp: payloadOp ?? null,
      },
    }),
  );
}

function estimateBatchBytes(events: OutboxRecord[]): number {
  try {
    return new TextEncoder().encode(JSON.stringify(events.map((e) => ({ id: e.id, type: e.type, key: e.key, payload: e.payload })))).byteLength;
  } catch {
    return JSON.stringify(events).length;
  }
}

function pushFail(result: PartialSendResult, evt: OutboxRecord, error: { message?: string; status?: number }, permanent = false, reason?: string) {
  result.failed.push({
    id: evt.id,
    status: error.status,
    permanent,
    reason,
    error: error.message || (permanent ? "Permanent send error" : "Send error"),
  });
}

function normalizeDeleteFilters(filters: DeleteFilters | undefined) {
  const all = Array.isArray(filters) ? filters.filter(Boolean) : [];
  const staticEq: Array<{ column: string; value: unknown }> = [];
  let dynamicColumn: string | null = null;
  let dynamicValues: unknown[] = [];
  for (const f of all) {
    if (f.op === "in" && Array.isArray(f.values)) {
      if (dynamicColumn) return null;
      dynamicColumn = String(f.column || "");
      dynamicValues = [...f.values];
      continue;
    }
    if (f.op === "eq") {
      const col = String(f.column || "");
      if (!dynamicColumn && /(^id$|_id$)/.test(col)) {
        dynamicColumn = col;
        dynamicValues = [f.value];
      } else {
        staticEq.push({ column: col, value: f.value });
      }
      continue;
    }
    return null;
  }
  if (!dynamicColumn || !dynamicValues.length) return null;
  return { dynamicColumn, dynamicValues, staticEq };
}

async function applyGroupedDelete(
  supabase: SupabaseLike,
  table: string,
  dynamicColumn: string,
  values: unknown[],
  staticEq: Array<{ column: string; value: unknown }>,
) {
  let chain: unknown = supabase.from(table).delete();
  for (const filter of staticEq) {
    if (typeof (chain as { eq?: unknown }).eq === "function") {
      chain = (chain as { eq: (column: string, value: unknown) => unknown }).eq(filter.column, filter.value);
    }
  }
  if (typeof (chain as { in?: unknown }).in !== "function") throw makeSendError("Delete in() unavailable", 500);
  const result = await (chain as { in: (column: string, values: unknown[]) => Promise<{ error?: { message?: string; status?: number } | null }> }).in(
    dynamicColumn,
    values,
  );
  if (result?.error) throw makeSendError(result.error.message || "Delete failed", result.error.status || 500);
}

export async function sendBatchToSupabase(events: OutboxRecord[]): Promise<PartialSendResult> {
  const supabase = getSupabaseClient();
  if (!supabase) throw makeSendError("Supabase client unavailable for outbox sender", 503);

  const globalRef = window as unknown as { __syncOutboxSending?: boolean };
  globalRef.__syncOutboxSending = true;
  const startedAt = performance.now ? performance.now() : Date.now();
  const result: PartialSendResult = {
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
    const upsertGroups = new Map<string, { table: string; onConflict?: string; rows: unknown[]; events: OutboxRecord[] }>();
    const deleteGroups = new Map<string, { table: string; dynamicColumn: string; staticEq: Array<{ column: string; value: unknown }>; values: unknown[]; events: OutboxRecord[] }>();
    const deleteSingles: Array<{ evt: OutboxRecord; payload: Extract<DbEventPayload, { op: "DELETE" }> }> = [];
    const rpcSingles: Array<{ evt: OutboxRecord; payload: Extract<DbEventPayload, { op: "RPC" }> }> = [];

    for (const evt of events) {
      const payload = parsePayload(evt);
      if (!payload) {
        const rawPayload = evt.payload as Record<string, unknown> | null;
        if (!(rawPayload && typeof rawPayload === "object" && rawPayload.oversizedDisposition === "metadata_only")) {
          notifyDroppedUnsupportedOutboxEvent(evt, "invalid_payload_shape");
        }
        if (shouldDebugClientLogs()) {
          console.warn("[SYNC] Skipping metadata-only or invalid outbox payload", { id: evt.id, type: evt.type, key: evt.key });
        }
        result.sentIds.push(evt.id);
        continue;
      }

      if (payload.op === "UPSERT") {
        if (!ALLOWED_TABLES.has(payload.table)) {
          notifyDroppedUnsupportedOutboxEvent(evt, "unauthorized_table", "UPSERT");
          result.sentIds.push(evt.id);
          continue;
        }
        const key = `${payload.table}|${payload.onConflict || "id"}`;
        const existing = upsertGroups.get(key) || { table: payload.table, onConflict: payload.onConflict || "id", rows: [], events: [] };
        existing.events.push(evt);
        if (Array.isArray(payload.record)) existing.rows.push(...payload.record);
        else existing.rows.push(payload.record);
        upsertGroups.set(key, existing);
        continue;
      }

      if (payload.op === "DELETE") {
        if (!ALLOWED_TABLES.has(payload.table)) {
          notifyDroppedUnsupportedOutboxEvent(evt, "unauthorized_table", "DELETE");
          result.sentIds.push(evt.id);
          continue;
        }
        const normalized = normalizeDeleteFilters(payload.filters || []);
        if (!normalized) {
          deleteSingles.push({ evt, payload });
          continue;
        }
        const key = `${payload.table}|${normalized.dynamicColumn}|${JSON.stringify(normalized.staticEq)}`;
        const existing =
          deleteGroups.get(key) || {
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
        continue;
      }

      notifyDroppedUnsupportedOutboxEvent(evt, "unsupported_payload_op", typeof (payload as { op?: unknown }).op === "string" ? String((payload as { op?: unknown }).op) : null);
      result.sentIds.push(evt.id);
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
          } else {
            pushFail(result, evt, error, false);
          }
        }
      } else {
        for (const evt of group.events) result.sentIds.push(evt.id);
      }
    }

    for (const group of deleteGroups.values()) {
      result.metrics.groupedRequestsCount += 1;
      try {
        const dedupValues = [...new Set(group.values.map((v) => String(v)))];
        await applyGroupedDelete(supabase, group.table, group.dynamicColumn, dedupValues, group.staticEq);
        for (const evt of group.events) result.sentIds.push(evt.id);
      } catch (error) {
        const status = (error as { status?: number })?.status;
        const message = error instanceof Error ? error.message : String(error);
        console.error("[SYNC ALERT] Falha no delete agrupado para Supabase", {
          table: group.table,
          dynamicColumn: group.dynamicColumn,
          values: group.values.length,
          status: status || null,
          message,
        });
        for (const evt of group.events) pushFail(result, evt, { status, message }, false);
      }
    }

    for (const item of deleteSingles) {
      result.metrics.groupedRequestsCount += 1;
      try {
        await applyDelete(supabase.from(item.payload.table), item.payload.filters || []);
        result.sentIds.push(item.evt.id);
      } catch (error) {
        console.error("[SYNC ALERT] Falha no delete individual para Supabase", {
          table: item.payload.table,
          filters: item.payload.filters || [],
          status: (error as { status?: number })?.status || null,
          message: error instanceof Error ? error.message : String(error),
        });
        pushFail(result, item.evt, { status: (error as { status?: number })?.status, message: error instanceof Error ? error.message : String(error) }, false);
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
      else result.sentIds.push(item.evt.id);
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
  } catch (error) {
    senderDiagnostics.lastSendAt = Date.now();
    senderDiagnostics.lastSendError = error instanceof Error ? error.message : String(error);
    senderDiagnostics.lastSendStatus = (error as { status?: number })?.status || null;
    console.error("[SYNC ALERT] Falha geral ao enviar lote do outbox", {
      batchSize: events.length,
      status: senderDiagnostics.lastSendStatus,
      error: senderDiagnostics.lastSendError,
    });
    throw error;
  } finally {
    globalRef.__syncOutboxSending = false;
  }
}
