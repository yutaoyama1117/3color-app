'use client'

import type { MarkColor } from '@/types/mark'

type FilterTab = 'all' | MarkColor

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'すべて' },
  { key: 'red', label: '重要' },
  { key: 'blue', label: '客観' },
  { key: 'green', label: '気づき' },
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
  // 「すべて」= 色フィルターなし
  const activeTab: FilterTab = activeColors.length === 0 ? 'all' : activeColors[0]

  const handleTabChange = (tab: FilterTab) => {
    if (tab === 'all') {
      // すべてのフィルタをクリア
      activeColors.forEach((c) => onColorToggle(c))
    } else {
      // 排他的選択: まず全部外してから1つだけ選択
      activeColors.forEach((c) => onColorToggle(c))
      onColorToggle(tab)
    }
  }

  return (
    <div className="mb-4 space-y-3">
      {/* iOS風 検索バー */}
      <div className="relative">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="search"
          value={keyword}
          onChange={(e) => onKeywordChange(e.target.value)}
          placeholder="検索"
          className="w-full rounded-xl border-0 bg-gray-200/70 py-2 pl-9 pr-4 text-[15px] font-normal text-gray-900 placeholder-gray-500 outline-none transition-colors focus:bg-gray-200 focus:ring-0"
        />
        {keyword && (
          <button
            type="button"
            onClick={() => onKeywordChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-gray-400 p-0.5"
          >
            <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Segmented Control 風フィルター */}
      <div className="flex rounded-lg bg-gray-200/70 p-[3px]">
        {FILTER_TABS.map(({ key, label }) => {
          const isActive = key === activeTab
          // タブごとの色
          const dotColor =
            key === 'red' ? 'bg-red-500' :
            key === 'blue' ? 'bg-blue-500' :
            key === 'green' ? 'bg-green-500' : ''

          return (
            <button
              key={key}
              type="button"
              onClick={() => handleTabChange(key)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-[6px] text-[13px] font-semibold transition-all ${
                isActive
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500'
              }`}
            >
              {key !== 'all' && (
                <span className={`h-[8px] w-[8px] rounded-full ${dotColor}`} />
              )}
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
