/**
 * Offline Sync Client
 *
 * Gerencia fila de sincronização para requisições feitas offline.
 * Quando a conexão retorna, processa a fila automaticamente.
 */

const DB_NAME = "EngeServSync";
const DB_VERSION = 2;
const STORE_NAME = "syncQueue";

export interface SyncQueueItem {
  id?: number;
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string | null;
  createdAt: number;
  retries: number;
}

/** Rascunho local de uma inspeção em andamento (Wizard). */
export interface InspectionDraft {
  id: string; // inspectionId
  inspectionId: string;
  type: string;
  notes: string | null;
  recommendations: string[];
  measurements: any[];
  updatedAt: number;
}

/** Foto capturada offline, aguardando envio. Blob armazenado como dataURL. */
export interface QueuedPhoto {
  id?: number;
  inspectionId: string;
  category: string;
  dataUrl: string;
  caption?: string;
  createdAt: number;
}

// ============================================================
// IndexedDB Helpers
// ============================================================

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
      }
      // Store for cached inspection data
      if (!db.objectStoreNames.contains("inspections")) {
        db.createObjectStore("inspections", { keyPath: "id" });
      }
      // Store for cached equipment
      if (!db.objectStoreNames.contains("equipments")) {
        db.createObjectStore("equipments", { keyPath: "id" });
      }
      // Store for cached clients
      if (!db.objectStoreNames.contains("clients")) {
        db.createObjectStore("clients", { keyPath: "id" });
      }
      // Drafts (Wizard offline)
      if (!db.objectStoreNames.contains("drafts")) {
        db.createObjectStore("drafts", { keyPath: "id" });
      }
      // Offline photo queue
      if (!db.objectStoreNames.contains("photoQueue")) {
        db.createObjectStore("photoQueue", { keyPath: "id", autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ============================================================
// Public API
// ============================================================

let _isOnline = navigator.onLine;

const listeners = new Set<(online: boolean) => void>();

export function initOfflineDetection() {
  window.addEventListener("online", () => {
    _isOnline = true;
    listeners.forEach((l) => l(true));
    processQueue();
  });
  window.addEventListener("offline", () => {
    _isOnline = false;
    listeners.forEach((l) => l(false));
  });
}

export function isOnline(): boolean {
  return _isOnline;
}

export function onOnlineChange(callback: (online: boolean) => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

// ============================================================
// Sync Queue
// ============================================================

export async function addToQueue(url: string, method: string, body: any = null) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);

  const item: SyncQueueItem = {
    url,
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : null,
    createdAt: Date.now(),
    retries: 0,
  };

  store.add(item);

  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getQueueSize(): Promise<number> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readonly");
  const store = tx.objectStore(STORE_NAME);
  const count = await new Promise<number>((resolve, reject) => {
    const req = store.count();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return count;
}

export async function processQueue() {
  if (!_isOnline) return;

  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readonly");
  const store = tx.objectStore(STORE_NAME);
  const items = await new Promise<SyncQueueItem[]>((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  for (const item of items) {
    try {
      const res = await fetch(item.url, {
        method: item.method,
        headers: item.headers,
        body: item.body,
      });

      if (res.ok) {
        const deleteTx = db.transaction(STORE_NAME, "readwrite");
        const deleteStore = deleteTx.objectStore(STORE_NAME);
        deleteStore.delete(item.id!);
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (e) {
      console.warn(`[Offline] Sync falhou para ${item.method} ${item.url}:`, e);
    }
  }
}

// ============================================================
// Local Cache (IndexedDB)
// ============================================================

export async function cacheData(storeName: string, data: any) {
  const db = await openDB();
  const tx = db.transaction(storeName, "readwrite");
  const store = tx.objectStore(storeName);
  if (Array.isArray(data)) {
    data.forEach((item) => store.put(item));
  } else {
    store.put(data);
  }
}

export async function getCachedData(storeName: string, id?: string): Promise<any> {
  const db = await openDB();
  const tx = db.transaction(storeName, "readonly");
  const store = tx.objectStore(storeName);
  if (id) {
    return new Promise((resolve, reject) => {
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ============================================================
// Offline Fetch (tenta rede, fallback cache)
// ============================================================

export async function offlineFetch(url: string, options?: RequestInit): Promise<any> {
  try {
    if (!_isOnline) throw new Error("Offline");

    const res = await fetch(url, options);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();

    // Cache successful GETs
    if (!options || options.method === undefined || options.method === "GET") {
      const storeName = url.includes("/api/clientes") ? "clients"
        : url.includes("/api/equipamentos") ? "equipments"
        : url.includes("/api/inspections") ? "inspections"
        : null;
      if (storeName) {
        cacheData(storeName, data);
      }
    }

    return data;
  } catch (e) {
    // Try cache
    const storeName = url.includes("/api/clientes") ? "clients"
      : url.includes("/api/equipamentos") ? "equipments"
      : url.includes("/api/inspections") ? "inspections"
      : null;

    if (storeName) {
      const cached = await getCachedData(storeName);
      if (cached) return cached;
    }

    throw e;
  }
}

// ============================================================
// Wizard Drafts (local persistence)
// ============================================================

/** Salva (ou atualiza) o rascunho local de uma inspeção. */
export async function saveDraft(draft: InspectionDraft): Promise<void> {
  const db = await openDB();
  const tx = db.transaction("drafts", "readwrite");
  tx.objectStore("drafts").put(draft);
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Recupera o rascunho local de uma inspeção (ou null). */
export async function getDraft(inspectionId: string): Promise<InspectionDraft | undefined> {
  const db = await openDB();
  const tx = db.transaction("drafts", "readonly");
  const store = tx.objectStore("drafts");
  return new Promise((resolve, reject) => {
    const req = store.get(inspectionId);
    req.onsuccess = () => resolve(req.result as InspectionDraft | undefined);
    req.onerror = () => reject(req.error);
  });
}

/** Remove o rascunho local após o envio. */
export async function clearDraft(inspectionId: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction("drafts", "readwrite");
  tx.objectStore("drafts").delete(inspectionId);
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ============================================================
// Offline Photo Queue
// ============================================================

/** Enfileira uma foto capturada offline (só guardada localmente). */
export async function enqueuePhoto(photo: Omit<QueuedPhoto, "id" | "createdAt">): Promise<number> {
  const db = await openDB();
  const tx = db.transaction("photoQueue", "readwrite");
  const store = tx.objectStore("photoQueue");
  return new Promise<number>((resolve, reject) => {
    const req = store.add({ ...photo, createdAt: Date.now() } as QueuedPhoto);
    req.onsuccess = () => resolve(req.result as number);
    req.onerror = () => reject(req.error);
  });
}

/** Lista fotos pendentes para uma inspeção. */
export async function getQueuedPhotos(inspectionId?: string): Promise<QueuedPhoto[]> {
  const db = await openDB();
  const tx = db.transaction("photoQueue", "readonly");
  const store = tx.objectStore("photoQueue");
  const all = await new Promise<QueuedPhoto[]>((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result as QueuedPhoto[]);
    req.onerror = () => reject(req.error);
  });
  return inspectionId ? all.filter((p) => p.inspectionId === inspectionId) : all;
}

/** Remove uma foto da fila após envio com sucesso. */
export async function removeQueuePhoto(id: number): Promise<void> {
  const db = await openDB();
  const tx = db.transaction("photoQueue", "readwrite");
  tx.objectStore("photoQueue").delete(id);
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Total de itens pendentes de sincronização (fila geral + fotos). */
export async function getPendingSyncCount(): Promise<number> {
  const db = await openDB();
  const count = async (storeName: string) => {
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    return new Promise<number>((resolve, reject) => {
      const req = store.count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  };
  return (await count(STORE_NAME)) + (await count("photoQueue"));
}

/** `true` se a fila de sincronização (incl. fotos) está vazia. */
export async function isQueueEmpty(): Promise<boolean> {
  return (await getPendingSyncCount()) === 0;
}

/** Dispara o processamento da fila assim que a conexão voltar. */
export function registerAutoFlush(onFlushed?: () => void) {
  initOfflineDetection();
  window.addEventListener("online", () => {
    processQueue();
    onFlushed?.();
  });
}
