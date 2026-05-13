'use client'

import { useEffect } from 'react'
import { processQueue } from '@/lib/pwa/sync-queue'

/** Service Worker を登録し、オンライン復帰時にキュー処理を実行する */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
    if (process.env.NODE_ENV !== 'production') return

    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('Service Worker 登録失敗:', err)
    })

    const handleOnline = () => {
      processQueue().catch(() => {
        // 失敗は無視（後で再試行）
      })
    }
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [])

  return null
}
