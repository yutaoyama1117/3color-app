'use client'

import Link from 'next/link'
import { useMarkStore } from '@/stores/markStore'
import { useContentStore } from '@/stores/contentStore'
import type { ContentData, ContentType } from '@/types/content'

const TYPE_ICON: Record<ContentType, string> = {
  book: '📖',
  pdf: '📄',
  web: '🌐',
  youtube: '▶️',
  audio: '🎙️',
}

interface ContentCardProps {
  content: ContentData
  href: string
  selectable?: boolean
  selected?: boolean
  onToggleSelect?: () => void
}

export function ContentCard({
  content,
  href,
  selectable = false,
  selected = false,
  onToggleSelect,
}: ContentCardProps) {
  const { toggleFavorite } = useContentStore()
  const { marks } = useMarkStore()
  const contentMarks = marks.filter((m) => m.contentId === content.id)
  const redCount = contentMarks.filter((m) => m.color === 'red').length
  const blueCount = contentMarks.filter((m) => m.color === 'blue').length
  const greenCount = contentMarks.filter((m) => m.color === 'green').length
  const totalMarks = redCount + blueCount + greenCount

  const createdDate = new Date(content.createdAt)
  const isProcessing = content.status === 'processing'
  const isError = content.status === 'error'

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggleFavorite(content.id)
  }

  const cardContent = (
    <div className="flex items-start gap-3">
      {/* 左: チェックボックス（選択モード時） */}
      {selectable && (
        <div className="flex items-center pt-0.5">
          <span className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
            selected
              ? 'border-blue-500 bg-blue-500'
              : 'border-gray-300'
          }`}>
            {selected && (
              <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </span>
        </div>
      )}

      {/* アイコン */}
      <span className="mt-0.5 text-[22px] leading-none" aria-hidden="true">
        {TYPE_ICON[content.type]}
      </span>

      {/* コンテンツ情報 */}
      <div className="min-w-0 flex-1">
        {/* タイトル: 最も視覚的に支配的 */}
        <h3 className="line-clamp-2 text-[16px] font-bold leading-[1.3] tracking-tight text-gray-900">
          {content.title}
        </h3>

        {/* 著者・出版社 */}
        {(content.author || content.bookMeta?.publisher) && (
          <p className="mt-0.5 truncate text-[13px] font-normal text-gray-500">
            {[content.author, content.bookMeta?.publisher].filter(Boolean).join(' · ')}
          </p>
        )}

        {/* ステータス or マーク数 */}
        <div className="mt-1.5 flex items-center gap-2">
          {isProcessing ? (
            <div className="flex items-center gap-1">
              <span className="inline-block h-[6px] w-[6px] animate-pulse rounded-full bg-blue-500" />
              <span className="text-[12px] font-medium text-blue-600">取得中</span>
            </div>
          ) : isError ? (
            <div className="flex items-center gap-1">
              <span className="inline-block h-[6px] w-[6px] rounded-full bg-red-500" />
              <span className="text-[12px] font-medium text-red-600">エラー</span>
            </div>
          ) : totalMarks > 0 ? (
            <div className="flex items-center gap-1">
              {/* 3色ドットバー: コンパクトな視覚表現 */}
              {redCount > 0 && (
                <span className="flex items-center gap-[3px] text-[12px] font-semibold text-red-600">
                  <span className="h-[7px] w-[7px] rounded-full bg-red-500" />
                  {redCount}
                </span>
              )}
              {blueCount > 0 && (
                <span className="flex items-center gap-[3px] text-[12px] font-semibold text-blue-600">
                  <span className="h-[7px] w-[7px] rounded-full bg-blue-500" />
                  {blueCount}
                </span>
              )}
              {greenCount > 0 && (
                <span className="flex items-center gap-[3px] text-[12px] font-semibold text-green-600">
                  <span className="h-[7px] w-[7px] rounded-full bg-green-500" />
                  {greenCount}
                </span>
              )}
            </div>
          ) : (
            <span className="rounded-full bg-gray-100 px-2 py-[2px] text-[11px] font-medium text-gray-400">
              未マーク
            </span>
          )}
        </div>
      </div>

      {/* 右端: お気に入り + 日付 + Chevron */}
      <div className="flex shrink-0 flex-col items-end gap-1 pt-0.5">
        <button
          type="button"
          onClick={handleFavorite}
          className="p-0.5 active:scale-125"
          aria-label={content.isFavorite ? 'お気に入り解除' : 'お気に入りに追加'}
        >
          {content.isFavorite ? (
            <svg className="h-[18px] w-[18px] text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          ) : (
            <svg className="h-[18px] w-[18px] text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          )}
        </button>
        <span className="text-[11px] font-normal text-gray-400">
          {createdDate.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
        </span>
        {!selectable && (
          <svg className="h-4 w-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        )}
      </div>
    </div>
  )

  if (selectable) {
    return (
      <div
        onClick={onToggleSelect}
        className={`cursor-pointer bg-white px-4 py-3 transition-colors active:bg-gray-50 ${
          selected ? 'bg-blue-50/60' : ''
        }`}
      >
        {cardContent}
      </div>
    )
  }

  return (
    <Link
      href={href}
      className="block bg-white px-4 py-3 transition-colors active:bg-gray-50"
    >
      {cardContent}
    </Link>
  )
}
