'use client'

import { useAuth } from '@/hooks/useAuth'
import { OfflineBanner } from '@/components/molecules/OfflineBanner'

export function AppHeader() {
  const { user, loading, signOut } = useAuth()

  return (
    <>
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-gray-900">📖 3色メモ</span>
        </div>

        <nav className="flex items-center gap-4">
          <a href="/app" className="text-sm text-gray-600 hover:text-gray-900">
            マイ本棚
          </a>
          <a href="/app/review" className="text-sm text-gray-600 hover:text-gray-900">
            復習
          </a>
          <a href="/app/demo" className="hidden text-sm text-gray-600 hover:text-gray-900 sm:inline">
            デモ
          </a>
          <a href="/app/settings" className="text-sm text-gray-600 hover:text-gray-900">
            設定
          </a>

          {loading ? (
            <div className="h-8 w-20 animate-pulse rounded-full bg-gray-200" />
          ) : user ? (
            <div className="flex items-center gap-3">
              <span className="hidden max-w-[140px] truncate text-xs text-gray-500 sm:inline">
                {user.email}
              </span>
              <button
                type="button"
                onClick={signOut}
                className="rounded-full border border-gray-300 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50"
              >
                ログアウト
              </button>
            </div>
          ) : null}
        </nav>
      </header>
      <OfflineBanner />
    </>
  )
}
