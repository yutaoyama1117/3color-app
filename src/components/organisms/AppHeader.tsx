'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { OfflineBanner } from '@/components/molecules/OfflineBanner'

const NAV_ITEMS = [
  { href: '/app', label: 'マイ本棚' },
  { href: '/app/review', label: '復習' },
  { href: '/app/settings', label: '設定' },
]

export function AppHeader() {
  const { user, loading, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  // メールアドレスの頭文字をアバターに使う
  const initial = user?.email?.[0]?.toUpperCase() ?? '?'

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          {/* ロゴ */}
          <a href="/app" className="flex items-center gap-2 group">
            <span className="flex gap-0.5">
              <span className="h-3 w-3 rounded-full bg-red-400 transition-transform group-hover:scale-110" />
              <span className="h-3 w-3 rounded-full bg-blue-400 transition-transform group-hover:scale-110 delay-75" />
              <span className="h-3 w-3 rounded-full bg-green-400 transition-transform group-hover:scale-110 delay-150" />
            </span>
            <span className="text-base font-semibold tracking-tight text-gray-900">3色メモ</span>
          </a>

          {/* ナビゲーション */}
          <nav className="hidden items-center gap-1 sm:flex">
            {NAV_ITEMS.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                className="rounded-lg px-3 py-1.5 text-sm text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
              >
                {label}
              </a>
            ))}
          </nav>

          {/* ユーザーアバター */}
          <div className="relative">
            {loading ? (
              <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
            ) : user ? (
              <>
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white shadow-sm transition-transform hover:scale-105"
                >
                  {initial}
                </button>

                {/* ドロップダウン */}
                {menuOpen && (
                  <>
                    {/* オーバーレイ（外クリックで閉じる） */}
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-10 z-20 w-44 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg">
                      <div className="border-b border-gray-50 px-4 py-2.5">
                        <p className="truncate text-xs text-gray-400">{user.email}</p>
                      </div>
                      {/* スマホのみナビを表示 */}
                      <div className="sm:hidden">
                        {NAV_ITEMS.map(({ href, label }) => (
                          <a
                            key={href}
                            href={href}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            onClick={() => setMenuOpen(false)}
                          >
                            {label}
                          </a>
                        ))}
                        <div className="border-t border-gray-50" />
                      </div>
                      <button
                        type="button"
                        onClick={() => { setMenuOpen(false); signOut() }}
                        className="w-full px-4 py-2.5 text-left text-sm text-red-500 hover:bg-red-50"
                      >
                        ログアウト
                      </button>
                    </div>
                  </>
                )}
              </>
            ) : null}
          </div>
        </div>
      </header>
      <OfflineBanner />
    </>
  )
}
