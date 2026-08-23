import { openAppDB } from "./openDB.js";
import { migrateLocalStorageMirror, getMigrationMeta, verifyMigrationIntegrity } from "./migrateLocalStorageMirror.js";
import { getAllFromStore, withStore } from "./openDB.js";
import { STORES, META_KEYS, nowMs, shouldMigrateKey, sha256Hex, type LocalStorageMirrorRecord, type MigrationLock, type OutboxRecord } from "./schema.js";
import { createStorageFacade } from "./storageFacade.js";
import { createOutboxProcessor, enqueueOutboxEvent, verifyOutboxSafety } from "./outbox.js";

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(`ASSERT_FAIL: ${message}`);
}

function bigString(sizeKb: number, seed = "x"): string {
  return new Array(sizeKb * 1024 + 1).join(seed).slice(0, sizeKb * 1024);
}

function seedFakeLocalStorage(): string[] {
  const keys = [
    ["mm_flashcards_cache_v2", JSON.stringify({ decks: [{ id: 1, name: "Deck Teste", cards: [] }], updatedAt: Date.now() })],
    ["mm_flashcards_study_v1", JSON.stringify({ user: { c1: { status: "in_progress" } } })],
    ["mm_profile_cache", JSON.stringify({ nome: "Teste" })],
    ["study-goals", JSON.stringify({ daily: 20 })],
    ["lista-diagramacao", JSON.stringify({ itens: [1, 2, 3] })],
    ["mm_raw_whitespace_test", "  {\"x\":1}\n\t  "],
    ["study-schedule-2026-02-23", bigString(64, "a")],
    ["sb-demo-auth-token", "SHOULD_NOT_MIGRATE"],
    ["mm_theme", "dark"],
  ] as const;

  for (const [k, v] of keys) localStorage.setItem(k, v);
  return keys.map(([k]) => k);
}

function seedHugeLocalStorageKey(): string {
  const key = "mm_huge_blob_test";
  localStorage.setItem(key, bigString(10 * 1024, "z"));
  return key;
}

async function clearIDBStores(db: IDBDatabase): Promise<void> {
  await withStore<void>(db, STORES.localStorageMirror, "readwrite", async (store) => {
    store.clear();
  });
  await withStore<void>(db, STORES.outbox, "readwrite", async (store) => {
    store.clear();
  });
  await withStore<void>(db, STORES.meta, "readwrite", async (store) => {
    store.clear();
  });
}

async function validateMirrorIntegrity(db: IDBDatabase): Promise<void> {
  const mirror = await getAllFromStore<LocalStorageMirrorRecord>(db, STORES.localStorageMirror);
  const migratableKeys = Array.from({ length: localStorage.length })
    .map((_, i) => localStorage.key(i))
    .filter((k): k is string => Boolean(k))
    .filter(shouldMigrateKey)
    .sort();

  assert(mirror.length === migratableKeys.length, `mirror count ${mirror.length} != migratable ${migratableKeys.length}`);

  for (const key of migratableKeys) {
    const rec = mirror.find((r) => r.key === key);
    assert(rec, `missing mirrored key ${key}`);
    const value = localStorage.getItem(key);

if (value === null) {
  throw new Error(`localStorage missing key ${key}`);
}

const checksum = await sha256Hex(value);
    assert(rec!.checksum === checksum, `checksum mismatch for ${key}`);
  }
}

async function getMirrorByKey(db: IDBDatabase, key: string): Promise<LocalStorageMirrorRecord | undefined> {
  const records = await getAllFromStore<LocalStorageMirrorRecord>(db, STORES.localStorageMirror);
  return records.find((r) => r.key === key);
}

/**
 * Harness de desenvolvimento que exercita, ponta a ponta, os cenários críticos
 * da migração de localStorage para o mirror IndexedDB: retomada após falha,
 * armazenamento insuficiente, lock concorrente entre abas, chaves grandes,
 * isolamento do outbox e payloads que excedem o limite de tamanho.
 * Lança (throw) no primeiro `assert` que falhar. Não é executado em produção.
 * @returns {Promise<void>}
 */
export async function runLocalStorageMirrorMigrationHarness(): Promise<void> {
  console.info("[HARNESS] start");
  const HARNESS_DB_NAME = "matrizMentoriaDB_harness";
  const managedKeys = [
    "mm_flashcards_cache_v2",
    "mm_flashcards_study_v1",
    "mm_profile_cache",
    "study-goals",
    "lista-diagramacao",
    "mm_raw_whitespace_test",
    "study-schedule-2026-02-23",
    "sb-demo-auth-token",
    "mm_theme",
    "mm_huge_blob_test",
  ];
  const localBackup = new Map<string, string | null>(managedKeys.map((k) => [k, localStorage.getItem(k)]));
  const restoreLocalStorage = () => {
    for (const [k, v] of localBackup) {
      if (v == null) localStorage.removeItem(k);
      else localStorage.setItem(k, v);
    }
  };
  assert(shouldMigrateKey("mm_flashcards_cache_v2") === true, "mm_ key should migrate");
  assert(shouldMigrateKey("study-goals") === true, "study-goals should migrate");
  assert(shouldMigrateKey("study-schedule-2026-02-23") === true, "study-schedule-* should migrate");
  assert(shouldMigrateKey("sb-demo-auth-token") === false, "sb auth token should NOT migrate");
  assert(shouldMigrateKey("mm_theme") === false, "mm_theme should stay in localStorage");
  let db: IDBDatabase | null = null;
  try {
    seedFakeLocalStorage();
    db = await openAppDB({ dbName: HARNESS_DB_NAME });
    if (!db) throw new Error("Harness DB unavailable");
    await clearIDBStores(db);

  let failedMidway = false;
  const first = await migrateLocalStorageMirror(db, {
    chunkKeys: 5,
    onBeforeProcessKey: ({ processed, phase }) => {
      if (!failedMidway && phase === 1 && processed >= 2) {
        failedMidway = true;
        throw new Error("Simulated crash during migration");
      }
    },
  });
  assert(!first.ok, "first run should fail due simulated crash");

  const second = await migrateLocalStorageMirror(db, { chunkKeys: 5 });
  assert(second.ok, "second run should resume and succeed");
  await validateMirrorIntegrity(db);
  const integrity = await verifyMigrationIntegrity(db);
  assert(integrity.ok, `verifyMigrationIntegrity should pass; mismatches=${integrity.checksumMismatches.join(",")}`);
  const rawRec = await getMirrorByKey(db, "mm_raw_whitespace_test");
  assert(rawRec?.value === "  {\"x\":1}\n\t  ", "raw mirror must preserve localStorage string exactly (byte-for-byte semantics)");

  const meta = await getMigrationMeta(db);
  assert(meta.migrated === true, "meta.migrated should be true");
  assert(meta.migrationResult?.success === true, "migrationResult.success should be true");

  const facade = createStorageFacade({ dbPromise: Promise.reject(new Error("IDB unavailable")) });
  localStorage.setItem("mm_profile_cache", "fallback_ok");
  const fallback = await facade.get("mm_profile_cache");
  assert(fallback === "fallback_ok", "fallback to localStorage when IDB unavailable");

  // Cenário: storageFacade.set() deve atualizar value/checksum/updatedAt sem enfileirar eventos no outbox
  await clearIDBStores(db);
  const facadeDirect = createStorageFacade({ db });
  const keySet = "mm_profile_cache";
  await facadeDirect.set(keySet, "{\"v\":1}");
  const firstRec = await getMirrorByKey(db, keySet);
  assert(Boolean(firstRec), "storageFacade.set should write to IDB mirror");
  const firstUpdatedAt = firstRec!.updatedAt;
  assert(firstRec!.checksum === await sha256Hex("{\"v\":1}"), "storageFacade.set checksum must match value");
  await new Promise((resolve) => setTimeout(resolve, 2));
  await facadeDirect.set(keySet, "{\"v\":2}");
  const secondRecSet = await getMirrorByKey(db, keySet);
  assert(secondRecSet?.value === "{\"v\":2}", "storageFacade.set should update value");
  assert(secondRecSet!.updatedAt >= firstUpdatedAt, "storageFacade.set should update updatedAt");
  assert(secondRecSet!.checksum === await sha256Hex("{\"v\":2}"), "storageFacade.set should update checksum");
  const outboxAfterFacadeSet = await getAllFromStore<OutboxRecord>(db, STORES.outbox);
  assert(outboxAfterFacadeSet.length === 0, "storageFacade.set must not enqueue outbox events");

  // Cenário: sob pouco espaço, migra apenas as chaves pequenas, registra INSUFFICIENT_STORAGE e não marca migrated=true
  await clearIDBStores(db);
  seedFakeLocalStorage();
  const lowSpace = await migrateLocalStorageMirror(db, {
    storageEstimateOverride: { usage: 999_000, quota: 1_000_000 },
    chunkKeys: 5,
  });
  assert(lowSpace.ok === false, "low-space migration should not be fully successful");
  assert(lowSpace.meta.migrated === false, "low-space migration must not mark migrated=true");
  assert(lowSpace.meta.migrationResult?.error === "INSUFFICIENT_STORAGE", "low-space should record INSUFFICIENT_STORAGE");
  const startupStorageStatus = await createStorageFacade({ db }).getMigrationStatus();
  assert(startupStorageStatus.migrated === false, "storage facade should keep migrated=false after insufficient storage");

  // Cenário: a migração não deve rodar enquanto outra aba segura o lock de migração
  await clearIDBStores(db);
  seedFakeLocalStorage();
  const foreignLock: MigrationLock = {
    ownerId: "other-tab",
    acquiredAt: nowMs(),
    expiresAt: nowMs() + 60_000,
  };
  await withStore<void>(db, STORES.meta, "readwrite", async (store) => {
    store.put({ key: META_KEYS.migrationLock, value: foreignLock, updatedAt: nowMs() });
  });
  const lockBlocked = await migrateLocalStorageMirror(db, { chunkKeys: 5, lockOwnerId: "this-tab" });
  assert(lockBlocked.ok === false, "migration should not run when lock is held by another tab");
  const lockMeta = await getMigrationMeta(db);
  assert(lockMeta.migrated === false, "lock-blocked run should not mark migrated");

  // Cenário: chave gigante deve passar pelo caminho de checksum assíncrono (fase checksum_idle) antes de migrated=true
  await clearIDBStores(db);
  seedFakeLocalStorage();
  const hugeKey = seedHugeLocalStorageKey();
  const progressEvents: Array<Record<string, unknown>> = [];
  const hugeRun = await migrateLocalStorageMirror(db, {
    chunkKeys: 3,
    logger: (_event, payload) => {
      progressEvents.push(payload);
    },
  });
  assert(hugeRun.ok, "huge-key migration should complete");
  const hugeRec = (await getAllFromStore<LocalStorageMirrorRecord>(db, STORES.localStorageMirror)).find((r) => r.key === hugeKey);
  assert(Boolean(hugeRec), "huge key should exist in IDB mirror");
  assert(hugeRec?.checksumPending !== true, "huge key checksum should be finalized before migrated=true");
  assert(progressEvents.some((p) => p.phase === "checksum_idle"), "checksum_idle phase should run for huge key");

  // Cenário: verifyOutboxSafety() valida dedup/coalesce/rate-limit e confirma que a migração não gera eventos no outbox
  await clearIDBStores(db);
  seedFakeLocalStorage();
  const outboxBeforeMigration = await getAllFromStore<OutboxRecord>(db, STORES.outbox);
  assert(outboxBeforeMigration.length === 0, "outbox should start empty for isolation test");
  const outboxSafety = await verifyOutboxSafety(db!, {
    migrationProbe: async () => {
      await migrateLocalStorageMirror(db!, { chunkKeys: 5 });
    },
  });
  assert(outboxSafety.dedupWorks, `verifyOutboxSafety dedup failed: ${outboxSafety.notes.join(" | ")}`);
  assert(outboxSafety.coalesceWorks, `verifyOutboxSafety coalesce failed: ${outboxSafety.notes.join(" | ")}`);
  assert(outboxSafety.batchLimitObserved, `verifyOutboxSafety batch-limit failed: ${outboxSafety.notes.join(" | ")}`);
  assert(outboxSafety.rateLimitObserved, `verifyOutboxSafety rate-limit failed: ${outboxSafety.notes.join(" | ")}`);
  assert(outboxSafety.migrationIsolationObserved, `verifyOutboxSafety migration-isolation failed: ${outboxSafety.notes.join(" | ")}`);

  // Cenário: payload que excede o limite de tamanho vira um marcador de metadata e é reenviado após o cooldown de backoff
  await clearIDBStores(db);
  const hugePayload = { blob: bigString(80, "p") }; // > 32KB default payload cap
  await enqueueOutboxEvent(db, { userId: "u-big", type: "upsert", key: "mm_big_payload", payload: hugePayload });
  let sentOversized = 0;
  const oversizedProcessor = createOutboxProcessor(db, {
    sender: async (events) => {
      sentOversized += events.length;
      for (const evt of events) {
        const p = evt.payload as Record<string, unknown>;
        assert(p.needsCompression === true, "oversized payload should be converted to metadata marker before send");
      }
    },
    idleScheduling: false,
    baseBackoffMs: 50,
    maxBackoffMs: 200,
    maxPayloadBytes: 16 * 1024,
    maxEventsPerBatch: 5,
    maxBytesPerBatch: 64 * 1024,
  });
  oversizedProcessor.start();
  await new Promise((resolve) => setTimeout(resolve, 150));
  oversizedProcessor.stop();
  const oversizedAfterMark = (await getAllFromStore<OutboxRecord>(db, STORES.outbox))[0];
  assert(oversizedAfterMark?.payload && typeof oversizedAfterMark.payload === "object", "oversized should be rewritten to metadata object");
  assert((oversizedAfterMark.payload as Record<string, unknown>).oversizedDisposition === "metadata_only", "oversized marker should drop raw payload");
  await withStore<void>(db, STORES.outbox, "readwrite", async (store) => {
    const req = store.get(oversizedAfterMark.id);
    const rec = await new Promise<OutboxRecord>((resolve, reject) => {
      req.onsuccess = () => resolve(req.result as OutboxRecord);
      req.onerror = () => reject(req.error || new Error("outbox get failed"));
    });
    store.put({ ...rec, status: "queued", nextAttemptAt: nowMs() - 1 });
  });
  oversizedProcessor.start();
  await new Promise((resolve) => setTimeout(resolve, 200));
  oversizedProcessor.stop();
  assert(sentOversized >= 1, "oversized metadata event should eventually be sent (no eternal stuck)");

  console.info("[HARNESS] done", {
    migrated: meta.migrated,
    totalKeys: meta.migrateStats?.totalKeys,
    migratedKeys: meta.migrateStats?.migratedKeys,
    integrityOk: integrity.ok,
  });
  } finally {
    try {
      db?.close();
    } catch (_) {
      /* noop */
    }
    try {
      indexedDB.deleteDatabase(HARNESS_DB_NAME);
    } catch (_) {
      /* noop */
    }
    restoreLocalStorage();
  }
}
