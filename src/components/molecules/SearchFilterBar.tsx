'use client'

import type { MarkColor } from '@/types/mark'

const COLOR_BUTTONS: { color: MarkColor; icon: string; label: string }[] = [
  { color: 'red', icon: '🔴', label: '客観的最重要' },
  { color: 'blue', icon: '🔵', label: '客観的重要' },
  { color: 'green', icon: '🟢', label: '個人的気づき' },
]

interface SearchFilterBarProps {
  keyword: string
  onKeywordChange: (value: string) => void
  activeColors: MarkColor[]
  onColorToggle: (color: MarkColor) => void
}

export function SearchFilterBar({
  keyword,
  onKeywordChange,
  activeColors,
  onColorToggle,
}: SearchFilterBarProps) {
  return (
    <div className="mb-6 space-y-3">
      {/* キーワード検索 */}
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
          🔍
        </span>
        <input
          type="search"
          value={keyword}
          onChange={(e) => onKeywordChange(e.target.value)}
          placeholder="タイトル・著者で検索"
          className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* 色フィルター */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">絞り込み:</span>
        {COLOR_BUTTONS.map(({ color, icon, label }) => {
          const isActive = activeColors.includes(color)
          return (
            <button
              key={color}
              onClick={() => onColorToggle(color)}
              aria-pressed={isActive}
              title={label}
              className={`flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                isActive
                  ? color === 'red'
                    ? 'border-red-400 bg-red-50 text-red-700'
                    : color === 'blue'
                      ? 'border-blue-400 bg-blue-50 text-blue-700'
                      : 'border-green-400 bg-green-50 text-green-700'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              {icon} {label}
            </button>
          )
        })}
        {(activeColors.length > 0 || keyword) && (
          <button
            onClick={() => {
              onKeywordChange('')
              activeColors.forEach((c) => onColorToggle(c))
            }}
            className="ml-auto text-xs text-gray-400 hover:text-gray-600"
          >
            クリア
          </button>
        )}
      </div>
    </div>
  )
}
