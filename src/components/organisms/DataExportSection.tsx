'use client'

import { useState } from 'react'
import { useContentStore } from '@/stores/contentStore'
import { useMarkStore } from '@/stores/markStore'
import { buildFullExport, downloadJson } from '@/lib/export/fullExport'

export function DataExportSection() {
  const { contents } = useContentStore()
  const { marks } = useMarkStore()
  const [exporting, setExporting] = useState(false)

  const handleExport = () => {
    setExporting(true)
    try {
      const payload = buildFullExport(contents, marks)
      const date = new Date().toISOString().slice(0, 10)
      downloadJson(`3color-export-${date}.json`, payload)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-900">
        <p className="font-semibold">📦 全データJSONエクスポート</p>
        <p className="mt-1 text-xs">
          コンテンツ・マーク・タグなど全てのデータをJSON形式でダウンロードします。
          Obsidian や他のツールへの移行、バックアップ用途にご利用ください。
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-gray-900">エクスポート対象</div>
            <div className="mt-1 text-xs text-gray-500">
              コンテンツ {contents.length} 件 / マーク {marks.length} 件
            </div>
          </div>
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting || contents.length === 0}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {exporting ? '生成中…' : 'ダウンロード'}
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-500">
        ⚠️ 機密情報を含む可能性があります。安全な場所に保管してください。
      </p>
    </div>
  )
}
