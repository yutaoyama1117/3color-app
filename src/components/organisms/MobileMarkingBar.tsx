'use client'

import type { MarkColor } from '@/types/mark'

interface MobileMarkingBarProps {
  selectedText: string
  onSelectColor: (color: MarkColor) => void
  onCancel: () => void
}

/** モバイル用の固定ボトムマーキングバー（テキスト選択後に表示） */
export function MobileMarkingBar({
  selectedText,
  onSelectColor,
  onCancel,
}: MobileMarkingBarProps) {
  const handleSelect = (color: MarkColor) => {
    // Haptic Feedback
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10)
    }
    onSelectColor(color)
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white shadow-2xl sm:hidden">
      <div className="px-4 py-2">
        <p className="mb-2 truncate text-xs text-gray-500">
          選択中: 「{selectedText}」
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSelect('red')}
            className="flex-1 rounded-lg bg-red-100 py-3 text-sm font-medium text-red-700 active:scale-95 transition-transform"
          >
            🔴 最重要
          </button>
          <button
            type="button"
            onClick={() => handleSelect('blue')}
            className="flex-1 rounded-lg bg-blue-100 py-3 text-sm font-medium text-blue-700 active:scale-95 transition-transform"
          >
            🔵 重要
          </button>
          <button
            type="button"
            onClick={() => handleSelect('green')}
            className="flex-1 rounded-lg bg-green-100 py-3 text-sm font-medium text-green-700 active:scale-95 transition-transform"
          >
            🟢 気づき
          </button>
          <button
            type="button"
            onClick={onCancel}
            aria-label="キャンセル"
            className="rounded-lg border border-gray-200 px-3 py-3 text-gray-500"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}
