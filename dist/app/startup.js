import { openAppDB } from "../db/openDB.js";
import { migrateLocalStorageMirror, getMigrationMeta } from "../db/migrateLocalStorageMirror.js";
import { createOutboxProcessor, getOutboxStatusSummary, pruneDeadOutboxEvents } from "../db/outbox.js";
import { createStorageFacade } from "../db/storageFacade.js";
import { META_KEYS } from "../db/schema.js";
import { getByKey } from "../db/openDB.js";
import { STORES } from "../db/schema.js";
import { bindSyncGatewayRuntime, getSyncGatewayDiagnostics } from "../sync/syncGateway.js";
import { getOutboxSenderDiagnostics, sendBatchToSupabase } from "../sync/outboxSenderSupabase.js";
import { installDirectSupabaseCallInterceptor } from "../sync/devSupabaseDirectInterceptor.js";
const listeners = new Set();
let currentStatus = {
    ready: false,
    migrating: false,
    migrated: false,
    error: null,
};
let startupRunPromise = null;
let badgeTimer = null;
let lastSyncConsoleAlertKey = null;
function withTimeout(promise, timeoutMs, fallback) {
    return new Promise((resolve) => {
        let settled = false;
        const timer = window.setTimeout(() => {
            if (settled)
                return;
            settled = true;
            resolve(fallback);
        }, Math.max(1, timeoutMs));
        promise
            .then((value) => {
            if (settled)
                return;
            settled = true;
            window.clearTimeout(timer);
            resolve(value);
        })
            .catch(() => {
            if (settled)
                return;
            settled = true;
            window.clearTimeout(timer);
            resolve(fallback);
        });
    });
}
function emitStatus(next) {
    currentStatus = { ...currentStatus, ...next };
    for (const listener of listeners)
        listener(currentStatus);
}
export function getMigrationStatus() {
    return currentStatus;
}
export function subscribeMigrationStatus(listener) {
    listeners.add(listener);
    listener(currentStatus);
    return () => listeners.delete(listener);
}
export function useMigrationStatus() {
    return { getSnapshot: getMigrationStatus, subscribe: subscribeMigrationStatus };
}
async function isMetaMigrating(db) {
    const rec = await getByKey(db, STORES.meta, META_KEYS.migrating);
    return Boolean(rec?.value);
}
function isDevEnv() {
    return window.__MM_ENV__ === "dev" || /localhost|127\.0\.0\.1/.test(window.location.hostname);
}
function emitSyncConsoleAlert(level, message, details, dedupeKey) {
    const stableKey = dedupeKey || `${level}:${message}:${JSON.stringify(details)}`;
    if (lastSyncConsoleAlertKey === stableKey)
        return;
    lastSyncConsoleAlertKey = stableKey;
    console[level](`[SYNC ALERT] ${message}`, details);
}
function installSyncStatusBadge(getSummary) {
    if (badgeTimer)
        window.clearInterval(badgeTimer);
    if (!document.getElementById("mm-sync-badge-style")) {
        const style = document.createElement("style");
        style.id = "mm-sync-badge-style";
        style.textContent = `
      @keyframes mmSyncBadgePulse {
        0% { transform: translateY(0); opacity: .92; box-shadow: 0 6px 24px rgba(0,0,0,.20); }
        50% { transform: translateY(-2px); opacity: 1; box-shadow: 0 10px 28px rgba(0,0,0,.24); }
        100% { transform: translateY(0); opacity: .92; box-shadow: 0 6px 24px rgba(0,0,0,.20); }
      }
    `;
        document.head.appendChild(style);
    }
    let badge = document.getElementById("mm-sync-badge");
    let headerNotice = document.getElementById("mm-sync-header-notice");
    if (!badge) {
        badge = document.createElement("button");
        badge.id = "mm-sync-badge";
        badge.type = "button";
        badge.setAttribute("aria-live", "polite");
        badge.style.cssText = [
            "position:fixed",
            "right:12px",
            "bottom:12px",
            "z-index:2147483647",
            "display:none",
            "padding:8px 12px",
            "border-radius:999px",
            "border:1px solid rgba(0,0,0,.08)",
            "background:rgba(20,20,20,.92)",
            "color:#fff",
            "font:600 12px/1.2 system-ui,sans-serif",
            "box-shadow:0 6px 24px rgba(0,0,0,.2)",
            "cursor:pointer",
            "transition:opacity .18s ease, transform .18s ease, background-color .18s ease",
        ].join(";");
        badge.addEventListener("click", async () => {
            if (!isDevEnv() || typeof window.__MM_AUDIT__ !== "function")
                return;
            const audit = await window.__MM_AUDIT__();
            console.info("[MM AUDIT]", audit);
            alert("Falha ao sincronizar. Veja detalhes no console (modo dev).");
        });
        document.body.appendChild(badge);
    }
    if (!headerNotice) {
        headerNotice = document.createElement("div");
        headerNotice.id = "mm-sync-header-notice";
        headerNotice.setAttribute("role", "status");
        headerNotice.setAttribute("aria-live", "polite");
        headerNotice.style.cssText = [
            "position:fixed",
            "top:10px",
            "left:50%",
            "transform:translateX(-50%) translateY(-8px)",
            "z-index:2147483647",
            "display:none",
            "max-width:min(92vw, 720px)",
            "padding:10px 14px",
            "border-radius:12px",
            "border:1px solid rgba(180,30,30,.22)",
            "background:rgba(150, 24, 24, 0.96)",
            "color:#fff",
            "font:600 13px/1.25 system-ui,sans-serif",
            "box-shadow:0 10px 26px rgba(0,0,0,.22)",
            "opacity:0",
            "transition:opacity .18s ease, transform .18s ease",
            "pointer-events:none",
            "text-align:center",
        ].join(";");
        headerNotice.textContent = "Falha ao sincronizar alguns dados. Tente novamente em instantes.";
        document.body.appendChild(headerNotice);
    }
    let lastVisibleState = "hidden";
    const setBadgeVisibilityState = (nextState) => {
        if (lastVisibleState === nextState)
            return;
        lastVisibleState = nextState;
        window.__MM_SYNC_BADGE_VISIBLE__ = nextState !== "hidden";
        window.dispatchEvent(new CustomEvent("mm-sync-badge-visibilitychange", {
            detail: { state: nextState, visible: nextState !== "hidden" },
        }));
    };
    const render = async () => {
        const summary = await withTimeout(getSummary().catch(() => null), 1800, null);
        if (!badge)
            return;
        if (!summary) {
            emitSyncConsoleAlert("warn", "Resumo do outbox indisponivel", { source: "installSyncStatusBadge" }, "summary-unavailable");
            badge.style.animation = "none";
            badge.style.display = "none";
            if (headerNotice) {
                headerNotice.style.opacity = "0";
                headerNotice.style.transform = "translateX(-50%) translateY(-8px)";
                headerNotice.style.display = "none";
            }
            setBadgeVisibilityState("hidden");
            return;
        }
        if (summary.dead > 0) {
            const senderDiag = getOutboxSenderDiagnostics();
            const gatewayDiag = getSyncGatewayDiagnostics();
            emitSyncConsoleAlert("error", "Eventos mortos detectados no outbox", {
                pending: summary.pending,
                dead: summary.dead,
                lastSendError: senderDiag.lastSendError,
                lastSendStatus: senderDiag.lastSendStatus,
                lastFlushAt: gatewayDiag.lastFlushAt,
                lastFlushReason: gatewayDiag.lastFlushReason,
            }, `dead:${summary.dead}:${senderDiag.lastSendError || "none"}:${senderDiag.lastSendStatus || "none"}`);
            badge.textContent = "Falha ao sincronizar";
            badge.style.display = "block";
            badge.style.background = "rgba(146, 24, 24, 0.94)";
            badge.style.animation = "none";
            if (headerNotice) {
                headerNotice.style.display = "block";
                headerNotice.style.opacity = "1";
                headerNotice.style.transform = "translateX(-50%) translateY(0)";
            }
            setBadgeVisibilityState("dead");
            return;
        }
        const activelyProcessing = (summary.queued || 0) + (summary.sending || 0) > 0;
        if (activelyProcessing) {
            const senderDiag = getOutboxSenderDiagnostics();
            emitSyncConsoleAlert("warn", "Fila de sincronizacao com pendencias", {
                queued: summary.queued,
                sending: summary.sending,
                failed: summary.failed,
                dead: summary.dead,
                lastSendError: senderDiag.lastSendError,
                lastSendStatus: senderDiag.lastSendStatus,
            }, `pending:${summary.queued}q+${summary.sending}s:${senderDiag.lastSendError || "none"}`);
            badge.textContent = "Carregando...";
            badge.style.display = "block";
            badge.style.background = "rgba(20,20,20,.92)";
            badge.style.animation = "mmSyncBadgePulse 1.15s ease-in-out infinite";
            if (headerNotice) {
                headerNotice.style.opacity = "0";
                headerNotice.style.transform = "translateX(-50%) translateY(-8px)";
                headerNotice.style.display = "none";
            }
            setBadgeVisibilityState("pending");
            return;
        }
        // Items in failed/backoff state are awaiting automatic retry — don't show badge
        badge.style.animation = "none";
        badge.style.display = "none";
        if (lastSyncConsoleAlertKey !== "hidden") {
            lastSyncConsoleAlertKey = "hidden";
            const failedWaiting = summary.failed || 0;
            if (failedWaiting > 0) {
                console.info("[SYNC ALERT] Outbox aguardando retry automatico", { failed: failedWaiting, dead: summary.dead });
            }
            else {
                console.info("[SYNC ALERT] Fila de sincronizacao estabilizada", { pending: summary.pending, dead: summary.dead });
            }
        }
        if (headerNotice) {
            headerNotice.style.opacity = "0";
            headerNotice.style.transform = "translateX(-50%) translateY(-8px)";
            headerNotice.style.display = "none";
        }
        setBadgeVisibilityState("hidden");
    };
    void render();
    badgeTimer = window.setInterval(() => {
        void render();
    }, 1500);
}
function installBestEffortExitFlush() {
    let flushing = false;
    const flushOnExit = async () => {
        if (flushing)
            return;
        flushing = true;
        try {
            window.__MM_FLUSH_ON_EXIT__ = true;
            if (typeof window.__MM_FLUSH__ === "function") {
                await window.__MM_FLUSH__({ timeoutMs: 1200 });
            }
        }
        catch {
            /* noop */
        }
        finally {
            window.__MM_FLUSH_ON_EXIT__ = false;
            flushing = false;
        }
    };
    document.addEventListener("visibilitychange", () => {
        if (document.hidden)
            void flushOnExit();
    });
    window.addEventListener("pagehide", () => {
        void flushOnExit();
    });
    window.addEventListener("beforeunload", () => {
        void flushOnExit();
    });
}
export async function startupApp(options) {
    if (startupRunPromise)
        return startupRunPromise;
    startupRunPromise = (async () => {
        const storage = createStorageFacade({ dualWriteLocalStorage: true, removeLocalOnDelete: false });
        let db = null;
        let outbox;
        let syncGateway;
        try {
            db = await openAppDB();
            emitStatus({ ready: false, error: null });
            if (options?.runMigration !== false) {
                const preMeta = await getMigrationMeta(db);
                const shouldSkipDueToInsufficientStorage = !preMeta.migrated && preMeta.migrationResult?.error === "INSUFFICIENT_STORAGE";
                if (shouldSkipDueToInsufficientStorage) {
                    emitStatus({
                        migrating: false,
                        migrated: false,
                        error: preMeta.migrationResult?.error || "INSUFFICIENT_STORAGE",
                    });
                }
                else {
                    emitStatus({ migrating: true });
                    const migration = await migrateLocalStorageMirror(db);
                    emitStatus({ migrating: false, migrated: migration.ok, error: migration.ok ? null : migration.meta.migrationResult?.error || "migration_failed" });
                }
            }
            else {
                const meta = await getMigrationMeta(db);
                emitStatus({ migrating: meta.migrating, migrated: meta.migrated, error: meta.migrationResult?.success === false ? meta.migrationResult.error || null : null });
            }
        const meta = await getMigrationMeta(db);
        const prunedDead = await pruneDeadOutboxEvents(db, { olderThanMs: 6 * 60 * 60 * 1000, reasons: ["schema_incompatible_id"] });
        if (prunedDead.removed > 0) {
            console.warn("[SYNC ALERT] Eventos mortos removidos automaticamente do outbox", {
                removed: prunedDead.removed,
                ids: prunedDead.ids,
                reasons: ["schema_incompatible_id"],
            });
        }
        installDirectSupabaseCallInterceptor();
            const sender = options?.outboxSender || ((events) => sendBatchToSupabase(events));
            if (!meta.migrating) {
                outbox = createOutboxProcessor(db, { sender, maxBackoffMs: 30000 });
                outbox.start();
            }
            syncGateway = bindSyncGatewayRuntime(db, outbox);
            window.syncGateway = syncGateway;
            const boundGateway = syncGateway;
            window.__MM_FLUSH__ = (o) => {
                if (!boundGateway)
                    return Promise.resolve({ ok: false, reason: "gateway_unavailable" });
                const timeoutMs = Math.max(Number(o?.timeoutMs || 0), 1500);
                return withTimeout(boundGateway.flushNow(o), timeoutMs + 400, { ok: false, reason: "timeout" });
            };
            installBestEffortExitFlush();
            const auditFn = async () => {
                const currentMeta = await getMigrationMeta(db);
                const outboxSummaryRaw = await withTimeout(getOutboxStatusSummary(db), 1800, null);
                const auditTimedOut = !outboxSummaryRaw;
                const outboxSummary = outboxSummaryRaw || {
                    total: 0,
                    pending: 1,
                    dead: 0,
                    queued: 0,
                    sending: 1,
                    failed: 0,
                };
                const gatewayDiag = getSyncGatewayDiagnostics();
                const senderDiag = getOutboxSenderDiagnostics();
                return {
                    ready: Boolean(window.__MM_READY__),
                    readyAt: window.__MM_READY_AT__ || null,
                    meta: {
                        migrated: currentMeta.migrated,
                        migrating: currentMeta.migrating,
                    },
                    pendingOutboxCount: outboxSummary.pending,
                    deadOutboxCount: outboxSummary.dead,
                    lastFlushAt: gatewayDiag.lastFlushAt,
                    lastSendError: senderDiag.lastSendError,
                    auditTimedOut,
                };
            };
            window.__MM_AUDIT__ = auditFn;
            if (isDevEnv() &&
                window.__MM_LOG_STARTUP_AUDIT__ === true) {
                void auditFn().then((audit) => console.info("[MM STARTUP AUDIT]", audit));
            }
            installSyncStatusBadge(async () => (db ? getOutboxStatusSummary(db) : null));
            window.__MM_READY__ = true;
            window.__MM_READY_AT__ = Date.now();
            emitStatus({ ready: true });
        }
        catch (error) {
            console.warn("[startup] IndexedDB startup falhou; app permanece funcional com localStorage.", error);
            window.__MM_READY__ = true;
            window.__MM_READY_AT__ = Date.now();
            emitStatus({ ready: true, migrating: false, migrated: false, error: error instanceof Error ? error.message : String(error) });
        }
        return {
            db,
            storage,
            outbox,
            syncGateway,
            getMigrationStatus,
            subscribeMigrationStatus,
        };
    })();
    return startupRunPromise;
}
//# sourceMappingURL=startup.js.map
