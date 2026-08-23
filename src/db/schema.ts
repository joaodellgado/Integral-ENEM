export const DB_NAME = "matrizMentoriaDB";
export const DB_VERSION = 1;

export const STORES = {
  localStorageMirror: "localStorageMirror",
  meta: "meta",
  outbox: "outbox",
} as const;

export type StoreName = (typeof STORES)[keyof typeof STORES];

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
} as const;

export const MIGRATION_VERSION = 1;
export const SCHEMA_VERSION = 1;

export interface LocalStorageMirrorRecord {
  key: string;
  value: string;
  checksum: string;
  checksumPending?: boolean;
  size: number;
  updatedAt: number;
  migratedAt: number;
}

export interface MigrationLock {
  ownerId: string;
  acquiredAt: number;
  expiresAt: number;
}

export interface MetaRecord<T = unknown> {
  key: string;
  value: T;
  updatedAt: number;
}

export type OutboxStatus = "queued" | "sending" | "done" | "failed" | "dead";

export interface OutboxRecord {
  id: string;
  userId: string | null;
  type: string;
  key: string;
  payload: unknown;
  createdAt: number;
  status: OutboxStatus;
  retryCount: number;
  lastAttemptAt: number | null;
  nextAttemptAt?: number | null;
  dedupeKey?: string;
}

export interface MigrationStats {
  totalKeys: number;
  migratedKeys: number;
  skippedKeys: number;
  totalBytes: number;
  durationMs: number;
}

export interface SnapshotInfo {
  keys: string[];
  checksumsByKey: Record<string, string>;
  totalBytes: number;
}

export interface MigrationResultMeta {
  success: boolean;
  warnings: string[];
  error?: string;
  details?: Record<string, unknown>;
}

export interface MigrationMetaState {
  schemaVersion: number;
  migrationVersion: number;
  migrating: boolean;
  migrated: boolean;
  migratedAt: number | null;
  migrateStats: MigrationStats | null;
  sourceSnapshot: SnapshotInfo | null;
  targetSnapshot: SnapshotInfo | null;
  migrationResult: MigrationResultMeta | null;
  migrationLock?: MigrationLock | null;
  auditWarnings?: string[] | null;
  skippedLargeKeys?: string[] | null;
  checksumPendingCount?: number | null;
  shadowAuditExpiresAt?: number | null;
}

export interface MigrationLogPayload {
  [key: string]: unknown;
}

export const MIGRATION_LOGS = {
  START: "MIGRATION_START",
  PROGRESS: "MIGRATION_PROGRESS",
  DONE: "MIGRATION_DONE",
  FAIL: "MIGRATION_FAIL",
} as const;

export const OUTBOX_LOGS = {
  ENQUEUE: "OUTBOX_ENQUEUE",
  BATCH_SENT: "OUTBOX_BATCH_SENT",
  FAIL_BACKOFF: "OUTBOX_FAIL_BACKOFF",
} as const;

export function isAuthSensitiveKey(key: string): boolean {
  const normalized = String(key || "").toLowerCase();
  return normalized.startsWith("sb-") || (normalized.includes("auth") && normalized.includes("token"));
}

export function shouldMigrateKey(key: string): boolean {
  const normalized = String(key || "");
  if (!normalized) return false;
  if (isAuthSensitiveKey(normalized)) return false;
  if (normalized === "mm_theme") return false;
  if (normalized.startsWith("mm_")) return true;
  if (normalized.startsWith("study-")) return true;
  if (normalized === "study-goals") return true;
  if (normalized === "lista-diagramacao") return true;
  if (normalized.startsWith("study-schedule-")) return true;
  return false;
}

export function bytesOfString(value: string): number {
  try {
    return new TextEncoder().encode(value).byteLength;
  } catch {
    return value.length;
  }
}

export async function sha256Hex(input: string): Promise<string> {
  const c = globalThis.crypto as Crypto | undefined;
  if (!c?.subtle) {
    throw new Error("WebCrypto (crypto.subtle) indisponivel para checksum SHA-256.");
  }
  const data = new TextEncoder().encode(input);
  const digest = await c.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(digest);
  let hex = "";
  for (let i = 0; i < bytes.length; i += 1) hex += bytes[i].toString(16).padStart(2, "0");
  return hex;
}

export function nowMs(): number {
  return Date.now();
}

export async function yieldToMainThread(): Promise<void> {
  const schedulerApi = (globalThis as { scheduler?: { postTask?: (cb: () => void) => Promise<void> } }).scheduler;
  if (schedulerApi?.postTask) {
    await schedulerApi.postTask(() => {});
    return;
  }
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

export function logEvent(name: string, payload: MigrationLogPayload = {}): void {
  if (!shouldDebugClientLogs()) return;
  const stamp = new Date().toISOString();
  console.info(`[${name}]`, { ts: stamp, ...payload });
}

export function randomId(prefix = "evt"): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;
}

export function requestIdle(): Promise<void> {
  const ric = (globalThis as { requestIdleCallback?: (cb: IdleRequestCallback) => number }).requestIdleCallback;
  if (ric) {
    return new Promise<void>((resolve) => {
      ric(() => resolve());
    });
  }
  return yieldToMainThread();
}

export function shouldDebugClientLogs(): boolean {
  try {
    const g = globalThis as { window?: Window & { __MM_ENV__?: string } };
    const win = g.window;
    if (!win) return false;
    if (win.__MM_ENV__ === "dev") return true;
    const host = win.location?.hostname || "";
    return host === "localhost" || host === "127.0.0.1";
  } catch {
    return false;
  }
}
