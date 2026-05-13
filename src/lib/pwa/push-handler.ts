/**
 * プッシュ通知ハンドラ。
 * Phase 3-5（復習リマインダー）で本格的に使用する想定。
 * 現時点ではハンドラの骨組みのみ。
 */

export interface PushPayload {
  title: string
  body: string
  url?: string
  icon?: string
}

/** 通知許可状態を取得 */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof Notification === 'undefined') return 'unsupported'
  return Notification.permission
}

/** 通知許可をリクエスト */
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof Notification === 'undefined') return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  return Notification.requestPermission()
}

/** Push Subscription の登録（VAPIDキーが設定されている場合のみ） */
export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return null
  if (!('PushManager' in window)) return null

  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  if (!vapidKey) {
    console.warn('VAPID 公開鍵が設定されていないため push 購読をスキップ')
    return null
  }

  const reg = await navigator.serviceWorker.ready
  const existing = await reg.pushManager.getSubscription()
  if (existing) return existing

  return reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: vapidKey,
  })
}
