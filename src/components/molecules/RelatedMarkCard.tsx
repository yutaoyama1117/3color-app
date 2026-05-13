'use client'

import type { MarkColor } from '@/types/mark'

export interface RelatedMarkSuggestion {
  markId: string
  markedText: string
  comment?: string
  color: MarkColor
  contentTitle: string
  contentType: string
  similarity: number
  isLinked: boolean
  createdAt: string
}

interface RelatedMarkCardProps {
  suggestion: RelatedMarkSuggestion
  onLink?: (markId: string) => void
  onClick?: (markId: string) => void
}

const TYPE_ICON: Record<string, string> = {
  book: '📚',
  pdf: '📄',
  web: '🌐',
  youtube: '🎬',
  audio: '🎙️',
}

const COLOR_EMOJI: Record<MarkColor, string> = {
  red: '🔴',
  blue: '🔵',
  green: '🟢',
}

export function RelatedMarkCard({ suggestion, onLink, onClick }: RelatedMarkCardProps) {
  const icon = TYPE_ICON[suggestion.contentType] ?? '📄'
  const colorEmoji = COLOR_EMOJI[suggestion.color]
  const similarityPercent = Math.round(suggestion.similarity * 100)

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 hover:border-blue-300">
      <button
        type="button"
        onClick={() => onClick?.(suggestion.markId)}
        className="block w-full text-left"
      >
        <p className="mb-1 text-xs text-gray-500">
          {icon} {suggestion.contentTitle} {colorEmoji}
        </p>
        <p className="mb-2 line-clamp-2 text-sm text-gray-700">
          “{suggestion.markedText}”
        </p>
        {suggestion.comment && (
          <p className="mb-2 line-clamp-1 text-xs text-gray-500">
            💬 {suggestion.comment}
          </p>
        )}
      </button>

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">類似度: {similarityPercent}%</span>
        {suggestion.isLinked ? (
          <span className="rounded-md bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
            ✅ リンク済み
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onLink?.(suggestion.markId)}
            className="rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
          >
            リンクする
          </button>
        )}
      </div>
    </div>
  )
}
