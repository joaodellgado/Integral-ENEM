import { STORES, OUTBOX_LOGS, META_KEYS, logEvent, nowMs, randomId, bytesOfString, requestIdle, shouldDebugClientLogs, type OutboxRecord } from "./schema.js";
import { getByKey, withStore } from "./openDB.js";

const STUDY_SCHEDULE_PREFIX = "study-schedule-";

export interface OutboxEnqueueInput {
  userId?: string | null;
  type: string;
  key: string;
  payload: unknown;
  dedupeKey?: string;
  coalesceGroup?: string;
}

export interface OutboxProcessorOptions {
  maxEventsPerBatch?: number;
  maxBytesPerBatch?: number;
  maxPayloadBytes?: number;
  baseBackoffMs?: number;
  maxBackoffMs?: number;
  maxEventsPerMinute?: number;
  maxBatchesPerMinute?: number;
  maxRetryCount?: number;
  senderTimeoutMs?: number;
  sender: (events: OutboxRecord[]) => Promise<void | OutboxSendResult>;
  idleScheduling?: boolean;
}

export interface OutboxProcessorHandle {
  start(): void;
  stop(): void;
  poke(): void;
}

export interface OutboxSafetyReport {
  dedupWorks: boolean;
  coalesceWorks: boolean;
  batchLimitObserved: boolean;
  rateLimitObserved: boolean;
  migrationIsolationObserved: boolean;
  notes: string[];
}

export interface VerifyOutboxSafetyOptions {
  migrationProbe?: () => Promise<void>;
}

export interface OutboxSendFailure {
  id: string;
  status?: number;
  permanent?: boolean;
  reason?: string;
  error?: string;
}

export interface OutboxSendResult {
  sentIds?: string[];
  failed?: OutboxSendFailure[];
  metrics?: {
    groupedRequestsCount?: number;
    bytes?: number;
    durationMs?: number;
    totalEvents?: number;
  };
}

const outboxWakeHooks = new WeakMap<IDBDatabase, () => void>();
const enqueueMarks: number[] = [];
const STALE_SENDING_TIMEOUT_MS = 20_000;
const DEFAULT_SENDER_TIMEOUT_MS = 15_000;

function canonicalizeScheduleKey(key: string): string {
  return key.startsWith(STUDY_SCHEDULE_PREFIX) ? STUDY_SCHEDULE_PREFIX : key;
}

function inferCoalesceGroup(input: OutboxEnqueueInput): string | undefined {
  if (input.coalesceGroup) return input.coalesceGroup;
  if (input.key.startsWith(STUDY_SCHEDULE_PREFIX)) return `${input.userId || "anon"}:${STUDY_SCHEDULE_PREFIX}`;
  return undefined;
}

function inferDedupeKey(input: OutboxEnqueueInput): string {
  if (input.dedupeKey) return input.dedupeKey;
  const normalizedKey = canonicalizeScheduleKey(input.key);
  return `${input.userId || "anon"}:${input.type}:${normalizedKey}`;
}

export async function isMigrationInProgress(db: IDBDatabase): Promise<boolean> {
  const rec = await getByKey<{ key: string; value: boolean }>(db, STORES.meta, META_KEYS.migrating);
  return Boolean(rec?.value);
}

export async function enqueueOutboxEvent(db: IDBDatabase, input: OutboxEnqueueInput): Promise<OutboxRecord> {
  const dedupeKey = inferDedupeKey(input);
  let result!: OutboxRecord;

  await withStore<void>(db, STORES.outbox, "readwrite", async (store) => {
    const all = await new Promise<OutboxRecord[]>((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result || []) as OutboxRecord[]);
      req.onerror = () => reject(req.error || new Error("IDB getAll outbox failed"));
    });

    const existing = all.find(
      (evt) =>
        (evt.status === "queued" || evt.status === "failed") &&
        (evt.dedupeKey || `${evt.userId || "anon"}:${evt.type}:${evt.key}`) === dedupeKey,
    );

    if (existing) {
      result = {
        ...existing,
        payload: input.payload,
        key: canonicalizeScheduleKey(input.key),
        status: "queued",
        retryCount: 0,
        lastAttemptAt: null,
        nextAttemptAt: null,
        dedupeKey,
      };
      store.put(result);
    } else {
      result = {
        id: randomId("outbox"),
        userId: input.userId ?? null,
        type: input.type,
        key: canonicalizeScheduleKey(input.key),
        payload: input.payload,
        createdAt: nowMs(),
        status: "queued",
        retryCount: 0,
        lastAttemptAt: null,
        nextAttemptAt: null,
        dedupeKey,
      };
      store.add(result);
    }
  });

  logEvent(OUTBOX_LOGS.ENQUEUE, { id: result.id, type: result.type, key: result.key, dedupeKey: result.dedupeKey });
  const ts = nowMs();
  enqueueMarks.push(ts);
  while (enqueueMarks.length && ts - enqueueMarks[0] > 1000) enqueueMarks.shift();
  if (enqueueMarks.length > 50 && shouldDebugClientLogs()) {
    console.warn("[OUTBOX] high enqueue rate: {rate}/s, consider debouncing", { rate: enqueueMarks.length });
  }
  notifyOutboxHasWork(db);
  return result;
}

export function notifyOutboxHasWork(db: IDBDatabase): void {
  const hook = outboxWakeHooks.get(db);
  if (!hook) return;
  try {
    hook();
  } catch {
    /* noop */
  }
}

export function createDebouncedOutboxEnqueuer(db: IDBDatabase, delayMs = 2500, scheduleCoalesceMs = 1200) {
  const timers = new Map<string, number>();
  const latest = new Map<string, OutboxEnqueueInput>();
  const lastScheduleFlushByGroup = new Map<string, number>();

  return {
    enqueue(input: OutboxEnqueueInput) {
      const dedupeKey = inferDedupeKey(input);
      const group = inferCoalesceGroup(input);
      latest.set(dedupeKey, { ...input, dedupeKey });
      const existingTimer = timers.get(dedupeKey);
      if (existingTimer) window.clearTimeout(existingTimer);

      let effectiveDelay = delayMs;
      if (group && input.key.startsWith(STUDY_SCHEDULE_PREFIX)) {
        const lastAt = lastScheduleFlushByGroup.get(group) || 0;
        const remaining = scheduleCoalesceMs - (nowMs() - lastAt);
        effectiveDelay = Math.max(delayMs, remaining > 0 ? remaining : 0);
      }

      const t = window.setTimeout(async () => {
        timers.delete(dedupeKey);
        const item = latest.get(dedupeKey);
        if (!item) return;
        latest.delete(dedupeKey);
        if (group) lastScheduleFlushByGroup.set(group, nowMs());
        await enqueueOutboxEvent(db, item);
      }, effectiveDelay);
      timers.set(dedupeKey, t);
    },
    flushAll: async () => {
      const entries = [...latest.values()];
      latest.clear();
      for (const id of timers.values()) window.clearTimeout(id);
      timers.clear();
      for (const entry of entries) {
        const group = inferCoalesceGroup(entry);
        if (group) lastScheduleFlushByGroup.set(group, nowMs());
        await enqueueOutboxEvent(db, entry);
      }
    },
  };
}

function computeBackoffMs(retryCount: number, base: number, max: number, multiplier = 1): number {
  const exp = Math.min(max, base * multiplier * 2 ** Math.max(0, retryCount));
  const jitter = Math.round(exp * (0.2 * Math.random()));
  return Math.min(max, exp + jitter);
}

function getErrorStatus(error: unknown): number | undefined {
  const maybe = error as { status?: number; response?: { status?: number } };
  return maybe?.status || maybe?.response?.status;
}

async function withTimeoutReject<T>(promise: Promise<T>, timeoutMs: number, makeError: () => Error): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let settled = false;
    const timer = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(makeError());
    }, Math.max(1, timeoutMs));

    promise
      .then((value) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        reject(error);
      });
  });
}

async function listReadyEvents(
  db: IDBDatabase,
  maxEvents: number,
  maxBytes: number,
  maxPayloadBytes: number,
): Promise<{ batch: OutboxRecord[]; oversized: OutboxRecord[]; bytes: number }> {
  const now = nowMs();
  const all = await withStore<OutboxRecord[]>(db, STORES.outbox, "readonly", async (store) => {
    const req = store.getAll();
    return new Promise<OutboxRecord[]>((resolve, reject) => {
      req.onsuccess = () => resolve((req.result || []) as OutboxRecord[]);
      req.onerror = () => reject(req.error || new Error("IDB outbox getAll failed"));
    });
  });

  const sorted = all
    .filter((e) => (e.status === "queued" || e.status === "failed") && (!e.nextAttemptAt || e.nextAttemptAt <= now))
    .sort((a, b) => a.createdAt - b.createdAt);

  const batch: OutboxRecord[] = [];
  const oversized: OutboxRecord[] = [];
  let bytes = 0;
  for (const evt of sorted) {
    const payloadBytes = bytesOfString(JSON.stringify(evt.payload ?? null));
    const size = payloadBytes + evt.key.length + evt.type.length;
    if (payloadBytes > maxPayloadBytes) {
      oversized.push(evt);
      continue;
    }
    if (batch.length >= maxEvents || (batch.length > 0 && bytes + size > maxBytes)) break;
    batch.push(evt);
    bytes += size;
  }
  return { batch, oversized, bytes };
}

async function updateEvents(db: IDBDatabase, events: OutboxRecord[], mutator: (evt: OutboxRecord) => OutboxRecord): Promise<void> {
  if (!events.length) return;
  await withStore<void>(db, STORES.outbox, "readwrite", async (store) => {
    for (const evt of events) store.put(mutator(evt));
  });
}

async function markSending(db: IDBDatabase, events: OutboxRecord[]): Promise<void> {
  const ts = nowMs();
  await updateEvents(db, events, (evt) => ({ ...evt, status: "sending", lastAttemptAt: ts }));
}

async function recoverStaleSendingEvents(db: IDBDatabase, timeoutMs = STALE_SENDING_TIMEOUT_MS): Promise<number> {
  const ts = nowMs();
  const stale = await withStore<OutboxRecord[]>(db, STORES.outbox, "readonly", async (store) => {
    const req = store.getAll();
    return new Promise<OutboxRecord[]>((resolve, reject) => {
      req.onsuccess = () =>
        resolve(
          ((req.result || []) as OutboxRecord[]).filter(
            (evt) => evt.status === "sending" && typeof evt.lastAttemptAt === "number" && ts - evt.lastAttemptAt > timeoutMs,
          ),
        );
      req.onerror = () => reject(req.error || new Error("outbox getAll failed"));
    });
  });
  if (!stale.length) return 0;
  await updateEvents(db, stale, (evt) => ({
    ...evt,
    status: "failed",
    nextAttemptAt: ts - 1,
  }));
  if (shouldDebugClientLogs()) {
    console.warn("[OUTBOX] Recovered stale sending events", { count: stale.length, timeoutMs });
  }
  return stale.length;
}

async function markDone(db: IDBDatabase, events: OutboxRecord[]): Promise<void> {
  await updateEvents(db, events, (evt) => ({ ...evt, status: "done", nextAttemptAt: null, lastAttemptAt: nowMs() }));
}

async function markOversized(db: IDBDatabase, events: OutboxRecord[], maxPayloadBytes: number): Promise<void> {
  await updateEvents(db, events, (evt) => ({
    ...evt,
    status: "failed",
    retryCount: (evt.retryCount || 0) + 1,
    nextAttemptAt: nowMs() + 30_000,
    lastAttemptAt: nowMs(),
    payload: {
      // Intencionalmente nao preserva o payload bruto para evitar re-enfileirar um blob gigante indefinidamente.
      needsCompression: true,
      needsServerPull: true,
      oversizedDisposition: "metadata_only",
      originalPayloadType: typeof evt.payload,
      payloadBytes: bytesOfString(JSON.stringify(evt.payload ?? null)),
      maxPayloadBytes,
    },
  }));
}

async function markFailedWithBackoff(
  db: IDBDatabase,
  events: OutboxRecord[],
  error: unknown,
  baseBackoffMs: number,
  maxBackoffMs: number,
  maxRetryCount: number,
): Promise<void> {
  if (!events.length) return;
  const ts = nowMs();
  const status = getErrorStatus(error);
  const multiplier = status === 429 || (status != null && status >= 500) ? 3 : 1;
  await updateEvents(db, events, (evt) => {
    const retryCount = (evt.retryCount || 0) + 1;
    if (retryCount >= maxRetryCount) {
      return {
        ...evt,
        status: "dead",
        retryCount,
        lastAttemptAt: ts,
        nextAttemptAt: null,
      };
    }
    const backoffMs = computeBackoffMs(retryCount, baseBackoffMs, maxBackoffMs, multiplier);
    return {
      ...evt,
      status: "failed",
      retryCount,
      lastAttemptAt: ts,
      nextAttemptAt: ts + backoffMs,
    };
  });
  logEvent(OUTBOX_LOGS.FAIL_BACKOFF, {
    count: events.length,
    error: error instanceof Error ? error.message : String(error),
    status,
  });
}

async function markDead(
  db: IDBDatabase,
  events: OutboxRecord[],
  reason: string,
  error: unknown,
): Promise<void> {
  if (!events.length) return;
  const ts = nowMs();
  await updateEvents(db, events, (evt) => ({
    ...evt,
    status: "dead",
    retryCount: (evt.retryCount || 0) + 1,
    lastAttemptAt: ts,
    nextAttemptAt: null,
    payload:
      evt.payload && typeof evt.payload === "object"
        ? { ...(evt.payload as Record<string, unknown>), deadReason: reason }
        : { deadReason: reason },
  }));
  logEvent(OUTBOX_LOGS.FAIL_BACKOFF, {
    count: events.length,
    error: error instanceof Error ? error.message : String(error),
    reason,
    dead: true,
  });
}

async function markSpecificFailed(
  db: IDBDatabase,
  eventsById: Map<string, OutboxRecord>,
  failures: OutboxSendFailure[],
  baseBackoffMs: number,
  maxBackoffMs: number,
  maxRetryCount: number,
): Promise<void> {
  if (!failures.length) return;
  const permanentEvents: OutboxRecord[] = [];
  const retryEvents: OutboxRecord[] = [];
  const statusById = new Map<string, number | undefined>();
  const reasonById = new Map<string, string | undefined>();
  for (const failure of failures) {
    const evt = eventsById.get(String(failure.id || ""));
    if (!evt) continue;
    statusById.set(evt.id, failure.status);
    reasonById.set(evt.id, failure.reason);
    if (failure.permanent) permanentEvents.push(evt);
    else retryEvents.push(evt);
  }
  if (permanentEvents.length) {
    await markDead(
      db,
      permanentEvents,
      permanentEvents.map((e) => reasonById.get(e.id)).find(Boolean) || "permanent_error",
      new Error("Partial permanent send failure"),
    );
  }
  if (retryEvents.length) {
    const compositeError = Object.assign(new Error("Partial send failure"), {
      status: retryEvents.map((e) => statusById.get(e.id)).find((s) => Number.isFinite(s)),
    });
    await markFailedWithBackoff(db, retryEvents, compositeError, baseBackoffMs, maxBackoffMs, maxRetryCount);
  }
}

function createSlidingCounter(windowMs: number) {
  const marks: number[] = [];
  return {
    push(ts = nowMs()) {
      marks.push(ts);
      while (marks.length && ts - marks[0] > windowMs) marks.shift();
    },
    count(ts = nowMs()) {
      while (marks.length && ts - marks[0] > windowMs) marks.shift();
      return marks.length;
    },
  };
}

export function createOutboxProcessor(db: IDBDatabase, options: OutboxProcessorOptions): OutboxProcessorHandle {
  const maxEventsPerBatch = Math.min(Math.max(options.maxEventsPerBatch ?? 25, 1), 50);
  const maxBytesPerBatch = Math.min(Math.max(options.maxBytesPerBatch ?? 100 * 1024, 8 * 1024), 200 * 1024);
  const maxPayloadBytes = Math.min(Math.max(options.maxPayloadBytes ?? 32 * 1024, 4 * 1024), maxBytesPerBatch);
  const baseBackoffMs = Math.min(Math.max(options.baseBackoffMs ?? 2000, 500), 60_000);
  const maxBackoffMs = Math.min(Math.max(options.maxBackoffMs ?? 120_000, baseBackoffMs), 600_000);
  const maxEventsPerMinute = Math.min(Math.max(options.maxEventsPerMinute ?? 120, 5), 5000);
  const maxBatchesPerMinute = Math.min(Math.max(options.maxBatchesPerMinute ?? 30, 1), 500);
  const maxRetryCount = Math.min(Math.max(options.maxRetryCount ?? 25, 1), 500);
  const senderTimeoutMs = Math.min(Math.max(options.senderTimeoutMs ?? DEFAULT_SENDER_TIMEOUT_MS, 2000), 120_000);
  const idleScheduling = options.idleScheduling ?? true;

  let stopped = true;
  let loopTimer: number | null = null;
  let inFlight = false;
  const sentEventsCounter = createSlidingCounter(60_000);
  const sentBatchesCounter = createSlidingCounter(60_000);

  const schedule = (delayMs: number) => {
    if (stopped) return;
    if (loopTimer) window.clearTimeout(loopTimer);
    loopTimer = window.setTimeout(() => {
      if (idleScheduling) {
        void requestIdle().then(() => tick());
      } else {
        void tick();
      }
    }, delayMs);
  };

  const tick = async () => {
    if (stopped || inFlight) return;
    inFlight = true;
    try {
      if (!navigator.onLine) {
        schedule(3000);
        return;
      }
      if (await isMigrationInProgress(db)) {
        schedule(3000);
        return;
      }

      if (sentEventsCounter.count() >= maxEventsPerMinute || sentBatchesCounter.count() >= maxBatchesPerMinute) {
        schedule(5000);
        return;
      }

      await recoverStaleSendingEvents(db);
      const { batch, oversized, bytes } = await listReadyEvents(db, maxEventsPerBatch, maxBytesPerBatch, maxPayloadBytes);
      if (oversized.length) {
        await markOversized(db, oversized, maxPayloadBytes);
      }
      if (!batch.length) {
        schedule(2500);
        return;
      }

      await markSending(db, batch);
      try {
        const sendResult = await withTimeoutReject(options.sender(batch), senderTimeoutMs, () => {
          const err = new Error(`outbox_sender_timeout:${senderTimeoutMs}ms`) as Error & { status?: number };
          err.status = 408;
          return err;
        });
        if (sendResult && typeof sendResult === "object") {
          const batchById = new Map(batch.map((evt) => [evt.id, evt]));
          const failed = Array.isArray(sendResult.failed) ? sendResult.failed : [];
          const failedIds = new Set(failed.map((f) => String(f.id || "")));
          const sentIds = Array.isArray(sendResult.sentIds)
            ? sendResult.sentIds.map(String)
            : batch.filter((evt) => !failedIds.has(evt.id)).map((evt) => evt.id);
          const sentEvents = sentIds.map((id) => batchById.get(id)).filter(Boolean) as OutboxRecord[];
          if (sentEvents.length) await markDone(db, sentEvents);
          if (failed.length) {
            await markSpecificFailed(db, batchById, failed, baseBackoffMs, maxBackoffMs, maxRetryCount);
          }
          if (!sentEvents.length && !failed.length) {
            await markDone(db, batch);
          }
          const sentCountNow = sentEvents.length || (failed.length ? 0 : batch.length);
          for (let i = 0; i < sentCountNow; i += 1) sentEventsCounter.push(nowMs());
          if (sentCountNow > 0 || failed.length > 0) sentBatchesCounter.push(nowMs());
          logEvent(OUTBOX_LOGS.BATCH_SENT, {
            count: sentCountNow,
            bytes,
            groupedRequestsCount: sendResult.metrics?.groupedRequestsCount,
            durationMs: sendResult.metrics?.durationMs,
            totalEvents: sendResult.metrics?.totalEvents || batch.length,
            failed: failed.length,
          });
          schedule(50);
          return;
        }
        await markDone(db, batch);
        sentEventsCounter.push(nowMs());
        for (let i = 1; i < batch.length; i += 1) sentEventsCounter.push(nowMs());
        sentBatchesCounter.push(nowMs());
        logEvent(OUTBOX_LOGS.BATCH_SENT, { count: batch.length, bytes });
        schedule(50);
      } catch (error) {
        if ((error as { permanent?: boolean })?.permanent) {
          await markDead(db, batch, (error as { reason?: string })?.reason || "permanent_error", error);
          schedule(baseBackoffMs);
          return;
        }
        await markFailedWithBackoff(db, batch, error, baseBackoffMs, maxBackoffMs, maxRetryCount);
        schedule(baseBackoffMs);
      }
    } finally {
      inFlight = false;
    }
  };

  const onOnline = () => {
    if (!stopped) schedule(0);
  };

  return {
    start() {
      if (!stopped) return;
      stopped = false;
      window.addEventListener("online", onOnline);
      outboxWakeHooks.set(db, () => {
        queueMicrotask(() => {
          if (!stopped) schedule(0);
        });
      });
      schedule(0);
    },
    stop() {
      stopped = true;
      if (loopTimer) {
        window.clearTimeout(loopTimer);
        loopTimer = null;
      }
      window.removeEventListener("online", onOnline);
      if (outboxWakeHooks.get(db)) outboxWakeHooks.delete(db);
    },
    poke() {
      if (!stopped) schedule(0);
    },
  };
}

export async function getOutboxStatusSummary(db: IDBDatabase): Promise<{
  total: number;
  pending: number;
  dead: number;
  queued: number;
  sending: number;
  failed: number;
}> {
  const all = await withStore<OutboxRecord[]>(db, STORES.outbox, "readonly", async (store) => {
    const req = store.getAll();
    return new Promise<OutboxRecord[]>((resolve, reject) => {
      req.onsuccess = () => resolve((req.result || []) as OutboxRecord[]);
      req.onerror = () => reject(req.error || new Error("outbox getAll failed"));
    });
  });
  let queued = 0;
  let sending = 0;
  let failed = 0;
  let dead = 0;
  for (const evt of all) {
    if (evt.status === "queued") queued += 1;
    else if (evt.status === "sending") sending += 1;
    else if (evt.status === "failed") failed += 1;
    else if (evt.status === "dead") dead += 1;
  }
  return {
    total: all.length,
    pending: queued + sending + failed,
    dead,
    queued,
    sending,
    failed,
  };
}

export async function pruneDeadOutboxEvents(
  db: IDBDatabase,
  options: { olderThanMs?: number; reasons?: string[] } = {},
): Promise<{ removed: number; ids: string[] }> {
  const olderThanMs = Math.max(0, Number(options.olderThanMs ?? 12 * 60 * 60 * 1000));
  const reasonSet = new Set(
    (Array.isArray(options.reasons) ? options.reasons : ["schema_incompatible_id"])
      .map((reason) => String(reason || "").trim())
      .filter(Boolean),
  );
  const cutoff = nowMs() - olderThanMs;
  const removable = await withStore<OutboxRecord[]>(db, STORES.outbox, "readonly", async (store) => {
    const req = store.getAll();
    return new Promise<OutboxRecord[]>((resolve, reject) => {
      req.onsuccess = () =>
        resolve(
          ((req.result || []) as OutboxRecord[]).filter((evt) => {
            if (evt.status !== "dead") return false;
            const payload = evt.payload && typeof evt.payload === "object" ? (evt.payload as Record<string, unknown>) : null;
            const deadReason = String(payload?.deadReason || "");
            if (deadReason && reasonSet.has(deadReason)) return true;
            const lastAttemptAt = typeof evt.lastAttemptAt === "number" ? evt.lastAttemptAt : evt.createdAt;
            return olderThanMs > 0 && lastAttemptAt <= cutoff;
          }),
        );
      req.onerror = () => reject(req.error || new Error("outbox getAll failed"));
    });
  });
  if (!removable.length) return { removed: 0, ids: [] };
  await withStore<void>(db, STORES.outbox, "readwrite", async (store) => {
    for (const evt of removable) store.delete(evt.id);
  });
  if (shouldDebugClientLogs()) {
    console.info("[OUTBOX] Pruned dead events", {
      removed: removable.length,
      reasons: [...reasonSet],
      olderThanMs,
    });
  }
  return { removed: removable.length, ids: removable.map((evt) => evt.id) };
}

export async function verifyOutboxSafety(db: IDBDatabase, options: VerifyOutboxSafetyOptions = {}): Promise<OutboxSafetyReport> {
  const notes: string[] = [];
  const before = await withStore<OutboxRecord[]>(db, STORES.outbox, "readonly", async (store) => {
    const req = store.getAll();
    return new Promise<OutboxRecord[]>((resolve, reject) => {
      req.onsuccess = () => resolve((req.result || []) as OutboxRecord[]);
      req.onerror = () => reject(req.error || new Error("verify getAll failed"));
    });
  });

  let migrationIsolationObserved = true;
  if (options.migrationProbe) {
    const countBeforeProbe = before.length;
    await options.migrationProbe();
    const afterProbe = await withStore<OutboxRecord[]>(db, STORES.outbox, "readonly", async (store) => {
      const req = store.getAll();
      return new Promise<OutboxRecord[]>((resolve, reject) => {
        req.onsuccess = () => resolve((req.result || []) as OutboxRecord[]);
        req.onerror = () => reject(req.error || new Error("verify getAll failed"));
      });
    });
    migrationIsolationObserved = afterProbe.length === countBeforeProbe;
    if (!migrationIsolationObserved) notes.push("Migracao alterou outbox (nao deveria gerar eventos).");
  }

  await enqueueOutboxEvent(db, { userId: "u1", type: "upsert", key: "mm_flashcards_cache_v2", payload: { a: 1 } });
  await enqueueOutboxEvent(db, { userId: "u1", type: "upsert", key: "mm_flashcards_cache_v2", payload: { a: 2 } });

  const debounced = createDebouncedOutboxEnqueuer(db, 10, 50);
  for (let i = 0; i < 10; i += 1) {
    debounced.enqueue({ userId: "u1", type: "upsert", key: `study-schedule-2026-02-${String(10 + i).padStart(2, "0")}`, payload: { i } });
  }
  await debounced.flushAll();

  const after = await withStore<OutboxRecord[]>(db, STORES.outbox, "readonly", async (store) => {
    const req = store.getAll();
    return new Promise<OutboxRecord[]>((resolve, reject) => {
      req.onsuccess = () => resolve((req.result || []) as OutboxRecord[]);
      req.onerror = () => reject(req.error || new Error("verify getAll failed"));
    });
  });

  const dedupMatches = after.filter((e) => e.dedupeKey?.includes("mm_flashcards_cache_v2") || e.key === "mm_flashcards_cache_v2");
  const scheduleMatches = after.filter((e) => e.key === STUDY_SCHEDULE_PREFIX);

  const dedupWorks = dedupMatches.length <= 1;
  const coalesceWorks = scheduleMatches.length <= 1;
  let rateLimitObserved = false;
  let batchLimitObserved = false;
  let sentCount = 0;
  await withStore<void>(db, STORES.outbox, "readwrite", async (store) => {
    store.clear();
  });
  const processor = createOutboxProcessor(db, {
    sender: async (events) => {
      sentCount += events.length;
    },
    maxEventsPerBatch: 1,
    maxBytesPerBatch: 20 * 1024,
    maxEventsPerMinute: 2,
    maxBatchesPerMinute: 1,
    idleScheduling: false,
    baseBackoffMs: 50,
    maxBackoffMs: 1000,
  });

  await enqueueOutboxEvent(db, { userId: "u-rate", type: "upsert", key: "mm_rate_1", payload: { n: 1 } });
  await enqueueOutboxEvent(db, { userId: "u-rate", type: "upsert", key: "mm_rate_2", payload: { n: 2 } });
  await enqueueOutboxEvent(db, { userId: "u-rate", type: "upsert", key: "mm_rate_3", payload: { n: 3 } });

  processor.start();
  await new Promise((resolve) => setTimeout(resolve, 200));
  processor.stop();
  rateLimitObserved = sentCount <= 2;
  await withStore<void>(db, STORES.outbox, "readwrite", async (store) => {
    store.clear();
  });
  let largestBatch = 0;
  const batchProcessor = createOutboxProcessor(db, {
    sender: async (events) => {
      largestBatch = Math.max(largestBatch, events.length);
    },
    maxEventsPerBatch: 2,
    maxBytesPerBatch: 10 * 1024,
    idleScheduling: false,
    baseBackoffMs: 50,
    maxBackoffMs: 1000,
    maxEventsPerMinute: 120,
    maxBatchesPerMinute: 120,
  });
  await enqueueOutboxEvent(db, { userId: "u-batch", type: "upsert", key: "mm_batch_1", payload: { n: 1 } });
  await enqueueOutboxEvent(db, { userId: "u-batch", type: "upsert", key: "mm_batch_2", payload: { n: 2 } });
  await enqueueOutboxEvent(db, { userId: "u-batch", type: "upsert", key: "mm_batch_3", payload: { n: 3 } });
  batchProcessor.start();
  await new Promise((resolve) => setTimeout(resolve, 200));
  batchProcessor.stop();
  batchLimitObserved = largestBatch <= 2;
  if (!dedupWorks) notes.push("Dedup by dedupeKey falhou em verifyOutboxSafety");
  if (!coalesceWorks) notes.push("Coalesce de study-schedule-* falhou em verifyOutboxSafety");
  if (!batchLimitObserved) notes.push(`Batch limit nao observado (largestBatch=${largestBatch}).`);
  if (!rateLimitObserved) notes.push(`Rate limit nao observado (sentCount=${sentCount}).`);

  return { dedupWorks, coalesceWorks, batchLimitObserved, rateLimitObserved, migrationIsolationObserved, notes };
}
