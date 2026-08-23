export const DB_NAME = "matrizMentoriaDB";
export const DB_VERSION = 1;
export const STORES = {
    localStorageMirror: "localStorageMirror",
    meta: "meta",
    outbox: "outbox",
};
export const META_KEYS = {
    schemaVersion: "schemaVersion",
    migrationVersion: "migrationVersion",
    migrating: "migrating",
    migrated: "migrated",
    migratedAt: "migratedAt",
    migrateStats: "migrateStats",
    sourceSnapshot: "sourceSnapshot",
    targetSnapshot: "targetSnapshot",
    migrationResult: "migrationResult",
    migrationLock: "migrationLock",
    auditWarnings: "auditWarnings",
    skippedLargeKeys: "skippedLargeKeys",
    checksumPendingCount: "checksumPendingCount",
    shadowAuditExpiresAt: "shadowAuditExpiresAt",
};
export const MIGRATION_VERSION = 1;
export const SCHEMA_VERSION = 1;
export const MIGRATION_LOGS = {
    START: "MIGRATION_START",
    PROGRESS: "MIGRATION_PROGRESS",
    DONE: "MIGRATION_DONE",
    FAIL: "MIGRATION_FAIL",
};
export const OUTBOX_LOGS = {
    ENQUEUE: "OUTBOX_ENQUEUE",
    BATCH_SENT: "OUTBOX_BATCH_SENT",
    FAIL_BACKOFF: "OUTBOX_FAIL_BACKOFF",
};
export function isAuthSensitiveKey(key) {
    const normalized = String(key || "").toLowerCase();
    return normalized.startsWith("sb-") || (normalized.includes("auth") && normalized.includes("token"));
}
export function shouldMigrateKey(key) {
    const normalized = String(key || "");
    if (!normalized)
        return false;
    if (isAuthSensitiveKey(normalized))
        return false;
    if (normalized === "mm_theme")
        return false;
    if (normalized.startsWith("mm_"))
        return true;
    if (normalized.startsWith("study-"))
        return true;
    if (normalized === "study-goals")
        return true;
    if (normalized === "lista-diagramacao")
        return true;
    if (normalized.startsWith("study-schedule-"))
        return true;
    return false;
}
export function bytesOfString(value) {
    try {
        return new TextEncoder().encode(value).byteLength;
    }
    catch {
        return value.length;
    }
}
export async function sha256Hex(input) {
    const c = globalThis.crypto;
    if (!c?.subtle) {
        throw new Error("WebCrypto (crypto.subtle) indisponivel para checksum SHA-256.");
    }
    const data = new TextEncoder().encode(input);
    const digest = await c.subtle.digest("SHA-256", data);
    const bytes = new Uint8Array(digest);
    let hex = "";
    for (let i = 0; i < bytes.length; i += 1)
        hex += bytes[i].toString(16).padStart(2, "0");
    return hex;
}
export function nowMs() {
    return Date.now();
}
export async function yieldToMainThread() {
    const schedulerApi = globalThis.scheduler;
    if (schedulerApi?.postTask) {
        await schedulerApi.postTask(() => { });
        return;
    }
    await new Promise((resolve) => setTimeout(resolve, 0));
}
export function logEvent(name, payload = {}) {
    if (!shouldDebugClientLogs())
        return;
    const stamp = new Date().toISOString();
    console.info(`[${name}]`, { ts: stamp, ...payload });
}
export function randomId(prefix = "evt") {
    return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;
}
export function requestIdle() {
    const ric = globalThis.requestIdleCallback;
    if (ric) {
        return new Promise((resolve) => {
            ric(() => resolve());
        });
    }
    return yieldToMainThread();
}
export function shouldDebugClientLogs() {
    try {
        const g = globalThis;
        const win = g.window;
        if (!win)
            return false;
        if (win.__MM_ENV__ === "dev")
            return true;
        const host = win.location?.hostname || "";
        return host === "localhost" || host === "127.0.0.1";
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=schema.js.map