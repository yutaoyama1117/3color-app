/**
 * PWA キャッシュ戦略設定。
 * Service Worker から参照される。
 */

export const CACHE_NAMES = {
  appShell: 'app-shell-v1',
  apiCache: 'api-cache-v1',
  imageCache: 'image-cache-v1',
} as const

/** App Shell（HTML/CSS/JS）でプリキャッシュするパス */
export const PRECACHE_URLS = ['/', '/app', '/app/register', '/login']

/** Cache First（30日間） — 画像・サムネイル */
export const IMAGE_PATTERNS = [/\.(png|jpg|jpeg|svg|webp|ico)$/i, /^https:\/\/img\.youtube\.com\//]

/** Stale While Revalidate — GET API */
export const SWR_API_PATTERNS = [
  /\/api\/v1\/contents/,
  /\/api\/v1\/marks/,
  /\/api\/v1\/tags/,
]

/** Network Only + Background Sync — POST/PATCH/DELETE API */
export const SYNC_QUEUE_PATTERNS = [/\/api\/v1\/marks/, /\/api\/v1\/contents/]

/** キャッシュTTL（秒） */
export const IMAGE_CACHE_TTL_SEC = 60 * 60 * 24 * 30 // 30日
export const API_CACHE_TTL_SEC = 60 * 60 // 1時間
