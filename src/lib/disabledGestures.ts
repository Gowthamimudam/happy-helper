/**
 * Persist removed built-in gestures in IndexedDB so deletions survive browser restarts.
 * Includes one-time migration from legacy localStorage storage.
 */

const DB_NAME = "signspeak-gestures";
const DB_VERSION = 2;
const STORE_NAME = "deleted_builtin_gestures";
const LEGACY_STORAGE_KEY = "signspeak-disabled-gestures";

interface DeletedBuiltInGesture {
  name: string;
  deletedAt: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "name" });
      }

      // Migrate legacy localStorage disabled gestures once.
      try {
        const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
        const legacyNames: string[] = raw ? JSON.parse(raw) : [];
        if (legacyNames.length > 0) {
          const tx = req.transaction;
          if (tx) {
            const store = tx.objectStore(STORE_NAME);
            for (const name of legacyNames) {
              store.put({ name, deletedAt: Date.now() });
            }
          }
          localStorage.removeItem(LEGACY_STORAGE_KEY);
        }
      } catch {
        // Ignore migration errors and continue.
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getDisabledGestures(): Promise<string[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();

    req.onsuccess = () => {
      const rows = (req.result as DeletedBuiltInGesture[]) ?? [];
      resolve(rows.map((row) => row.name));
    };
    req.onerror = () => reject(req.error);
  });
}

export async function disableGesture(name: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put({ name, deletedAt: Date.now() });

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function disableGestures(names: string[]): Promise<void> {
  const uniqueNames = [...new Set(names)];
  if (uniqueNames.length === 0) return;

  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    for (const name of uniqueNames) {
      store.put({ name, deletedAt: Date.now() });
    }

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function enableGesture(name: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.delete(name);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function isGestureDisabled(name: string): Promise<boolean> {
  const disabled = await getDisabledGestures();
  return disabled.includes(name);
}
