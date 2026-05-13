'use client'

import { useNetworkStatus } from '@/hooks/use-network-status'

/** オフライン時にヘッダー下部に表示するバナー */
export function OfflineBanner() {
  const { isOnline } = useNetworkStatus()
  if (isOnline) return null

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-xs text-amber-800">
      📵 オフラインモード — 閲覧と編集は可能です。変更はオンライン復帰時に同期されます
    </div>
  )
}
