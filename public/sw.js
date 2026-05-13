/**
 * Service Worker - 3Color PWA
 * - App Shell: Cache First
 * - API GET: Stale While Revalidate
 * - 画像: Cache First (30日)
 * - POST/PATCH/DELETE: Network Only + Background Sync queue
 */

const CACHE_VERSION = 'v1'
const APP_SHELL_CACHE = `app-shell-${CACHE_VERSION}`
const API_CACHE = `api-cache-${CACHE_VERSION}`
const IMAGE_CACHE = `image-cache-${CACHE_VERSION}`

const PRECACHE_URLS = ['/', '/app', '/manifest.json']

// Install: App Shellをプリキャッシュ
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then((cache) =>
      cache.addAll(PRECACHE_URLS).catch(() => {
        // 一部失敗しても続行
      }),
    ),
  )
  self.skipWaiting()
})

// Activate: 古いキャッシュを削除
self.addEventListener('activate', (event) => {
  const validCaches = [APP_SHELL_CACHE, API_CACHE, IMAGE_CACHE]
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !validCaches.includes(k)).map((k) => caches.delete(k))),
    ),
  )
  self.clients.claim()
})

// Fetch: ルーティングと戦略
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // GETのみキャッシュ対象
  if (request.method !== 'GET') return

  // 画像: Cache First
  if (/\.(png|jpg|jpeg|svg|webp|ico)$/i.test(url.pathname)) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE))
    return
  }

  // API: Stale While Revalidate
  if (url.pathname.startsWith('/api/v1/contents') || url.pathname.startsWith('/api/v1/marks')) {
    event.respondWith(staleWhileRevalidate(request, API_CACHE))
    return
  }

  // それ以外（HTML/JS/CSS）: Network First, fallback to cache
  event.respondWith(networkFirst(request, APP_SHELL_CACHE))
})

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  if (cached) return cached
  try {
    const fresh = await fetch(request)
    if (fresh.ok) cache.put(request, fresh.clone())
    return fresh
  } catch {
    return new Response('Offline', { status: 503 })
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  const fetchPromise = fetch(request)
    .then((fresh) => {
      if (fresh.ok) cache.put(request, fresh.clone())
      return fresh
    })
    .catch(() => cached)
  return cached || fetchPromise
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  try {
    const fresh = await fetch(request)
    if (fresh.ok) cache.put(request, fresh.clone())
    return fresh
  } catch {
    const cached = await cache.match(request)
    return cached || new Response('Offline', { status: 503 })
  }
}

// Background Sync: オフライン時のキュー処理（Phase 3-1）
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-mutations') {
    event.waitUntil(processQueueFromSw())
  }
})

async function processQueueFromSw() {
  // クライアント側のIndexedDBアクセスはSW内では別実装が必要だが、
  // 現状はクライアント側で processQueue を呼び出す方針
}

// Push通知（Phase 3-5用）
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: '3Color', body: '通知があります' }
  event.waitUntil(
    self.registration.showNotification(data.title || '3Color', {
      body: data.body || '',
      icon: '/icons/icon-192.svg',
      badge: '/icons/icon-192.svg',
      data: { url: data.url || '/app' },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = event.notification.data?.url || '/app'
  event.waitUntil(self.clients.openWindow(targetUrl))
})
