import { STORES, bytesOfString, nowMs, sha256Hex, shouldMigrateKey, type LocalStorageMirrorRecord } from "./schema.js";
import { getByKey, openAppDB, withStore } from "./openDB.js";
import { getMigrationMeta } from "./migrateLocalStorageMirror.js";

export interface StorageFacadeOptions {
  dualWriteLocalStorage?: boolean;
  removeLocalOnDelete?: boolean;
  db?: IDBDatabase;
  dbPromise?: Promise<IDBDatabase>;
}

export interface StorageFacade {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
  getMigrationStatus(): Promise<{ migrated: boolean; migrating: boolean; usingIndexedDB: boolean }>;
}

async function resolveDB(options: StorageFacadeOptions): Promise<IDBDatabase | null> {
  try {
    if (options.db) return options.db;
    if (options.dbPromise) return await options.dbPromise;
    return await openAppDB();
  } catch (error) {
    console.warn("[storageFacade] IndexedDB indisponivel, usando fallback localStorage.", error);
    return null;
  }
}

async function upsertMirror(db: IDBDatabase, key: string, value: string): Promise<void> {
  const checksum = await sha256Hex(value);
  const rec: LocalStorageMirrorRecord = {
    key,
    value,
    checksum,
    size: bytesOfString(value),
    updatedAt: nowMs(),
    migratedAt: nowMs(),
  };
  await withStore<void>(db, STORES.localStorageMirror, "readwrite", async (store) => {
    store.put(rec);
  });
}

async function tombstoneDelete(db: IDBDatabase, key: string): Promise<void> {
  await withStore<void>(db, STORES.meta, "readwrite", async (store) => {
    store.put({ key: `deleted::${key}`, value: { deleted: true, at: nowMs() }, updatedAt: nowMs() });
  });
  await withStore<void>(db, STORES.localStorageMirror, "readwrite", async (store) => {
    store.delete(key);
  });
}

export function createStorageFacade(options: StorageFacadeOptions = {}): StorageFacade {
  const dualWriteLocalStorage = options.dualWriteLocalStorage ?? true;
  const removeLocalOnDelete = options.removeLocalOnDelete ?? false;

  return {
    async get(key: string) {
      const db = await resolveDB(options);
      if (!db || !shouldMigrateKey(key)) return localStorage.getItem(key);
      try {
        const meta = await getMigrationMeta(db);
        if (!meta.migrated) return localStorage.getItem(key);
        const rec = await getByKey<LocalStorageMirrorRecord>(db, STORES.localStorageMirror, key);
        if (rec && typeof rec.value === "string") return rec.value;
        return localStorage.getItem(key);
      } catch (error) {
        console.warn("[storageFacade] get fallback localStorage", { key, error });
        return localStorage.getItem(key);
      }
    },

    async set(key: string, value: string) {
      const db = await resolveDB(options);
      const normalized = String(value);
      const migratable = shouldMigrateKey(key);

      if (!db || !migratable) {
        localStorage.setItem(key, normalized);
        return;
      }

      try {
        await upsertMirror(db, key, normalized);
        if (dualWriteLocalStorage) localStorage.setItem(key, normalized);
      } catch (error) {
        console.warn("[storageFacade] set failed in IDB, fallback localStorage", { key, error });
        localStorage.setItem(key, normalized);
      }
    },

    async remove(key: string) {
      const db = await resolveDB(options);
      const migratable = shouldMigrateKey(key);
      if (!db || !migratable) {
        localStorage.removeItem(key);
        return;
      }
      try {
        await tombstoneDelete(db, key);
        if (removeLocalOnDelete) localStorage.removeItem(key);
      } catch (error) {
        console.warn("[storageFacade] remove failed in IDB, fallback localStorage", { key, error });
        localStorage.removeItem(key);
      }
    },

    async getMigrationStatus() {
      const db = await resolveDB(options);
      if (!db) return { migrated: false, migrating: false, usingIndexedDB: false };
      try {
        const meta = await getMigrationMeta(db);
        return { migrated: meta.migrated, migrating: meta.migrating, usingIndexedDB: true };
      } catch {
        return { migrated: false, migrating: false, usingIndexedDB: true };
      }
    },
  };
}
