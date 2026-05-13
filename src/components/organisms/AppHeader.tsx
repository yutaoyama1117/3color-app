'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { OfflineBanner } from '@/components/molecules/OfflineBanner'

export function AppHeader() {
  const { user, loading, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()

  const initial = user?.email?.[0]?.toUpperCase() ?? '?'

  // ページタイトルを判定
  const getTitle = () => {
    if (pathname === '/app') return 'マイ本棚'
    if (pathname === '/app/review') return '復習'
    if (pathname === '/app/settings') return '設定'
    if (pathname === '/app/register') return 'コンテンツを追加'
    if (pathname?.startsWith('/app/contents/')) return '' // 詳細ページは独自ヘッダー
    return '3色メモ'
  }

  const title = getTitle()

  // 詳細ページでは独自ヘッダーがあるため非表示
  if (pathname?.startsWith('/app/contents/')) {
    return <OfflineBanner />
  }

  return (
    <>
      {/* iOS ナビゲーションバー風ヘッダー */}
      <header className="sticky top-0 z-50 border-b border-gray-200/60 bg-[#f2f2f7]/80 backdrop-blur-xl safe-area-top">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-2.5">
          {/* 左: ロゴ（本棚以外では戻るボタン） */}
          {pathname === '/app' ? (
            <div className="flex items-center gap-1.5">
              <span className="flex gap-[3px]">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
              </span>
            </div>
          ) : (
            <Link
              href="/app"
              className="flex items-center gap-0.5 text-[17px] font-normal text-blue-500 active:opacity-60"
            >
              <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              本棚
            </Link>
          )}

          {/* 中央: ページタイトル */}
          <h1 className="absolute left-1/2 -translate-x-1/2 text-[17px] font-semibold text-gray-900">
            {title}
          </h1>

          {/* 右: ユーザーアバター or 追加ボタン */}
          <div className="relative flex items-center gap-2">
            {pathname === '/app' && (
              <Link
                href="/app/register"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white active:bg-blue-600"
                aria-label="コンテンツを追加"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </Link>
            )}

            {loading ? (
              <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
            ) : user ? (
              <>
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white"
                >
                  {initial}
                </button>

                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 top-10 z-20 w-52 overflow-hidden rounded-2xl border border-gray-200/50 bg-white/95 shadow-xl backdrop-blur-xl">
                      <div className="border-b border-gray-100 px-4 py-3">
                        <p className="truncate text-[13px] font-medium text-gray-500">{user.email}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setMenuOpen(false); signOut() }}
                        className="w-full px-4 py-3 text-left text-[15px] font-normal text-red-500 active:bg-gray-50"
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

/** iOS風 タブバー（Bottom Navigation） */
const TAB_ITEMS = [
  {
    href: '/app',
    label: '本棚',
    icon: (active: boolean) => (
      <svg className={`h-6 w-6 ${active ? 'text-blue-500' : 'text-gray-400'}`} fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 1.5}>
        {active ? (
          <path d="M4 19.5A2.5 2.5 0 016.5 17H20V4H6.5A2.5 2.5 0 014 6.5v13zM6.5 17A2.5 2.5 0 004 19.5V20h16v-3H6.5z" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        )}
      </svg>
    ),
  },
  {
    href: '/app/review',
    label: '復習',
    icon: (active: boolean) => (
      <svg className={`h-6 w-6 ${active ? 'text-blue-500' : 'text-gray-400'}`} fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 1.5}>
        {active ? (
          <path d="M4.755 10.059a7.5 7.5 0 0112.548-3.364l1.903 1.903H15.75a.75.75 0 000 1.5h4.5a.75.75 0 00.75-.75v-4.5a.75.75 0 00-1.5 0v2.553l-1.97-1.97A9 9 0 002.25 12a.75.75 0 001.5 0 7.5 7.5 0 011.005-3.941zM19.245 13.941a7.5 7.5 0 01-12.548 3.364L4.794 15.402H8.25a.75.75 0 000-1.5h-4.5a.75.75 0 00-.75.75v4.5a.75.75 0 001.5 0v-2.553l1.97 1.97A9 9 0 0021.75 12a.75.75 0 00-1.5 0 7.5 7.5 0 01-1.005 3.941z" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
        )}
      </svg>
    ),
  },
  {
    href: '/app/settings',
    label: '設定',
    icon: (active: boolean) => (
      <svg className={`h-6 w-6 ${active ? 'text-blue-500' : 'text-gray-400'}`} fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 1.5}>
        {active ? (
          <path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 00-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 00-2.282.819l-.922 1.597a1.875 1.875 0 00.432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 000 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 00-.432 2.385l.922 1.597a1.875 1.875 0 002.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 002.28-.819l.923-1.597a1.875 1.875 0 00-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 000-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 00-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 00-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 00-1.85-1.567h-1.843zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" clipRule="evenodd" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
        )}
      </svg>
    ),
  },
]

export function AppTabBar() {
  const pathname = usePathname()

  // 詳細ページ・登録ページではタブバーを隠す
  if (pathname?.startsWith('/app/contents/') || pathname === '/app/register') {
    return null
  }

  return (
    <nav className="sticky bottom-0 z-40 border-t border-gray-200/60 bg-[#f2f2f7]/80 backdrop-blur-xl safe-area-bottom">
      <div className="mx-auto flex max-w-md items-center justify-around px-4 py-1.5">
        {TAB_ITEMS.map(({ href, label, icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-0.5 px-4 py-1"
            >
              {icon(active)}
              <span className={`text-[10px] font-medium ${active ? 'text-blue-500' : 'text-gray-400'}`}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
