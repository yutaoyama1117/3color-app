'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useContentStore } from '@/stores/contentStore'
import { useMarkStore } from '@/stores/markStore'
import { buildFullExport, downloadJson } from '@/lib/export/fullExport'

type FontSize = 'sm' | 'base' | 'lg'

export default function SettingsPage() {
  const { user, signOut } = useAuth()
  const { contents } = useContentStore()
  const { marks } = useMarkStore()

  const [fontSize, setFontSize] = useState<FontSize>('base')
  const [exporting, setExporting] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const email = user?.email ?? ''

  useEffect(() => {
    const stored = localStorage.getItem('appearance-settings')
    if (stored) {
      try { setFontSize(JSON.parse(stored).fontSize ?? 'base') } catch { /* 無視 */ }
    }
  }, [])

  const handleFontSizeChange = (size: FontSize) => {
    setFontSize(size)
    document.documentElement.style.fontSize = size === 'sm' ? '14px' : size === 'lg' ? '18px' : '16px'
    localStorage.setItem('appearance-settings', JSON.stringify({ fontSize: size }))
  }

  const showToastMsg = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  const handleExport = () => {
    setExporting(true)
    try {
      const payload = buildFullExport(contents, marks)
      const date = new Date().toISOString().slice(0, 10)
      downloadJson(`3color-export-${date}.json`, payload)
      showToastMsg('エクスポート完了')
    } finally { setExporting(false) }
  }

  const handleClearData = () => {
    localStorage.removeItem('3color-contents')
    localStorage.removeItem('3color-marks')
    localStorage.removeItem('3color-jobs')
    localStorage.removeItem('3color-related-links')
    window.location.reload()
  }

  const handleLogout = async () => {
    setShowLogoutConfirm(false)
    await signOut()
  }

  const totalContents = contents.length
  const totalMarks = marks.length
  const redMarks = marks.filter((m) => m.color === 'red').length
  const blueMarks = marks.filter((m) => m.color === 'blue').length
  const greenMarks = marks.filter((m) => m.color === 'green').length

  return (
    <div className="pb-8">

      {/* アカウント */}
      <div className="mx-4 mt-4 overflow-hidden rounded-xl bg-white">
        <div className="flex items-center gap-3 px-4 py-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-[18px] font-bold text-white">
            {email ? email[0].toUpperCase() : '?'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[17px] font-semibold text-gray-900">
              {email || 'ゲストユーザー'}
            </p>
            <p className="text-[13px] font-normal text-gray-500">ログイン中</p>
          </div>
        </div>
      </div>

      {/* 利用状況 */}
      <p className="mb-1 mt-6 px-8 text-[13px] font-medium uppercase tracking-wide text-gray-500">
        利用状況
      </p>
      <div className="mx-4 overflow-hidden rounded-xl bg-white">
        <div className="grid grid-cols-3 divide-x divide-gray-100">
          <div className="px-3 py-4 text-center">
            <p className="text-[24px] font-bold tracking-tight text-gray-900">{totalContents}</p>
            <p className="mt-0.5 text-[11px] font-medium text-gray-500">コンテンツ</p>
          </div>
          <div className="px-3 py-4 text-center">
            <p className="text-[24px] font-bold tracking-tight text-gray-900">{totalMarks}</p>
            <p className="mt-0.5 text-[11px] font-medium text-gray-500">マーク</p>
          </div>
          <div className="px-3 py-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <span className="flex items-center gap-[3px] text-[13px] font-bold text-red-600">
                <span className="h-[7px] w-[7px] rounded-full bg-red-500" />{redMarks}
              </span>
              <span className="flex items-center gap-[3px] text-[13px] font-bold text-blue-600">
                <span className="h-[7px] w-[7px] rounded-full bg-blue-500" />{blueMarks}
              </span>
              <span className="flex items-center gap-[3px] text-[13px] font-bold text-green-600">
                <span className="h-[7px] w-[7px] rounded-full bg-green-500" />{greenMarks}
              </span>
            </div>
            <p className="mt-1.5 text-[11px] font-medium text-gray-500">色別内訳</p>
          </div>
        </div>
      </div>

      {/* 表示設定 */}
      <p className="mb-1 mt-6 px-8 text-[13px] font-medium uppercase tracking-wide text-gray-500">
        表示設定
      </p>
      <div className="mx-4 overflow-hidden rounded-xl bg-white">
        <div className="px-4 py-3.5">
          <p className="mb-2.5 text-[15px] font-semibold text-gray-900">フォントサイズ</p>
          <div className="flex gap-2">
            {([
              { value: 'sm' as FontSize, label: '小', sample: 'text-[13px]' },
              { value: 'base' as FontSize, label: '中', sample: 'text-[15px]' },
              { value: 'lg' as FontSize, label: '大', sample: 'text-[17px]' },
            ]).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleFontSizeChange(opt.value)}
                className={`flex-1 rounded-lg border py-3 text-center transition-colors ${
                  fontSize === opt.value
                    ? 'border-blue-500 bg-blue-50 text-blue-600'
                    : 'border-gray-200 text-gray-600 active:bg-gray-50'
                }`}
              >
                <span className={`block font-bold ${opt.sample}`}>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* データ管理 */}
      <p className="mb-1 mt-6 px-8 text-[13px] font-medium uppercase tracking-wide text-gray-500">
        データ
      </p>
      <div className="mx-4 overflow-hidden rounded-xl bg-white">
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting || totalContents === 0}
          className="flex w-full items-center justify-between px-4 py-3 text-left active:bg-gray-50 disabled:opacity-40"
        >
          <div className="flex items-center gap-3">
            <span className="text-[20px]">📦</span>
            <span className="text-[15px] font-normal text-gray-900">データをエクスポート</span>
          </div>
          <svg className="h-4 w-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <div className="ml-[52px] border-t border-gray-100" />
        <button
          type="button"
          onClick={() => setShowClearConfirm(true)}
          disabled={totalContents === 0 && totalMarks === 0}
          className="flex w-full items-center justify-between px-4 py-3 text-left active:bg-gray-50 disabled:opacity-40"
        >
          <div className="flex items-center gap-3">
            <span className="text-[20px]">🗑️</span>
            <span className="text-[15px] font-normal text-red-500">データをクリア</span>
          </div>
          <svg className="h-4 w-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* ログアウト */}
      <div className="mx-4 mt-6 overflow-hidden rounded-xl bg-white">
        <button
          type="button"
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full py-3 text-center text-[15px] font-normal text-red-500 active:bg-gray-50"
        >
          ログアウト
        </button>
      </div>

      {/* アプリ情報 */}
      <div className="mt-6 pb-4 text-center">
        <p className="text-[12px] font-normal text-gray-400">3色メモ v1.0.0</p>
      </div>

      {/* データクリア確認 */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
          <div className="w-full max-w-sm rounded-t-2xl bg-white p-6 shadow-xl sm:mx-6 sm:rounded-2xl">
            <h3 className="mb-2 text-center text-[17px] font-bold text-gray-900">データの初期化</h3>
            <p className="mb-6 text-center text-[13px] text-gray-500">
              {totalContents}件のコンテンツと{totalMarks}件のマークが削除されます。この操作は取り消せません。
            </p>
            <div className="space-y-2">
              <button type="button" onClick={handleClearData}
                className="w-full rounded-xl bg-red-500 py-3 text-[16px] font-semibold text-white active:bg-red-600">
                初期化する
              </button>
              <button type="button" onClick={() => setShowClearConfirm(false)}
                className="w-full rounded-xl py-3 text-[16px] font-semibold text-blue-500 active:bg-gray-50">
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ログアウト確認 */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
          <div className="w-full max-w-sm rounded-t-2xl bg-white p-6 shadow-xl sm:mx-6 sm:rounded-2xl">
            <h3 className="mb-2 text-center text-[17px] font-bold text-gray-900">ログアウト</h3>
            <p className="mb-6 text-center text-[13px] text-gray-500">
              ログアウトしますか？
            </p>
            <div className="space-y-2">
              <button type="button" onClick={handleLogout}
                className="w-full rounded-xl bg-red-500 py-3 text-[16px] font-semibold text-white active:bg-red-600">
                ログアウト
              </button>
              <button type="button" onClick={() => setShowLogoutConfirm(false)}
                className="w-full rounded-xl py-3 text-[16px] font-semibold text-blue-500 active:bg-gray-50">
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="pointer-events-none fixed bottom-24 left-1/2 z-50 -translate-x-1/2">
          <div className="rounded-full bg-gray-900/90 px-5 py-2.5 text-[14px] font-medium text-white shadow-lg backdrop-blur-sm">
            {toast}
          </div>
        </div>
      )}
    </div>
  )
}
