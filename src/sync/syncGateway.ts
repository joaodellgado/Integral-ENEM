import { STORES, bytesOfString, randomId, type OutboxRecord } from "../db/schema.js";
import { enqueueOutboxEvent, type OutboxProcessorHandle } from "../db/outbox.js";
import { getAllFromStore } from "../db/openDB.js";

type DeleteFilter = { op: "eq" | "in"; column: string; value?: unknown; values?: unknown[] };
type FlushMode = "none" | "soon" | "now";
type EnqueueKind = "UPSERT" | "DELETE" | "RPC";

interface BaseEnqueueInput {
  userId?: string | null;
  flush?: FlushMode;
}

export interface EnqueueUpsertInput extends BaseEnqueueInput {
  table: string;
  key: string;
  payload: Record<string, unknown> | Record<string, unknown>[];
  onConflict?: string;
}

export interface EnqueueDeleteInput extends BaseEnqueueInput {
  table: string;
  key: string;
  filters?: DeleteFilter[];
}

export interface EnqueueRpcInput extends BaseEnqueueInput {
  fn: string;
  args?: Record<string, unknown>;
}

export interface SyncGateway {
  enqueueUpsert(input: EnqueueUpsertInput): Promise<void>;
  enqueueDelete(input: EnqueueDeleteInput): Promise<void>;
  enqueueRpc(input: EnqueueRpcInput): Promise<void>;
  flushNow(options?: { timeoutMs?: number }): Promise<{ ok: boolean; reason?: string }>;
}

interface SyncGatewayRuntime {
  db: IDBDatabase;
  processor?: OutboxProcessorHandle | null;
}

interface SyncGatewayDiagnostics {
  bound: boolean;
  lastFlushAt: number | null;
  lastFlushOk: boolean | null;
  lastFlushReason: string | null;
}

interface StagedEntry {
  kind: EnqueueKind;
  input: EnqueueUpsertInput | EnqueueDeleteInput | EnqueueRpcInput;
  dedupeKey: string;
}

const DEFAULT_SOON_DEBOUNCE_MS = 900;

const runtimeState: {
  runtime: SyncGatewayRuntime | null;
  gateway: SyncGateway | null;
  waiters: Array<(runtime: SyncGatewayRuntime) => void>;
  diagnostics: SyncGatewayDiagnostics;
  soonTimers: Map<string, number>;
  soonLatest: Map<string, StagedEntry>;
} = {
  runtime: null,
  gateway: null,
  waiters: [],
  diagnostics: {
    bound: false,
    lastFlushAt: null,
    lastFlushOk: null,
    lastFlushReason: null,
  },
  soonTimers: new Map(),
  soonLatest: new Map(),
};

function payloadBytes(value: unknown): number {
  return bytesOfString(JSON.stringify(value ?? null));
}

function ensurePayloadSizeBelow(value: unknown, maxBytes = 256 * 1024): void {
  const size = payloadBytes(value);
  if (size > maxBytes) throw new Error(`SYNC_GATEWAY_PAYLOAD_TOO_LARGE:${size}`);
}

function flushMode(input: BaseEnqueueInput | undefined): FlushMode {
  return input?.flush || "soon";
}

function upsertDedupeKey(input: EnqueueUpsertInput): string {
  const table = String(input.table || "").trim();
  const key = String(input.key || "").trim();
  return `${input.userId || "anon"}:UPSERT:${table}:${key}`;
}

function deleteDedupeKey(input: EnqueueDeleteInput): string {
  const table = String(input.table || "").trim();
  const key = String(input.key || "").trim();
  return `${input.userId || "anon"}:DELETE:${table}:${key}`;
}

function rpcDedupeKey(input: EnqueueRpcInput): string {
  const fn = String(input.fn || "").trim();
  return `${input.userId || "anon"}:RPC:${fn}`;
}

async function waitForOutboxDrain(db: IDBDatabase, timeoutMs = 15000): Promise<boolean> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const events = await getAllFromStore<OutboxRecord>(db, STORES.outbox);
    const pending = events.some((evt) => evt.status === "queued" || evt.status === "sending" || evt.status === "failed");
    if (!pending) return true;
    await new Promise((resolve) => setTimeout(resolve, 120));
  }
  return false;
}

function getRuntimeOrThrow(): SyncGatewayRuntime {
  if (!runtimeState.runtime) throw new Error("sync_gateway_not_bound");
  return runtimeState.runtime;
}

function pokeProcessor() {
  const processor = runtimeState.runtime?.processor;
  if (processor && typeof processor.poke === "function") processor.poke();
}

async function enqueueUpsertImmediate(db: IDBDatabase, input: EnqueueUpsertInput) {
  const table = String(input.table || "").trim();
  const key = String(input.key || "").trim();
  if (!table || !key) throw new Error("SYNC_GATEWAY_INVALID_UPSERT_KEY");
  ensurePayloadSizeBelow(input.payload, 512 * 1024);
  await enqueueOutboxEvent(db, {
    userId: input.userId ?? null,
    type: "db:upsert",
    key: `${table}:${key}`,
    dedupeKey: upsertDedupeKey(input),
    payload: {
      op: "UPSERT",
      table,
      record: input.payload,
      onConflict: input.onConflict || "id",
      eventId: randomId("sg_upsert"),
    },
  });
}

async function enqueueDeleteImmediate(db: IDBDatabase, input: EnqueueDeleteInput) {
  const table = String(input.table || "").trim();
  const key = String(input.key || "").trim();
  if (!table || !key) throw new Error("SYNC_GATEWAY_INVALID_DELETE_KEY");
  const filters = Array.isArray(input.filters) && input.filters.length ? input.filters : [{ op: "eq", column: "id", value: key }];
  await enqueueOutboxEvent(db, {
    userId: input.userId ?? null,
    type: "db:delete",
    key: `${table}:${key}`,
    dedupeKey: deleteDedupeKey(input),
    payload: {
      op: "DELETE",
      table,
      filters,
      eventId: randomId("sg_delete"),
    },
  });
}

async function enqueueRpcImmediate(db: IDBDatabase, input: EnqueueRpcInput) {
  const fn = String(input.fn || "").trim();
  if (!fn) throw new Error("SYNC_GATEWAY_INVALID_RPC");
  ensurePayloadSizeBelow(input.args || {}, 256 * 1024);
  await enqueueOutboxEvent(db, {
    userId: input.userId ?? null,
    type: "db:rpc",
    key: `rpc:${fn}`,
    dedupeKey: rpcDedupeKey(input),
    payload: {
      op: "RPC",
      fn,
      args: input.args || {},
      eventId: randomId("sg_rpc"),
    },
  });
}

async function enqueueImmediate(kind: EnqueueKind, input: EnqueueUpsertInput | EnqueueDeleteInput | EnqueueRpcInput) {
  const { db } = getRuntimeOrThrow();
  if (kind === "UPSERT") await enqueueUpsertImmediate(db, input as EnqueueUpsertInput);
  else if (kind === "DELETE") await enqueueDeleteImmediate(db, input as EnqueueDeleteInput);
  else await enqueueRpcImmediate(db, input as EnqueueRpcInput);
  pokeProcessor();
}

function stageSoon(kind: EnqueueKind, dedupeKey: string, input: EnqueueUpsertInput | EnqueueDeleteInput | EnqueueRpcInput): Promise<void> {
  runtimeState.soonLatest.set(dedupeKey, { kind, input, dedupeKey });
  const existing = runtimeState.soonTimers.get(dedupeKey);
  if (existing) window.clearTimeout(existing);
  const timer = window.setTimeout(() => {
    runtimeState.soonTimers.delete(dedupeKey);
    const staged = runtimeState.soonLatest.get(dedupeKey);
    if (!staged) return;
    runtimeState.soonLatest.delete(dedupeKey);
    void enqueueImmediate(staged.kind, staged.input).catch((error) => {
      console.warn("[SYNC] Failed to enqueue staged event", { kind: staged.kind, dedupeKey: staged.dedupeKey, message: error instanceof Error ? error.message : String(error) });
    });
  }, DEFAULT_SOON_DEBOUNCE_MS);
  runtimeState.soonTimers.set(dedupeKey, timer);
  return Promise.resolve();
}

async function flushStagedSoonEntries(): Promise<void> {
  const staged = [...runtimeState.soonLatest.values()];
  runtimeState.soonLatest.clear();
  for (const t of runtimeState.soonTimers.values()) window.clearTimeout(t);
  runtimeState.soonTimers.clear();
  for (const entry of staged) {
    await enqueueImmediate(entry.kind, entry.input);
  }
}

function createRuntimeGateway(_db: IDBDatabase, _processor?: OutboxProcessorHandle | null): SyncGateway {
  return {
    async enqueueUpsert(input) {
      const mode = flushMode(input);
      if (mode === "none") return enqueueImmediate("UPSERT", input);
      if (mode === "soon") return stageSoon("UPSERT", upsertDedupeKey(input), input);
      await enqueueImmediate("UPSERT", input);
      const res = await this.flushNow({ timeoutMs: 900 });
      if (!res.ok) throw new Error(`outbox_flush_timeout:${res.reason || "unknown"}`);
    },

    async enqueueDelete(input) {
      const mode = flushMode(input);
      if (mode === "none") return enqueueImmediate("DELETE", input);
      if (mode === "soon") return stageSoon("DELETE", deleteDedupeKey(input), input);
      await enqueueImmediate("DELETE", input);
      const res = await this.flushNow({ timeoutMs: 900 });
      if (!res.ok) throw new Error(`outbox_flush_timeout:${res.reason || "unknown"}`);
    },

    async enqueueRpc(input) {
      const mode = flushMode(input);
      if (mode === "none") return enqueueImmediate("RPC", input);
      if (mode === "soon") return stageSoon("RPC", rpcDedupeKey(input), input);
      await enqueueImmediate("RPC", input);
      const res = await this.flushNow({ timeoutMs: 900 });
      if (!res.ok) throw new Error(`outbox_flush_timeout:${res.reason || "unknown"}`);
    },

    async flushNow(options) {
      const { db } = getRuntimeOrThrow();
      await flushStagedSoonEntries();
      pokeProcessor();
      const drained = await waitForOutboxDrain(db, options?.timeoutMs ?? 15000);
      runtimeState.diagnostics.lastFlushAt = Date.now();
      runtimeState.diagnostics.lastFlushOk = drained;
      runtimeState.diagnostics.lastFlushReason = drained ? null : "timeout";
      return drained ? { ok: true } : { ok: false, reason: "timeout" };
    },
  };
}

async function waitForRuntime(timeoutMs = 15000): Promise<SyncGatewayRuntime> {
  if (runtimeState.runtime) return runtimeState.runtime;
  return new Promise<SyncGatewayRuntime>((resolve, reject) => {
    const onReady = (runtime: SyncGatewayRuntime) => {
      window.clearTimeout(timeoutId);
      resolve(runtime);
    };
    const timeoutId = window.setTimeout(() => {
      runtimeState.waiters = runtimeState.waiters.filter((w) => w !== onReady);
      reject(new Error("sync_gateway_not_ready_timeout"));
    }, timeoutMs);
    runtimeState.waiters.push(onReady);
  });
}

export function createSyncGateway(db: IDBDatabase, processor?: OutboxProcessorHandle | null): SyncGateway {
  runtimeState.runtime = { db, processor: processor || null };
  runtimeState.gateway = createRuntimeGateway(db, processor);
  return runtimeState.gateway;
}

export function bindSyncGatewayRuntime(db: IDBDatabase, processor?: OutboxProcessorHandle | null): SyncGateway {
  runtimeState.runtime = { db, processor: processor || null };
  runtimeState.gateway = createRuntimeGateway(db, processor);
  runtimeState.diagnostics.bound = true;
  const runtime = runtimeState.runtime;
  const waiters = [...runtimeState.waiters];
  runtimeState.waiters.length = 0;
  for (const notify of waiters) notify(runtime);
  return runtimeState.gateway;
}

export function getSyncGatewayDiagnostics(): SyncGatewayDiagnostics {
  return { ...runtimeState.diagnostics };
}

export const syncGateway: SyncGateway = {
  async enqueueUpsert(input) {
    await waitForRuntime();
    return (runtimeState.gateway || createRuntimeGateway(getRuntimeOrThrow().db, getRuntimeOrThrow().processor)).enqueueUpsert(input);
  },
  async enqueueDelete(input) {
    await waitForRuntime();
    return (runtimeState.gateway || createRuntimeGateway(getRuntimeOrThrow().db, getRuntimeOrThrow().processor)).enqueueDelete(input);
  },
  async enqueueRpc(input) {
    await waitForRuntime();
    return (runtimeState.gateway || createRuntimeGateway(getRuntimeOrThrow().db, getRuntimeOrThrow().processor)).enqueueRpc(input);
  },
  async flushNow(options) {
    await waitForRuntime(options?.timeoutMs ? Math.max(options.timeoutMs, 1500) : 15000);
    return (runtimeState.gateway || createRuntimeGateway(getRuntimeOrThrow().db, getRuntimeOrThrow().processor)).flushNow(options);
  },
};

