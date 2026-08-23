import { DB_NAME, DB_VERSION, STORES, type MetaRecord, type OutboxRecord, type LocalStorageMirrorRecord } from "./schema.js";

export interface DBSchemaMap {
  [STORES.localStorageMirror]: LocalStorageMirrorRecord;
  [STORES.meta]: MetaRecord;
  [STORES.outbox]: OutboxRecord;
}

export type TxMode = IDBTransactionMode;

export function isIndexedDBAvailable(): boolean {
  return typeof indexedDB !== "undefined";
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("IDB request failed"));
  });
}

export function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error || new Error("IDB transaction aborted"));
    tx.onerror = () => reject(tx.error || new Error("IDB transaction error"));
  });
}

export async function withStore<T>(
  db: IDBDatabase,
  storeName: string,
  mode: TxMode,
  handler: (store: IDBObjectStore, tx: IDBTransaction) => Promise<T> | T,
): Promise<T> {
  const tx = db.transaction(storeName, mode);
  const store = tx.objectStore(storeName);
  const result = await handler(store, tx);
  await txDone(tx);
  return result;
}

export async function getByKey<T = unknown>(db: IDBDatabase, storeName: string, key: IDBValidKey): Promise<T | undefined> {
  return withStore<T | undefined>(db, storeName, "readonly", async (store) => {
    const result = await requestToPromise<T | undefined>(store.get(key));
    return result === undefined ? undefined : result;
  });
}

export async function putValue<T>(db: IDBDatabase, storeName: string, value: T): Promise<void> {
  await withStore<void>(db, storeName, "readwrite", async (store) => {
    await requestToPromise(store.put(value as unknown as IDBValidKey));
  });
}

export async function deleteByKey(db: IDBDatabase, storeName: string, key: IDBValidKey): Promise<void> {
  await withStore<void>(db, storeName, "readwrite", async (store) => {
    await requestToPromise(store.delete(key));
  });
}

export async function getAllFromStore<T = unknown>(db: IDBDatabase, storeName: string): Promise<T[]> {
  return withStore<T[]>(db, storeName, "readonly", async (store) => requestToPromise<T[]>(store.getAll()));
}

export async function getAllKeysFromStore(db: IDBDatabase, storeName: string): Promise<IDBValidKey[]> {
  return withStore<IDBValidKey[]>(db, storeName, "readonly", async (store) => requestToPromise<IDBValidKey[]>(store.getAllKeys()));
}

export async function openAppDB(options?: { signal?: AbortSignal; dbName?: string; dbVersion?: number }): Promise<IDBDatabase> {
  if (!isIndexedDBAvailable()) throw new Error("IndexedDB indisponivel neste ambiente.");
  if (options?.signal?.aborted) throw new DOMException("Aborted", "AbortError");

  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(options?.dbName || DB_NAME, options?.dbVersion || DB_VERSION);

    const onAbort = () => {
      try {
        request.onerror = null;
        request.onsuccess = null;
        request.onupgradeneeded = null;
      } catch {
        /* noop */
      }
      reject(new DOMException("Aborted", "AbortError"));
    };

    if (options?.signal) options.signal.addEventListener("abort", onAbort, { once: true });

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORES.localStorageMirror)) {
        const store = db.createObjectStore(STORES.localStorageMirror, { keyPath: "key" });
        store.createIndex("updatedAt", "updatedAt", { unique: false });
      }
      if (!db.objectStoreNames.contains(STORES.meta)) {
        db.createObjectStore(STORES.meta, { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains(STORES.outbox)) {
        db.createObjectStore(STORES.outbox, { keyPath: "id" });
      }
    };

    request.onsuccess = () => {
      if (options?.signal) options.signal.removeEventListener("abort", onAbort);
      const db = request.result;
      db.onversionchange = () => {
        db.close();
      };
      resolve(db);
    };

    request.onerror = () => {
      if (options?.signal) options.signal.removeEventListener("abort", onAbort);
      reject(request.error || new Error("Falha ao abrir IndexedDB"));
    };

    request.onblocked = () => {
      console.warn("[IndexedDB] open blocked: another tab may be holding an old connection.");
      if (options?.signal) options.signal.removeEventListener("abort", onAbort);
      request.onerror = null;
      request.onsuccess = null;
      request.onupgradeneeded = null;
      reject(new Error("IDB_OPEN_BLOCKED"));
    };
  });
}
