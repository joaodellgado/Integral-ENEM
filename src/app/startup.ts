import { openAppDB } from "../db/openDB.js";
import { migrateLocalStorageMirror, getMigrationMeta } from "../db/migrateLocalStorageMirror.js";
import { createOutboxProcessor, getOutboxStatusSummary, pruneDeadOutboxEvents, type OutboxProcessorHandle } from "../db/outbox.js";
import { createStorageFacade, type StorageFacade } from "../db/storageFacade.js";
import { META_KEYS } from "../db/schema.js";
import { getByKey } from "../db/openDB.js";
import { STORES } from "../db/schema.js";
import { bindSyncGatewayRuntime, getSyncGatewayDiagnostics, syncGateway, type SyncGateway } from "../sync/syncGateway.js";
import { getOutboxSenderDiagnostics, sendBatchToSupabase } from "../sync/outboxSenderSupabase.js";
import { installDirectSupabaseCallInterceptor } from "../sync/devSupabaseDirectInterceptor.js";

export interface StartupServices {
  db: IDBDatabase | null;
  storage: StorageFacade;
  outbox?: OutboxProcessorHandle;
  syncGateway?: SyncGateway;
  getMigrationStatus: () => MigrationStatus;
  subscribeMigrationStatus: (listener: (status: MigrationStatus) => void) => () => void;
}

export interface MigrationStatus {
  ready: boolean;
  migrating: boolean;
  migrated: boolean;
  error: string | null;
}

const listeners = new Set<(status: MigrationStatus) => void>();
let currentStatus: MigrationStatus = {
  ready: false,
  migrating: false,
  migrated: false,
  error: null,
};
let startupRunPromise: Promise<StartupServices> | null = null;
let badgeTimer: number | null = null;
let lastSyncConsoleAlertKey: string | null = null;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> {
  return new Promise<T>((resolve) => {
    let settled = false;
    const timer = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      resolve(fallback);
    }, Math.max(1, timeoutMs));

    promise
      .then((value) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        resolve(value);
      })
      .catch(() => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        resolve(fallback);
      });
  });
}

function emitStatus(next: Partial<MigrationStatus>) {
  currentStatus = { ...currentStatus, ...next };
  for (const listener of listeners) listener(currentStatus);
}

export function getMigrationStatus(): MigrationStatus {
  return currentStatus;
}

export function subscribeMigrationStatus(listener: (status: MigrationStatus) => void): () => void {
  listeners.add(listener);
  listener(currentStatus);
  return () => listeners.delete(listener);
}

export function useMigrationStatus() {
  return { getSnapshot: getMigrationStatus, subscribe: subscribeMigrationStatus };
}

async function isMetaMigrating(db: IDBDatabase): Promise<boolean> {
  const rec = await getByKey<{ key: string; value: boolean }>(db, STORES.meta, META_KEYS.migrating);
  return Boolean(rec?.value);
}

function isDevEnv(): boolean {
  return (window as unknown as { __MM_ENV__?: string }).__MM_ENV__ === "dev" || /localhost|127\.0\.0\.1/.test(window.location.hostname);
}

function emitSyncConsoleAlert(
  level: "warn" | "error" | "info",
  message: string,
  details: Record<string, unknown>,
  dedupeKey?: string,
) {
  const stableKey = dedupeKey || `${level}:${message}:${JSON.stringify(details)}`;
  if (lastSyncConsoleAlertKey === stableKey) return;
  lastSyncConsoleAlertKey = stableKey;
  console[level](`[SYNC ALERT] ${message}`, details);
}

function installOutboxDropNotice() {
  const globalRef = window as unknown as { __MM_OUTBOX_DROP_NOTICE_INSTALLED__?: boolean };
  if (globalRef.__MM_OUTBOX_DROP_NOTICE_INSTALLED__) return;
  globalRef.__MM_OUTBOX_DROP_NOTICE_INSTALLED__ = true;
  let toast: HTMLDivElement | null = null;
  let hideTimer: number | null = null;

  const ensureToast = () => {
    if (toast) return toast;
    toast = document.createElement("div");
    toast.id = "mm-outbox-drop-notice";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    toast.style.cssText = [
      "position:fixed",
      "left:50%",
      "bottom:56px",
      "transform:translateX(-50%) translateY(8px)",
      "z-index:2147483647",
      "display:none",
      "max-width:min(92vw, 740px)",
      "padding:10px 14px",
      "border-radius:12px",
      "border:1px solid rgba(160,90,10,.22)",
      "background:rgba(138,82,12,.96)",
      "color:#fff",
      "font:600 13px/1.25 system-ui,sans-serif",
      "box-shadow:0 10px 26px rgba(0,0,0,.22)",
      "opacity:0",
      "transition:opacity .18s ease, transform .18s ease",
      "pointer-events:none",
      "text-align:center",
    ].join(";");
    document.body.appendChild(toast);
    return toast;
  };

  window.addEventListener("mm-outbox-drop", (event) => {
    const custom = event as CustomEvent<{ type?: string; key?: string; reason?: string; payloadOp?: string | null }>;
    const detail = custom.detail || {};
    const el = ensureToast();
    const scannerHint = /scanner|card|flashcard/i.test(`${detail.type || ""} ${detail.key || ""}`);
    el.textContent = scannerHint
      ? "A importacao do Scanner IA nao foi concluida. Itens invalidos foram removidos da fila de sincronizacao deste dispositivo."
      : "Alguns dados locais nao puderam ser sincronizados e foram removidos da fila para evitar travamento.";
    el.style.display = "block";
    el.style.opacity = "1";
    el.style.transform = "translateX(-50%) translateY(0)";
    if (hideTimer) window.clearTimeout(hideTimer);
    hideTimer = window.setTimeout(() => {
      if (!el) return;
      el.style.opacity = "0";
      el.style.transform = "translateX(-50%) translateY(8px)";
      window.setTimeout(() => {
        if (el) el.style.display = "none";
      }, 200);
    }, 5000);
  });
}

function installSyncStatusBadge(getSummary: () => Promise<{ pending: number; dead: number } | null>) {
  if (badgeTimer) window.clearInterval(badgeTimer);
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
  let badge = document.getElementById("mm-sync-badge") as HTMLButtonElement | null;
  let headerNotice = document.getElementById("mm-sync-header-notice") as HTMLDivElement | null;
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
      if (!isDevEnv() || typeof (window as unknown as { __MM_AUDIT__?: unknown }).__MM_AUDIT__ !== "function") return;
      const audit = await (window as unknown as { __MM_AUDIT__: () => Promise<unknown> }).__MM_AUDIT__();
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

  let lastVisibleState: "hidden" | "pending" | "dead" = "hidden";
  const setBadgeVisibilityState = (nextState: "hidden" | "pending" | "dead") => {
    if (lastVisibleState === nextState) return;
    lastVisibleState = nextState;
    (window as unknown as { __MM_SYNC_BADGE_VISIBLE__?: boolean }).__MM_SYNC_BADGE_VISIBLE__ = nextState !== "hidden";
    window.dispatchEvent(
      new CustomEvent("mm-sync-badge-visibilitychange", {
        detail: { state: nextState, visible: nextState !== "hidden" },
      }),
    );
  };

  const render = async () => {
    const summary = await withTimeout(getSummary().catch(() => null), 1800, null);
    if (!badge) return;
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
      emitSyncConsoleAlert(
        "error",
        "Eventos mortos detectados no outbox",
        {
          pending: summary.pending,
          dead: summary.dead,
          lastSendError: senderDiag.lastSendError,
          lastSendStatus: senderDiag.lastSendStatus,
          lastFlushAt: gatewayDiag.lastFlushAt,
          lastFlushReason: gatewayDiag.lastFlushReason,
        },
        `dead:${summary.dead}:${senderDiag.lastSendError || "none"}:${senderDiag.lastSendStatus || "none"}`,
      );
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
      emitSyncConsoleAlert(
        "warn",
        "Fila de sincronizacao com pendencias",
        {
          queued: summary.queued,
          sending: summary.sending,
          failed: summary.failed,
          dead: summary.dead,
          lastSendError: senderDiag.lastSendError,
          lastSendStatus: senderDiag.lastSendStatus,
        },
        `pending:${summary.queued}q+${summary.sending}s:${senderDiag.lastSendError || "none"}`,
      );
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
      } else {
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
    if (flushing) return;
    flushing = true;
    try {
      (window as unknown as { __MM_FLUSH_ON_EXIT__?: boolean }).__MM_FLUSH_ON_EXIT__ = true;
      if (typeof (window as unknown as { __MM_FLUSH__?: unknown }).__MM_FLUSH__ === "function") {
        await (window as unknown as { __MM_FLUSH__: (o?: { timeoutMs?: number }) => Promise<unknown> }).__MM_FLUSH__({ timeoutMs: 1200 });
      }
    } catch {
      /* noop */
    } finally {
      (window as unknown as { __MM_FLUSH_ON_EXIT__?: boolean }).__MM_FLUSH_ON_EXIT__ = false;
      flushing = false;
    }
  };

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) void flushOnExit();
  });
  window.addEventListener("pagehide", () => {
    void flushOnExit();
  });
  window.addEventListener("beforeunload", () => {
    void flushOnExit();
  });
}

export async function startupApp(options?: {
  outboxSender?: (events: import("../db/schema").OutboxRecord[]) => Promise<void | import("../db/outbox.js").OutboxSendResult>;
  runMigration?: boolean;
}): Promise<StartupServices> {
  if (startupRunPromise) return startupRunPromise;
  startupRunPromise = (async () => {
  const storage = createStorageFacade({ dualWriteLocalStorage: true, removeLocalOnDelete: false });

  let db: IDBDatabase | null = null;
  let outbox: OutboxProcessorHandle | undefined;
  let syncGateway: SyncGateway | undefined;

  try {
    db = await openAppDB();
    emitStatus({ ready: false, error: null });

    if (options?.runMigration !== false) {
      const preMeta = await getMigrationMeta(db);
      const shouldSkipDueToInsufficientStorage =
        !preMeta.migrated && preMeta.migrationResult?.error === "INSUFFICIENT_STORAGE";
      if (shouldSkipDueToInsufficientStorage) {
        emitStatus({
          migrating: false,
          migrated: false,
          error: preMeta.migrationResult?.error || "INSUFFICIENT_STORAGE",
        });
      } else {
      emitStatus({ migrating: true });
      const migration = await migrateLocalStorageMirror(db);
      emitStatus({ migrating: false, migrated: migration.ok, error: migration.ok ? null : migration.meta.migrationResult?.error || "migration_failed" });
      }
    } else {
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
    const sender = options?.outboxSender || ((events: import("../db/schema").OutboxRecord[]) => sendBatchToSupabase(events));
    if (!meta.migrating) {
      outbox = createOutboxProcessor(db, { sender, maxBackoffMs: 30_000 });
      outbox.start();
    }
    syncGateway = bindSyncGatewayRuntime(db, outbox);
    (window as unknown as { syncGateway?: SyncGateway }).syncGateway = syncGateway;
    const boundGateway = syncGateway;
    (window as unknown as { __MM_FLUSH__?: (o?: { timeoutMs?: number }) => Promise<{ ok: boolean; reason?: string }> }).__MM_FLUSH__ = (
      o,
    ) => {
      if (!boundGateway) return Promise.resolve({ ok: false, reason: "gateway_unavailable" });
      const timeoutMs = Math.max(Number(o?.timeoutMs || 0), 1500);
      return withTimeout(boundGateway.flushNow(o), timeoutMs + 400, { ok: false, reason: "timeout" });
    };
    installBestEffortExitFlush();
    installOutboxDropNotice();

    const auditFn = async () => {
      const currentMeta = await getMigrationMeta(db!);
      const outboxSummaryRaw = await withTimeout(getOutboxStatusSummary(db!), 1800, null);
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
        ready: Boolean((window as unknown as { __MM_READY__?: boolean }).__MM_READY__),
        readyAt: (window as unknown as { __MM_READY_AT__?: number | null }).__MM_READY_AT__ || null,
        meta: {
          migrated: currentMeta.migrated,
          migrating: currentMeta.migrating,
        },
        pendingOutboxCount: outboxSummary.pending,
        deadOutboxCount: outboxSummary.dead,
        lastFlushAt: gatewayDiag.lastFlushAt,
        lastSendError: senderDiag.lastSendError,
        droppedUnsupportedOutboxCount: senderDiag.droppedUnsupportedCount,
        lastDroppedUnsupportedOutbox: senderDiag.lastDroppedUnsupported,
        auditTimedOut,
      };
    };
    (window as unknown as { __MM_AUDIT__?: () => Promise<unknown> }).__MM_AUDIT__ = auditFn;
    if (
      isDevEnv() &&
      (window as unknown as { __MM_LOG_STARTUP_AUDIT__?: boolean }).__MM_LOG_STARTUP_AUDIT__ === true
    ) {
      void auditFn().then((audit) => console.info("[MM STARTUP AUDIT]", audit));
    }
    installSyncStatusBadge(async () => (db ? getOutboxStatusSummary(db) : null));

    (window as unknown as { __MM_READY__?: boolean }).__MM_READY__ = true;
    (window as unknown as { __MM_READY_AT__?: number }).__MM_READY_AT__ = Date.now();

    emitStatus({ ready: true });
  } catch (error) {
    console.warn("[startup] IndexedDB startup falhou; app permanece funcional com localStorage.", error);
    (window as unknown as { __MM_READY__?: boolean }).__MM_READY__ = true;
    (window as unknown as { __MM_READY_AT__?: number }).__MM_READY_AT__ = Date.now();
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
