import { DB_NAME, DB_VERSION, STORES } from "./schema.js";
export function isIndexedDBAvailable() {
    return typeof indexedDB !== "undefined";
}
function requestToPromise(request) {
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error || new Error("IDB request failed"));
    });
}
export function txDone(tx) {
    return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onabort = () => reject(tx.error || new Error("IDB transaction aborted"));
        tx.onerror = () => reject(tx.error || new Error("IDB transaction error"));
    });
}
export async function withStore(db, storeName, mode, handler) {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const result = await handler(store, tx);
    await txDone(tx);
    return result;
}
export async function getByKey(db, storeName, key) {
    return withStore(db, storeName, "readonly", async (store) => {
        const result = await requestToPromise(store.get(key));
        return result === undefined ? undefined : result;
    });
}
export async function putValue(db, storeName, value) {
    await withStore(db, storeName, "readwrite", async (store) => {
        await requestToPromise(store.put(value));
    });
}
export async function deleteByKey(db, storeName, key) {
    await withStore(db, storeName, "readwrite", async (store) => {
        await requestToPromise(store.delete(key));
    });
}
export async function getAllFromStore(db, storeName) {
    return withStore(db, storeName, "readonly", async (store) => requestToPromise(store.getAll()));
}
export async function getAllKeysFromStore(db, storeName) {
    return withStore(db, storeName, "readonly", async (store) => requestToPromise(store.getAllKeys()));
}
export async function openAppDB(options) {
    if (!isIndexedDBAvailable())
        throw new Error("IndexedDB indisponivel neste ambiente.");
    if (options?.signal?.aborted)
        throw new DOMException("Aborted", "AbortError");
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(options?.dbName || DB_NAME, options?.dbVersion || DB_VERSION);
        const onAbort = () => {
            try {
                request.onerror = null;
                request.onsuccess = null;
                request.onupgradeneeded = null;
            }
            catch {
                /* noop */
            }
            reject(new DOMException("Aborted", "AbortError"));
        };
        if (options?.signal)
            options.signal.addEventListener("abort", onAbort, { once: true });
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
            if (options?.signal)
                options.signal.removeEventListener("abort", onAbort);
            const db = request.result;
            db.onversionchange = () => {
                db.close();
            };
            resolve(db);
        };
        request.onerror = () => {
            if (options?.signal)
                options.signal.removeEventListener("abort", onAbort);
            reject(request.error || new Error("Falha ao abrir IndexedDB"));
        };
        request.onblocked = () => {
            console.warn("[IndexedDB] open blocked: another tab may be holding an old connection.");
            if (options?.signal)
                options.signal.removeEventListener("abort", onAbort);
            request.onerror = null;
            request.onsuccess = null;
            request.onupgradeneeded = null;
            reject(new Error("IDB_OPEN_BLOCKED"));
        };
    });
}
//# sourceMappingURL=openDB.js.map