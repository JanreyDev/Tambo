/**
 * Census Offline Support — IndexedDB queue + sync.
 *
 * Handles:
 * 1. Queuing submissions when offline
 * 2. Auto-saving form drafts (survives page close/refresh)
 * 3. Syncing pending submissions when connection restores
 * 4. Connection status detection
 */

const DB_NAME = "bcmp-census";
const DB_VERSION = 1;
const STORE_PENDING = "pending";
const STORE_DRAFTS = "drafts";

// ── IndexedDB helpers ─────────────────────────────────────────────────────

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_PENDING)) {
        db.createObjectStore(STORE_PENDING, { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(STORE_DRAFTS)) {
        db.createObjectStore(STORE_DRAFTS, { keyPath: "key" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ── Pending submissions (offline queue) ───────────────────────────────────

export interface PendingSubmission {
  id?: number;
  payload: Record<string, unknown>;
  created_at: string;
  attempts: number;
  last_error?: string;
}

export async function queueSubmission(payload: Record<string, unknown>): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_PENDING, "readwrite");
  tx.objectStore(STORE_PENDING).add({
    payload,
    created_at: new Date().toISOString(),
    attempts: 0,
  });
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getPendingCount(): Promise<number> {
  const db = await openDB();
  const tx = db.transaction(STORE_PENDING, "readonly");
  const store = tx.objectStore(STORE_PENDING);
  return new Promise((resolve, reject) => {
    const req = store.count();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getAllPending(): Promise<PendingSubmission[]> {
  const db = await openDB();
  const tx = db.transaction(STORE_PENDING, "readonly");
  const store = tx.objectStore(STORE_PENDING);
  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function removePending(id: number): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_PENDING, "readwrite");
  tx.objectStore(STORE_PENDING).delete(id);
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function updatePendingAttempt(id: number, error: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_PENDING, "readwrite");
  const store = tx.objectStore(STORE_PENDING);
  const req = store.get(id);
  req.onsuccess = () => {
    const record = req.result;
    if (record) {
      record.attempts += 1;
      record.last_error = error;
      store.put(record);
    }
  };
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ── Draft auto-save (preserves form state across page close) ──────────────

export async function saveDraft(key: string, data: unknown): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_DRAFTS, "readwrite");
  tx.objectStore(STORE_DRAFTS).put({ key, data, saved_at: new Date().toISOString() });
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadDraft(key: string): Promise<unknown | null> {
  const db = await openDB();
  const tx = db.transaction(STORE_DRAFTS, "readonly");
  const store = tx.objectStore(STORE_DRAFTS);
  return new Promise((resolve, reject) => {
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result?.data ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function clearDraft(key: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_DRAFTS, "readwrite");
  tx.objectStore(STORE_DRAFTS).delete(key);
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ── Sync engine (flush pending queue when online) ─────────────────────────

type SubmitFn = (payload: Record<string, unknown>) => Promise<{ resident: { resident_number: string } }>;

export async function syncPendingSubmissions(
  submitFn: SubmitFn,
  onProgress?: (synced: number, total: number, failed: number) => void,
): Promise<{ synced: number; failed: number }> {
  const pending = await getAllPending();
  if (pending.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;

  for (const item of pending) {
    try {
      await submitFn(item.payload);
      await removePending(item.id!);
      synced++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      await updatePendingAttempt(item.id!, msg);
      failed++;
    }
    onProgress?.(synced, pending.length, failed);
  }

  return { synced, failed };
}
