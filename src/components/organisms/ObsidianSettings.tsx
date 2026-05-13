'use client'

import { useState } from 'react'
import { useObsidianSync } from '@/hooks/use-obsidian-sync'

export function ObsidianSettings() {
  const { vaultPath, syncLog, isElectron, selectVault, syncNow } = useObsidianSync()
  const [busy, setBusy] = useState(false)
  const [lastMessage, setLastMessage] = useState<string | null>(null)

  if (!isElectron) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <p className="font-semibold">ℹ️ Obsidian 自動同期は Mac デスクトップアプリ専用です</p>
        <p className="mt-1 text-xs">
          ファイルシステムへの直接アクセスが必要なため、ブラウザでは利用できません。
          現状はコンテンツ詳細から「📥 エクスポート」ボタンで個別ダウンロードが可能です。
        </p>
      </div>
    )
  }

  const handleSync = async () => {
    setBusy(true)
    const result = await syncNow()
    if ('written' in result) {
      setLastMessage(`✅ ${result.written} ファイルを書き出しました`)
    } else {
      setLastMessage(`⚠️ ${result.error}`)
    }
    setBusy(false)
  }

  return (
    <div className="space-y-6">
      {/* Vault パス */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Vault フォルダ</label>
        <div className="mt-1 flex items-center gap-2">
          <span className="flex-1 truncate rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
            {vaultPath ?? '（未設定）'}
          </span>
          <button
            type="button"
            onClick={selectVault}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            選択
          </button>
        </div>
      </div>

      {/* 一括同期 */}
      <div>
        <button
          type="button"
          onClick={handleSync}
          disabled={!vaultPath || busy}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {busy ? '同期中…' : '今すぐ全同期'}
        </button>
        {lastMessage && (
          <p className="mt-2 text-sm text-gray-600">{lastMessage}</p>
        )}
      </div>

      {/* 同期ログ */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700">同期ログ（直近10件）</h3>
        <ul className="mt-2 max-h-60 space-y-1 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs">
          {syncLog.length === 0 ? (
            <li className="text-gray-400">ログはありません</li>
          ) : (
            syncLog.slice(0, 10).map((entry, i) => (
              <li key={i} className="flex items-start gap-2">
                <span>{entry.success ? '✅' : '⚠️'}</span>
                <span className="flex-1">
                  <span className="text-gray-700">{entry.message}</span>
                  <span className="ml-2 text-gray-400">
                    {new Date(entry.time).toLocaleString('ja-JP')}
                  </span>
                </span>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  )
}
