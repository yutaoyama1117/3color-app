'use client'

import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'
type Lang = 'ja' | 'en'
type FontSize = 'sm' | 'base' | 'lg'

const STORAGE_KEY = 'appearance-settings'

interface AppearanceSettingsState {
  theme: Theme
  lang: Lang
  fontSize: FontSize
}

export function AppearanceSettings() {
  const [settings, setSettings] = useState<AppearanceSettingsState>({
    theme: 'system',
    lang: 'ja',
    fontSize: 'base',
  })

  // 初回ロード
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setSettings(JSON.parse(stored))
      } catch {
        // 無視
      }
    }
  }, [])

  // 設定変更時に保存 + フォントサイズだけ即時反映
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    document.documentElement.style.fontSize =
      settings.fontSize === 'sm' ? '14px' : settings.fontSize === 'lg' ? '18px' : '16px'
  }, [settings])

  const update = <K extends keyof AppearanceSettingsState>(
    key: K,
    value: AppearanceSettingsState[K],
  ) => setSettings((s) => ({ ...s, [key]: value }))

  return (
    <div className="space-y-6">
      {/* テーマ */}
      <div>
        <label className="block text-sm font-medium text-gray-700">テーマ</label>
        <div className="mt-2 flex gap-2">
          {(['light', 'dark', 'system'] as Theme[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => update('theme', t)}
              className={`rounded-lg border px-4 py-2 text-sm ${
                settings.theme === t
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {t === 'light' ? '☀️ ライト' : t === 'dark' ? '🌙 ダーク' : '⚙️ システム'}
            </button>
          ))}
        </div>
      </div>

      {/* 言語 */}
      <div>
        <label className="block text-sm font-medium text-gray-700">言語</label>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => update('lang', 'ja')}
            className={`rounded-lg border px-4 py-2 text-sm ${
              settings.lang === 'ja'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            日本語
          </button>
          <button
            type="button"
            onClick={() => update('lang', 'en')}
            className={`rounded-lg border px-4 py-2 text-sm ${
              settings.lang === 'en'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            English
          </button>
        </div>
      </div>

      {/* フォントサイズ */}
      <div>
        <label className="block text-sm font-medium text-gray-700">フォントサイズ</label>
        <div className="mt-2 flex gap-2">
          {(['sm', 'base', 'lg'] as FontSize[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => update('fontSize', f)}
              className={`rounded-lg border px-4 py-2 ${
                settings.fontSize === f
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              } ${f === 'sm' ? 'text-xs' : f === 'lg' ? 'text-base' : 'text-sm'}`}
            >
              {f === 'sm' ? '小' : f === 'lg' ? '大' : '中'}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
