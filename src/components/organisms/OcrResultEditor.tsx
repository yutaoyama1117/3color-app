'use client'

import { useState } from 'react'

interface OcrResultEditorProps {
  initialText: string
  defaultPageNumber?: number
  onConfirm: (text: string, pageNumber: number | undefined, append: boolean) => void
  onCancel: () => void
}

export function OcrResultEditor({
  initialText,
  defaultPageNumber,
  onConfirm,
  onCancel,
}: OcrResultEditorProps) {
  const [text, setText] = useState(initialText)
  const [pageNumber, setPageNumber] = useState<string>(
    defaultPageNumber ? String(defaultPageNumber) : '',
  )
  const [appendMode, setAppendMode] = useState<'append' | 'replace'>('append')

  const handleConfirm = () => {
    if (!text.trim()) return
    const page = pageNumber ? parseInt(pageNumber, 10) : undefined
    onConfirm(text.trim(), page, appendMode === 'append')
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
        <p className="text-xs text-blue-700">
          ✨ OCR認識結果です。誤りがあれば修正してから「確定」してください。
        </p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          認識テキスト
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm leading-relaxed focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <p className="text-right text-xs text-gray-400">
          {text.length.toLocaleString()} 文字
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            ページ番号
            <span className="ml-1 text-xs text-gray-400">（任意）</span>
          </label>
          <input
            type="number"
            value={pageNumber}
            onChange={(e) => setPageNumber(e.target.value)}
            min={1}
            placeholder="例：12"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            保存方法
          </label>
          <select
            value={appendMode}
            onChange={(e) => setAppendMode(e.target.value as 'append' | 'replace')}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="append">既存テキストに追記</option>
            <option value="replace">既存テキストを上書き</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          キャンセル
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!text.trim()}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          確定して保存
        </button>
      </div>
    </div>
  )
}
