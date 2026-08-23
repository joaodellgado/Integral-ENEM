import {
  META_KEYS,
  MIGRATION_LOGS,
  MIGRATION_VERSION,
  SCHEMA_VERSION,
  STORES,
  bytesOfString,
  logEvent,
  nowMs,
  requestIdle,
  sha256Hex,
  shouldMigrateKey,
  yieldToMainThread,
  randomId,
  type LocalStorageMirrorRecord,
  type MigrationLock,
  type MigrationMetaState,
  type MigrationResultMeta,
  type MigrationStats,
  type SnapshotInfo,
} from "./schema.js";
import { getAllFromStore, getByKey, withStore } from "./openDB.js";

const DEFAULT_CHUNK_KEYS = 20;
const DEFAULT_MAX_BYTES_PER_CHUNK = 2 * 1024 * 1024;
const LARGE_VALUE_BYTES = 2 * 1024 * 1024;
const SMALL_KEY_MIGRATION_LIMIT_BYTES = 200 * 1024;
const STORAGE_MARGIN = 1.2;
const LOCK_TTL_MS = 30_000;
const LOCK_HEARTBEAT_MS = 10_000;
const CHECKSUM_PENDING_WAIT_TIMEOUT_MS = 20_000;
const CHECKSUM_PENDING_POLL_MS = 120;
const SHADOW_AUDIT_MIN_KEYS = 20;
const SHADOW_AUDIT_SAMPLE_RATE = 0.02;
const SHADOW_AUDIT_WINDOW_MS = 24 * 60 * 60 * 1000;

export interface MigrateMirrorOptions {
  chunkKeys?: number;
  maxBytesPerChunk?: number;
  onBeforeProcessKey?: (ctx: { key: string; phase: 1 | 2 | 3; processed: number }) => void | Promise<void>;
  logger?: (event: string, payload: Record<string, unknown>) => void;
  storageEstimateOverride?: { usage?: number; quota?: number } | null;
  lockOwnerId?: string;
  disableShadowAudit?: boolean;
}

export interface MigrationRunResult {
  ok: boolean;
  resumed: boolean;
  stats: MigrationStats;
  warnings: string[];
  meta: MigrationMetaState;
}

interface PassContext {
  keys: string[];
  sourceChecksums: Record<string, string>;
  sourceSizes: Record<string, number>;
  sourceTotalBytes: number;
  migratedKeys: number;
  skippedKeys: number;
  skippedLargeKeys: string[];
}

interface MetaMap {
  [key: string]: unknown;
}

interface LocalEntryComputed {
  value: string;
  checksum: string;
  size: number;
  checksumPending: boolean;
}

interface StoragePressureInfo {
  bytesToMigrate: number;
  usage?: number;
  quota?: number;
  freeSpace?: number;
  canFit: boolean;
  fallbackToSmallKeys: boolean;
  selectedKeys: string[];
  skippedLargeKeys: string[];
}

function getLogger(options?: MigrateMirrorOptions) {
  return (event: string, payload: Record<string, unknown>) => {
    if (options?.logger) return options.logger(event, payload);
    logEvent(event, payload);
  };
}

async function setMetaBulk(db: IDBDatabase, entries: Record<string, unknown>): Promise<void> {
  await withStore<void>(db, STORES.meta, "readwrite", async (store) => {
    const timestamp = nowMs();
    for (const [key, value] of Object.entries(entries)) {
      store.put({ key, value, updatedAt: timestamp });
    }
  });
}

async function getMetaValue<T>(db: IDBDatabase, key: string): Promise<T | undefined> {
  const rec = await getByKey<{ key: string; value: T; updatedAt: number }>(db, STORES.meta, key);
  return rec?.value;
}

async function getMigrationMetaState(db: IDBDatabase): Promise<MigrationMetaState> {
  const keys = Object.values(META_KEYS);
  const values = await Promise.all(keys.map((k) => getMetaValue(db, k)));
  const map: MetaMap = {};
  keys.forEach((k, i) => {
    map[k] = values[i];
  });
  return {
    schemaVersion: Number(map[META_KEYS.schemaVersion] || SCHEMA_VERSION),
    migrationVersion: Number(map[META_KEYS.migrationVersion] || 0),
    migrating: Boolean(map[META_KEYS.migrating]),
    migrated: Boolean(map[META_KEYS.migrated]),
    migratedAt: (map[META_KEYS.migratedAt] as number | null) ?? null,
    migrateStats: (map[META_KEYS.migrateStats] as MigrationStats | null) ?? null,
    sourceSnapshot: (map[META_KEYS.sourceSnapshot] as SnapshotInfo | null) ?? null,
    targetSnapshot: (map[META_KEYS.targetSnapshot] as SnapshotInfo | null) ?? null,
    migrationResult: (map[META_KEYS.migrationResult] as MigrationResultMeta | null) ?? null,
    migrationLock: (map[META_KEYS.migrationLock] as MigrationLock | null) ?? null,
    auditWarnings: (map[META_KEYS.auditWarnings] as string[] | null) ?? null,
    skippedLargeKeys: (map[META_KEYS.skippedLargeKeys] as string[] | null) ?? null,
    checksumPendingCount: (map[META_KEYS.checksumPendingCount] as number | null) ?? null,
    shadowAuditExpiresAt: (map[META_KEYS.shadowAuditExpiresAt] as number | null) ?? null,
  };
}

function listSelectedLocalStorageKeys(storage: Storage): string[] {
  const keys: string[] = [];
  for (let i = 0; i < storage.length; i += 1) {
    const key = storage.key(i);
    if (!key) continue;
    if (shouldMigrateKey(key)) keys.push(key);
  }
  keys.sort();
  return keys;
}

async function getMirrorRecord(db: IDBDatabase, key: string): Promise<LocalStorageMirrorRecord | undefined> {
  return getByKey<LocalStorageMirrorRecord>(db, STORES.localStorageMirror, key);
}

async function upsertMirrorRecord(db: IDBDatabase, record: LocalStorageMirrorRecord): Promise<void> {
  await withStore<void>(db, STORES.localStorageMirror, "readwrite", async (store) => {
    store.put(record);
  });
}

async function getMirrorRecordsByKeys(db: IDBDatabase, keys: string[]): Promise<Map<string, LocalStorageMirrorRecord>> {
  const map = new Map<string, LocalStorageMirrorRecord>();
  if (!keys.length) return map;
  await withStore<void>(db, STORES.localStorageMirror, "readonly", async (store) => {
    for (const key of keys) {
      const req = store.get(key);
      const rec = await new Promise<LocalStorageMirrorRecord | undefined>((resolve, reject) => {
        req.onsuccess = () => resolve(req.result as LocalStorageMirrorRecord | undefined);
        req.onerror = () => reject(req.error || new Error("IDB get failed"));
      });
      if (rec) map.set(key, rec);
    }
  });
  return map;
}

async function processKeysInChunks(
  keys: string[],
  options: Required<Pick<MigrateMirrorOptions, "chunkKeys" | "maxBytesPerChunk">>,
  runner: (key: string, index: number) => Promise<number | void>,
): Promise<void> {
  let bytesInChunk = 0;
  let keysInChunk = 0;
  for (let i = 0; i < keys.length; i += 1) {
    const bytesUsed = await runner(keys[i], i);
    keysInChunk += 1;
    bytesInChunk += Math.max(0, Number(bytesUsed) || 0);
    if (keysInChunk >= options.chunkKeys || bytesInChunk >= options.maxBytesPerChunk) {
      keysInChunk = 0;
      bytesInChunk = 0;
      await yieldToMainThread();
    }
  }
}

async function checksumValue(value: string): Promise<string> {
  return sha256Hex(value);
}

async function computeCurrentLocalEntry(storage: Storage, key: string): Promise<LocalEntryComputed | null> {
  const value = storage.getItem(key);
  if (value == null) return null;
  const size = bytesOfString(value);
  if (size > LARGE_VALUE_BYTES) {
    return { value, size, checksum: "", checksumPending: true };
  }
  const checksum = await checksumValue(value);
  return { value, checksum, size, checksumPending: false };
}

function isQuotaExceededError(error: unknown): boolean {
  if (!error) return false;
  const msg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  const name = (error as { name?: string }).name?.toLowerCase?.() || "";
  return name.includes("quota") || msg.includes("quota") || msg.includes("insufficient") || msg.includes("space");
}

async function estimateStoragePressure(storage: Storage, options?: MigrateMirrorOptions): Promise<StoragePressureInfo> {
  const allKeys = listSelectedLocalStorageKeys(storage);
  let bytesToMigrate = 0;
  const sizesByKey = new Map<string, number>();
  for (const key of allKeys) {
    const value = storage.getItem(key);
    if (value == null) continue;
    const size = bytesOfString(value);
    sizesByKey.set(key, size);
    bytesToMigrate += size;
  }

  const estimate = options?.storageEstimateOverride ?? (await globalThis.navigator?.storage?.estimate?.().catch?.(() => null));
  const usage = typeof estimate?.usage === "number" ? estimate.usage : undefined;
  const quota = typeof estimate?.quota === "number" ? estimate.quota : undefined;
  const freeSpace = usage != null && quota != null ? Math.max(0, quota - usage) : undefined;
  const canFit = freeSpace == null ? true : freeSpace >= bytesToMigrate * STORAGE_MARGIN;

  if (canFit) {
    return {
      bytesToMigrate,
      usage,
      quota,
      freeSpace,
      canFit: true,
      fallbackToSmallKeys: false,
      selectedKeys: allKeys,
      skippedLargeKeys: [],
    };
  }

  const selectedKeys = allKeys.filter((key) => (sizesByKey.get(key) || 0) < SMALL_KEY_MIGRATION_LIMIT_BYTES);
  const skippedLargeKeys = allKeys.filter((key) => !selectedKeys.includes(key));
  return {
    bytesToMigrate,
    usage,
    quota,
    freeSpace,
    canFit: false,
    fallbackToSmallKeys: true,
    selectedKeys,
    skippedLargeKeys,
  };
}

async function acquireMigrationLock(db: IDBDatabase, ownerId: string): Promise<{ acquired: boolean; lock: MigrationLock | null }> {
  return withStore<{ acquired: boolean; lock: MigrationLock | null }>(db, STORES.meta, "readwrite", async (store) => {
    const now = nowMs();
    const req = store.get(META_KEYS.migrationLock);
    const current = await new Promise<{ key: string; value: MigrationLock; updatedAt: number } | undefined>((resolve, reject) => {
      req.onsuccess = () => resolve(req.result as { key: string; value: MigrationLock; updatedAt: number } | undefined);
      req.onerror = () => reject(req.error || new Error("lock read failed"));
    });
    const existing = current?.value || null;
    if (existing && existing.ownerId !== ownerId && existing.expiresAt > now) {
      return { acquired: false, lock: existing };
    }
    const lock: MigrationLock = { ownerId, acquiredAt: now, expiresAt: now + LOCK_TTL_MS };
    store.put({ key: META_KEYS.migrationLock, value: lock, updatedAt: now });
    return { acquired: true, lock };
  });
}

async function refreshMigrationLock(db: IDBDatabase, ownerId: string): Promise<boolean> {
  const outcome = await acquireMigrationLock(db, ownerId);
  return outcome.acquired && outcome.lock?.ownerId === ownerId;
}

async function releaseMigrationLock(db: IDBDatabase, ownerId: string): Promise<void> {
  await withStore<void>(db, STORES.meta, "readwrite", async (store) => {
    const req = store.get(META_KEYS.migrationLock);
    const current = await new Promise<{ key: string; value: MigrationLock; updatedAt: number } | undefined>((resolve, reject) => {
      req.onsuccess = () => resolve(req.result as { key: string; value: MigrationLock; updatedAt: number } | undefined);
      req.onerror = () => reject(req.error || new Error("lock read failed"));
    });
    if (current?.value?.ownerId === ownerId) {
      store.delete(META_KEYS.migrationLock);
    }
  });
}

function startLockHeartbeat(db: IDBDatabase, ownerId: string) {
  let timer: number | null = null;
  let stopped = false;
  const tick = async () => {
    if (stopped) return;
    try {
      await refreshMigrationLock(db, ownerId);
    } catch (error) {
      console.warn("[migration] failed to refresh lock heartbeat", error);
    } finally {
      if (!stopped) timer = window.setTimeout(() => void tick(), LOCK_HEARTBEAT_MS);
    }
  };
  timer = window.setTimeout(() => void tick(), LOCK_HEARTBEAT_MS);
  return () => {
    stopped = true;
    if (timer) window.clearTimeout(timer);
  };
}

async function finalizePendingChecksums(
  db: IDBDatabase,
  keys: string[],
  storage: Storage,
  options: Required<Pick<MigrateMirrorOptions, "chunkKeys" | "maxBytesPerChunk">>,
  logger: ReturnType<typeof getLogger>,
): Promise<void> {
  const started = nowMs();
  while (true) {
    const records = await getMirrorRecordsByKeys(db, keys);
    const pending = keys.filter((key) => records.get(key)?.checksumPending);
    if (!pending.length) {
      await setMetaBulk(db, { [META_KEYS.checksumPendingCount]: 0 });
      return;
    }
    if (nowMs() - started > CHECKSUM_PENDING_WAIT_TIMEOUT_MS) {
      throw new Error("CHECKSUM_PENDING_TIMEOUT");
    }
    logger(MIGRATION_LOGS.PROGRESS, { phase: "checksum_idle", pending: pending.length });

    await processKeysInChunks(pending, options, async (key) => {
      await requestIdle();
      const value = storage.getItem(key);
      if (value == null) return 0;
      const checksum = await checksumValue(value);
      const size = bytesOfString(value);
      await upsertMirrorRecord(db, {
        key,
        value,
        checksum,
        checksumPending: false,
        size,
        updatedAt: nowMs(),
        migratedAt: nowMs(),
      });
      return size;
    });
  }
}

async function passOneCopy(
  db: IDBDatabase,
  storage: Storage,
  ctx: PassContext,
  options: Required<Pick<MigrateMirrorOptions, "chunkKeys" | "maxBytesPerChunk">> & Pick<MigrateMirrorOptions, "onBeforeProcessKey">,
  logger: ReturnType<typeof getLogger>,
): Promise<void> {
  const existing = await getMirrorRecordsByKeys(db, ctx.keys);
  let processed = 0;
  let chunkMigrated = 0;
  let chunkSkipped = 0;
  let chunkBytes = 0;
  let pendingCount = 0;

  await processKeysInChunks(ctx.keys, options, async (key) => {
    processed += 1;
    await options.onBeforeProcessKey?.({ key, phase: 1, processed });
    const entry = await computeCurrentLocalEntry(storage, key);
    if (!entry) {
      ctx.skippedKeys += 1;
      chunkSkipped += 1;
      return 0;
    }

    const effectiveChecksum = entry.checksumPending ? `PENDING:${entry.size}` : entry.checksum;
    ctx.sourceChecksums[key] = effectiveChecksum;
    ctx.sourceSizes[key] = entry.size;
    ctx.sourceTotalBytes += entry.size;
    chunkBytes += entry.size;

    const existingRec = existing.get(key);
    if (
      existingRec &&
      existingRec.value === entry.value &&
      existingRec.size === entry.size &&
      Boolean(existingRec.checksumPending) === entry.checksumPending &&
      (entry.checksumPending || existingRec.checksum === entry.checksum)
    ) {
      ctx.skippedKeys += 1;
      chunkSkipped += 1;
      return entry.size;
    }

    try {
      await upsertMirrorRecord(db, {
        key,
        value: entry.value,
        checksum: entry.checksumPending ? "" : entry.checksum,
        checksumPending: entry.checksumPending,
        size: entry.size,
        updatedAt: nowMs(),
        migratedAt: nowMs(),
      });
    } catch (error) {
      if (isQuotaExceededError(error)) throw new Error("INSUFFICIENT_STORAGE:QuotaExceededError");
      throw error;
    }

    if (entry.checksumPending) pendingCount += 1;
    ctx.migratedKeys += 1;
    chunkMigrated += 1;

    if ((chunkMigrated + chunkSkipped) % Math.max(1, options.chunkKeys) === 0) {
      await setMetaBulk(db, { [META_KEYS.checksumPendingCount]: pendingCount });
      logger(MIGRATION_LOGS.PROGRESS, {
        phase: 1,
        processed,
        total: ctx.keys.length,
        migratedKeys: ctx.migratedKeys,
        skippedKeys: ctx.skippedKeys,
        checksumPendingCount: pendingCount,
        chunkBytes,
      });
      chunkBytes = 0;
    }
    return entry.size;
  });

  await setMetaBulk(db, { [META_KEYS.checksumPendingCount]: pendingCount });
}

async function secondPassRefreshChangedKeys(
  db: IDBDatabase,
  storage: Storage,
  ctx: PassContext,
  options: Required<Pick<MigrateMirrorOptions, "chunkKeys" | "maxBytesPerChunk">> & Pick<MigrateMirrorOptions, "onBeforeProcessKey">,
  logger: ReturnType<typeof getLogger>,
  warnings: string[],
): Promise<void> {
  let processed = 0;
  await processKeysInChunks(ctx.keys, options, async (key) => {
    processed += 1;
    await options.onBeforeProcessKey?.({ key, phase: 2, processed });
    const latest = await computeCurrentLocalEntry(storage, key);
    if (!latest) {
      warnings.push(`Key removida durante migracao: ${key}`);
      return 0;
    }
    const prevChecksum = ctx.sourceChecksums[key];
    const latestComparableChecksum = latest.checksumPending ? `PENDING:${latest.size}` : latest.checksum;
    if (prevChecksum && prevChecksum === latestComparableChecksum) return latest.size;

    warnings.push(`Key alterada durante migracao (2nd pass refresh): ${key}`);
    ctx.sourceChecksums[key] = latestComparableChecksum;
    ctx.sourceSizes[key] = latest.size;

    try {
      await upsertMirrorRecord(db, {
        key,
        value: latest.value,
        checksum: latest.checksumPending ? "" : latest.checksum,
        checksumPending: latest.checksumPending,
        size: latest.size,
        updatedAt: nowMs(),
        migratedAt: nowMs(),
      });
    } catch (error) {
      if (isQuotaExceededError(error)) throw new Error("INSUFFICIENT_STORAGE:QuotaExceededError");
      throw error;
    }
    return latest.size;
  });

  logger(MIGRATION_LOGS.PROGRESS, { phase: 2, processed, total: ctx.keys.length, warnings: warnings.length });
}

async function buildSourceSnapshot(ctx: PassContext): Promise<SnapshotInfo> {
  const keys = [...ctx.keys];
  let totalBytes = 0;
  for (const key of keys) totalBytes += ctx.sourceSizes[key] || 0;
  return { keys, checksumsByKey: { ...ctx.sourceChecksums }, totalBytes };
}

async function buildTargetSnapshotAndValidate(
  db: IDBDatabase,
  sourceSnapshot: SnapshotInfo,
  options: Required<Pick<MigrateMirrorOptions, "chunkKeys" | "maxBytesPerChunk">> & Pick<MigrateMirrorOptions, "onBeforeProcessKey">,
  logger: ReturnType<typeof getLogger>,
): Promise<{ targetSnapshot: SnapshotInfo; mismatches: string[]; pendingCount: number }> {
  const checksumsByKey: Record<string, string> = {};
  let totalBytes = 0;
  const mismatches: string[] = [];
  let processed = 0;
  let pendingCount = 0;

  await processKeysInChunks(sourceSnapshot.keys, options, async (key) => {
    processed += 1;
    await options.onBeforeProcessKey?.({ key, phase: 3, processed });
    const rec = await getMirrorRecord(db, key);
    if (!rec) {
      mismatches.push(`Ausente no IDB: ${key}`);
      return 0;
    }
    if (rec.checksumPending) {
      pendingCount += 1;
      checksumsByKey[key] = `PENDING:${rec.size}`;
      totalBytes += Number(rec.size) || 0;
      return Number(rec.size) || 0;
    }

    checksumsByKey[key] = rec.checksum;
    totalBytes += Number(rec.size) || 0;
    if (checksumsByKey[key] !== sourceSnapshot.checksumsByKey[key]) {
      mismatches.push(`Checksum divergente: ${key}`);
    }
    return Number(rec.size) || 0;
  });

  logger(MIGRATION_LOGS.PROGRESS, {
    phase: 3,
    processed,
    total: sourceSnapshot.keys.length,
    mismatches: mismatches.length,
    checksumPendingCount: pendingCount,
  });

  return {
    targetSnapshot: { keys: [...sourceSnapshot.keys], checksumsByKey, totalBytes },
    mismatches,
    pendingCount,
  };
}

function sameSnapshotKeys(a: SnapshotInfo, b: SnapshotInfo): boolean {
  if (a.keys.length !== b.keys.length) return false;
  for (let i = 0; i < a.keys.length; i += 1) if (a.keys[i] !== b.keys[i]) return false;
  return true;
}

async function maybeRunShadowAudit(
  db: IDBDatabase,
  storage: Storage,
  sourceKeys: string[],
  options: MigrateMirrorOptions,
  warnings: string[],
): Promise<void> {
  if (options.disableShadowAudit) return;
  const now = nowMs();
  const meta = await getMigrationMetaState(db);
  let expiresAt = meta.shadowAuditExpiresAt || 0;
  if (!expiresAt || expiresAt < now) {
    expiresAt = now + SHADOW_AUDIT_WINDOW_MS;
    await setMetaBulk(db, { [META_KEYS.shadowAuditExpiresAt]: expiresAt });
  }
  if (now > expiresAt) return;

  const count = sourceKeys.length;
  const sampleCount = Math.min(count, Math.max(SHADOW_AUDIT_MIN_KEYS, Math.ceil(count * SHADOW_AUDIT_SAMPLE_RATE)));
  if (sampleCount <= 0) return;

  const shuffled = [...sourceKeys].sort(() => Math.random() - 0.5).slice(0, sampleCount);
  const auditWarnings: string[] = [];

  for (const key of shuffled) {
    await requestIdle();
    const value = storage.getItem(key);
    if (value == null) continue;
    const sourceChecksum = await sha256Hex(value);
    const rec = await getMirrorRecord(db, key);
    if (!rec || rec.checksumPending || rec.checksum !== sourceChecksum) {
      auditWarnings.push(`Shadow audit divergence fixed: ${key}`);
      await upsertMirrorRecord(db, {
        key,
        value,
        checksum: sourceChecksum,
        checksumPending: false,
        size: bytesOfString(value),
        updatedAt: nowMs(),
        migratedAt: rec?.migratedAt || nowMs(),
      });
    }
  }

  if (auditWarnings.length) {
    const mergedWarnings = [...(meta.auditWarnings || []), ...auditWarnings].slice(-200);
    await setMetaBulk(db, { [META_KEYS.auditWarnings]: mergedWarnings });
    warnings.push(...auditWarnings);
  }
}

export async function verifyMigrationIntegrity(db: IDBDatabase): Promise<{
  ok: boolean;
  migrated: boolean;
  pendingChecksumKeys: string[];
  countMatch: boolean;
  checksumMismatches: string[];
  warnings: string[];
}> {
  const meta = await getMigrationMetaState(db);
  const migrated = Boolean(meta.migrated);
  const warnings = [...(meta.migrationResult?.warnings || []), ...(meta.auditWarnings || [])];
  const keys = listSelectedLocalStorageKeys(localStorage);
  const mirrorMap = await getMirrorRecordsByKeys(db, keys);
  const pendingChecksumKeys = keys.filter((k) => mirrorMap.get(k)?.checksumPending);
  const countMatch = mirrorMap.size === keys.length;
  const checksumMismatches: string[] = [];

  for (const key of keys) {
    const rec = mirrorMap.get(key);
    if (!rec) {
      checksumMismatches.push(`missing:${key}`);
      continue;
    }
    if (rec.checksumPending) continue;
    const value = localStorage.getItem(key);
    if (value == null) {
      checksumMismatches.push(`removed:${key}`);
      continue;
    }
    const checksum = await sha256Hex(value);
    if (checksum !== rec.checksum) checksumMismatches.push(`checksum:${key}`);
  }

  return {
    ok: migrated && countMatch && checksumMismatches.length === 0 && pendingChecksumKeys.length === 0,
    migrated,
    pendingChecksumKeys,
    countMatch,
    checksumMismatches,
    warnings,
  };
}

export async function migrateLocalStorageMirror(db: IDBDatabase, options: MigrateMirrorOptions = {}): Promise<MigrationRunResult> {
  const logger = getLogger(options);
  const chunkKeys = Math.min(Math.max(options.chunkKeys ?? DEFAULT_CHUNK_KEYS, 1), 100);
  const maxBytesPerChunk = Math.min(Math.max(options.maxBytesPerChunk ?? DEFAULT_MAX_BYTES_PER_CHUNK, 256 * 1024), 4 * 1024 * 1024);
  const startedAt = nowMs();
  const storage = globalThis.localStorage;
  const initialMeta = await getMigrationMetaState(db);
  const lockOwnerId = options.lockOwnerId || randomId("migration_lock");

  if (initialMeta.migrated && initialMeta.migrationVersion === MIGRATION_VERSION) {
    const stats = initialMeta.migrateStats || { totalKeys: 0, migratedKeys: 0, skippedKeys: 0, totalBytes: 0, durationMs: 0 };
    if (!options.disableShadowAudit && initialMeta.sourceSnapshot?.keys?.length) {
      const softWarnings: string[] = [];
      await maybeRunShadowAudit(db, storage, initialMeta.sourceSnapshot.keys, options, softWarnings);
    }
    return { ok: true, resumed: false, stats, warnings: initialMeta.migrationResult?.warnings || [], meta: await getMigrationMetaState(db) };
  }

  const lockAttempt = await acquireMigrationLock(db, lockOwnerId);
  if (!lockAttempt.acquired) {
    logger(MIGRATION_LOGS.PROGRESS, { phase: "lock_wait", lockOwnerId: lockAttempt.lock?.ownerId, expiresAt: lockAttempt.lock?.expiresAt });
    return {
      ok: false,
      resumed: false,
      stats: initialMeta.migrateStats || { totalKeys: 0, migratedKeys: 0, skippedKeys: 0, totalBytes: 0, durationMs: 0 },
      warnings: initialMeta.migrationResult?.warnings || [],
      meta: await getMigrationMetaState(db),
    };
  }

  const stopHeartbeat = startLockHeartbeat(db, lockOwnerId);
  try {
    const resumed = Boolean(initialMeta.migrating && !initialMeta.migrated);
    logger(MIGRATION_LOGS.START, { resumed, migrationVersion: MIGRATION_VERSION, dbName: db.name, dbVersion: db.version, lockOwnerId });

    const pressure = await estimateStoragePressure(storage, options);
    const insufficientStorage = !pressure.canFit;
    if (insufficientStorage && pressure.selectedKeys.length === 0) {
      const error = "INSUFFICIENT_STORAGE";
      await setMetaBulk(db, {
        [META_KEYS.schemaVersion]: SCHEMA_VERSION,
        [META_KEYS.migrationVersion]: MIGRATION_VERSION,
        [META_KEYS.migrating]: false,
        [META_KEYS.migrated]: false,
        [META_KEYS.skippedLargeKeys]: pressure.skippedLargeKeys,
        [META_KEYS.migrationResult]: {
          success: false,
          warnings: [],
          error,
          details: { usage: pressure.usage, quota: pressure.quota, freeSpace: pressure.freeSpace, bytesToMigrate: pressure.bytesToMigrate },
        } satisfies MigrationResultMeta,
      });
      logger(MIGRATION_LOGS.FAIL, { error, pressure });
      return {
        ok: false,
        resumed,
        stats: { totalKeys: 0, migratedKeys: 0, skippedKeys: pressure.skippedLargeKeys.length, totalBytes: pressure.bytesToMigrate, durationMs: nowMs() - startedAt },
        warnings: [],
        meta: await getMigrationMetaState(db),
      };
    }

    await setMetaBulk(db, {
      [META_KEYS.schemaVersion]: SCHEMA_VERSION,
      [META_KEYS.migrationVersion]: MIGRATION_VERSION,
      [META_KEYS.migrating]: true,
      [META_KEYS.migrated]: false,
      [META_KEYS.migrationLock]: lockAttempt.lock,
      [META_KEYS.checksumPendingCount]: 0,
      [META_KEYS.skippedLargeKeys]: pressure.skippedLargeKeys,
      [META_KEYS.migrationResult]: {
        success: false,
        warnings: [],
        error: insufficientStorage ? "INSUFFICIENT_STORAGE" : undefined,
        details: { usage: pressure.usage, quota: pressure.quota, freeSpace: pressure.freeSpace, bytesToMigrate: pressure.bytesToMigrate, partialMigration: insufficientStorage },
      } satisfies MigrationResultMeta,
    });

    const warnings: string[] = [];
    if (insufficientStorage && pressure.skippedLargeKeys.length) {
      warnings.push(`Espaco insuficiente: migrando apenas chaves pequenas; ${pressure.skippedLargeKeys.length} chaves grandes foram puladas.`);
    }

    const ctx: PassContext = {
      keys: pressure.selectedKeys,
      sourceChecksums: {},
      sourceSizes: {},
      sourceTotalBytes: 0,
      migratedKeys: 0,
      skippedKeys: 0,
      skippedLargeKeys: pressure.skippedLargeKeys,
    };

    try {
      await passOneCopy(db, storage, ctx, { chunkKeys, maxBytesPerChunk, onBeforeProcessKey: options.onBeforeProcessKey }, logger);
      await secondPassRefreshChangedKeys(db, storage, ctx, { chunkKeys, maxBytesPerChunk, onBeforeProcessKey: options.onBeforeProcessKey }, logger, warnings);
      await finalizePendingChecksums(db, ctx.keys, storage, { chunkKeys, maxBytesPerChunk }, logger);

      const sourceSnapshot = await buildSourceSnapshot(ctx);
      const { targetSnapshot, mismatches, pendingCount } = await buildTargetSnapshotAndValidate(
        db,
        sourceSnapshot,
        { chunkKeys, maxBytesPerChunk, onBeforeProcessKey: options.onBeforeProcessKey },
        logger,
      );

      if (!sameSnapshotKeys(sourceSnapshot, targetSnapshot)) mismatches.push("Contagem/lista de chaves divergente entre source e target.");
      if (pendingCount > 0) mismatches.push(`Ainda existem ${pendingCount} checksums pendentes.`);
      if (mismatches.length > 0) {
        warnings.push(...mismatches);
        throw new Error(`Validacao final falhou (${mismatches.length} divergencias).`);
      }

      await maybeRunShadowAudit(db, storage, sourceSnapshot.keys, options, warnings);

      const durationMs = nowMs() - startedAt;
      const stats: MigrationStats = {
        totalKeys: ctx.keys.length,
        migratedKeys: ctx.migratedKeys,
        skippedKeys: ctx.skippedKeys + ctx.skippedLargeKeys.length,
        totalBytes: sourceSnapshot.totalBytes,
        durationMs,
      };

      await setMetaBulk(db, {
        [META_KEYS.sourceSnapshot]: sourceSnapshot,
        [META_KEYS.targetSnapshot]: targetSnapshot,
        [META_KEYS.migrateStats]: stats,
        [META_KEYS.migratedAt]: nowMs(),
        [META_KEYS.migrating]: false,
        [META_KEYS.migrated]: !insufficientStorage,
        [META_KEYS.checksumPendingCount]: 0,
        [META_KEYS.migrationVersion]: MIGRATION_VERSION,
        [META_KEYS.migrationResult]: {
          success: !insufficientStorage,
          warnings,
          error: insufficientStorage ? "INSUFFICIENT_STORAGE" : undefined,
          details: {
            usage: pressure.usage,
            quota: pressure.quota,
            freeSpace: pressure.freeSpace,
            bytesToMigrate: pressure.bytesToMigrate,
            partialMigration: insufficientStorage,
            skippedLargeKeys: ctx.skippedLargeKeys,
          },
        } satisfies MigrationResultMeta,
      });

      const finalMeta = await getMigrationMetaState(db);
      logger(MIGRATION_LOGS.DONE, { stats, warnings: warnings.length, partial: insufficientStorage });
      return { ok: !insufficientStorage, resumed, stats, warnings, meta: finalMeta };
    } catch (error) {
      const durationMs = nowMs() - startedAt;
      const stats: MigrationStats = {
        totalKeys: ctx.keys.length,
        migratedKeys: ctx.migratedKeys,
        skippedKeys: ctx.skippedKeys + ctx.skippedLargeKeys.length,
        totalBytes: ctx.sourceTotalBytes,
        durationMs,
      };
      const errMsg = isQuotaExceededError(error) || String(error).includes("INSUFFICIENT_STORAGE")
        ? "INSUFFICIENT_STORAGE"
        : error instanceof Error
          ? error.message
          : String(error);

      await setMetaBulk(db, {
        [META_KEYS.migrating]: false,
        [META_KEYS.migrated]: false,
        [META_KEYS.migrateStats]: stats,
        [META_KEYS.skippedLargeKeys]: ctx.skippedLargeKeys,
        [META_KEYS.migrationResult]: {
          success: false,
          warnings,
          error: errMsg,
        } satisfies MigrationResultMeta,
      });
      logger(MIGRATION_LOGS.FAIL, { error: errMsg, stats, warnings: warnings.length });
      return { ok: false, resumed, stats, warnings, meta: await getMigrationMetaState(db) };
    }
  } finally {
    stopHeartbeat();
    await releaseMigrationLock(db, lockOwnerId).catch(() => {});
  }
}

export async function getMigrationMeta(db: IDBDatabase): Promise<MigrationMetaState> {
  return getMigrationMetaState(db);
}
