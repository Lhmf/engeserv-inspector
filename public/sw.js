/**
 * Service Worker — EngeServ Inspector
 *
 * Cache-first para assets estáticos, network-first para APIs.
 * Background Sync para fila de upload quando offline.
 */

const CACHE_NAME = "engeserv-v1";
const STATIC_ASSETS = [
  "/",
  "/login",
  "/dashboard",
  "/manifest.json",
];

// Instalação: cache assets estáticos
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Ativação: limpar caches antigos
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

// Interceptar requisições
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API requests: network-first com fallback
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Static assets (Next.js chunks, JS, CSS): cache-first
  if (
    url.pathname.startsWith("/_next/") ||
    url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff2?)$/)
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Pages: network-first
  event.respondWith(networkFirst(request));
});

// Cache-first: busca do cache, se não tiver, busca da rede
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response("Offline", { status: 503 });
  }
}

// Network-first: tenta rede, fallback pro cache
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;

    // Para POST/PUT offline, tenta registrar sync
    if (request.method !== "GET") {
      try {
        const registration = await self.registration;
        await registration.sync.register("sync-queue");
      } catch (_) {
        // Background Sync não suportado
      }
    }

    return new Response(JSON.stringify({ error: "Offline", offline: true }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Background Sync
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-queue") {
    event.waitUntil(processQueue());
  }
});

async function processQueue() {
  try {
    // Tenta processar a fila via IndexedDB
    const db = await openDB();
    const tx = db.transaction("syncQueue", "readonly");
    const store = tx.objectStore("syncQueue");
    const items = await store.getAll();

    for (const item of items) {
      try {
        await fetch(item.url, {
          method: item.method,
          headers: item.headers,
          body: item.body,
        });

        // Remove da fila após sucesso
        const deleteTx = db.transaction("syncQueue", "readwrite");
        const deleteStore = deleteTx.objectStore("syncQueue");
        deleteStore.delete(item.id);
      } catch (e) {
        console.error("Sync failed for:", item.url, e);
        // Deixa na fila para próxima tentativa
      }
    }
  } catch (e) {
    console.error("Queue processing error:", e);
  }
}

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("EngeServSync", 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("syncQueue")) {
        db.createObjectStore("syncQueue", { keyPath: "id", autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
