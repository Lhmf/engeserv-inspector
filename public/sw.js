/**
 * Service Worker — EngeServ Inspector (RC2)
 *
 * - Cache-first para assets estáticos (_next/*, png, css, js)
 * - Network-first para APIs, com fallback para o cache.
 * - Cache do app shell para navegação offline (fallback → /login).
 * - Background Sync para fila de envio quando a conexão volta.
 */
const CACHE_NAME = "engeserv-v4";

// App shell: páginas principais ficam disponíveis offline
const APP_SHELL = [
  "/",
  "/login",
  "/dashboard",
  "/clientes",
  "/equipamentos",
  "/inspecoes",
  "/inspecoes/novo",
  "/laudos",
  "/validades",
  "/configuracoes",
  "/manifest.json",
];

const STATIC_EXT = /\.(js|css|png|jpg|jpeg|gif|svg|ico|webp|woff2?|ttf|otf|eot)$/;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Só intercepta requisições same-origin
  if (url.origin !== self.location.origin) return;

  // Requisições de API: network-first
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Assets estáticos: cache-first
  if (url.pathname.startsWith("/_next/") || STATIC_EXT.test(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Navegação: network-first com fallback para o app shell (offline)
  if (request.mode === "navigate") {
    event.respondWith(
      networkFirst(request).catch(() => {
        return caches.match("/login");
      })
    );
    return;
  }

  // Demais: network-first
  event.respondWith(networkFirst(request));
});

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
        const deleteTx = db.transaction("syncQueue", "readwrite");
        const deleteStore = deleteTx.objectStore("syncQueue");
        deleteStore.delete(item.id);
      } catch (e) {
        console.error("Sync failed for:", item.url, e);
      }
    }
  } catch (e) {
    console.error("Queue processing error:", e);
  }
}

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("EngeServSync", 2);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("syncQueue")) {
        db.createObjectStore("syncQueue", { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains("photos")) {
        db.createObjectStore("photos", { keyPath: "id", autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}