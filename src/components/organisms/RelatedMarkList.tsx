'use client'

import { useState, useCallback } from 'react'
import { useMarkStore } from '@/stores/markStore'
import { useContentStore } from '@/stores/contentStore'
import { useRelatedLinkStore } from '@/stores/relatedLinkStore'
import { RelatedMarkCard, type RelatedMarkSuggestion } from '@/components/molecules/RelatedMarkCard'
import type { MarkData } from '@/types/mark'

interface RelatedMarkListProps {
  mark: MarkData
}

export function RelatedMarkList({ mark }: RelatedMarkListProps) {
  const { marks } = useMarkStore()
  const { contents } = useContentStore()
  const { addLink, getLinksFrom } = useRelatedLinkStore()

  const [suggestions, setSuggestions] = useState<RelatedMarkSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    setHasSearched(true)

    try {
      // 候補マーク（自分以外、別コンテンツ優先）
      const candidates = marks
        .filter((m) => m.id !== mark.id)
        .map((m) => {
          const content = contents.find((c) => c.id === m.contentId)
          return {
            id: m.id,
            text: m.markedText,
            comment: m.comment,
            color: m.color,
            contentTitle: content?.title ?? '不明',
            contentType: content?.type ?? 'book',
            createdAt: new Date(m.createdAt).toISOString(),
          }
        })

      const linkedIds = getLinksFrom(mark.id).map((l) => l.toMarkId)

      const res = await fetch(`/api/v1/marks/${mark.id}/related`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetText: mark.markedText,
          targetComment: mark.comment,
          candidateMarks: candidates,
          linkedMarkIds: linkedIds,
        }),
      })

      const data = (await res.json()) as {
        data?: RelatedMarkSuggestion[]
        error?: string
        demo_mode?: boolean
      }

      if (data.error && !data.demo_mode) {
        setError(data.error)
        return
      }

      setSuggestions(data.data ?? [])
    } catch {
      setError('ネットワークエラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }, [mark, marks, contents, getLinksFrom])

  const handleLink = useCallback(
    (toMarkId: string) => {
      const target = suggestions.find((s) => s.markId === toMarkId)
      if (!target) return
      addLink({
        fromMarkId: mark.id,
        toMarkId,
        linkType: 'ai_suggested',
        similarity: target.similarity,
      })
      // UI更新: isLinked = true
      setSuggestions((prev) =>
        prev.map((s) => (s.markId === toMarkId ? { ...s, isLinked: true } : s)),
      )
    },
    [mark.id, suggestions, addLink],
  )

  // すでにリンク済みのマーク一覧
  const existingLinks = getLinksFrom(mark.id)
    .map((link) => {
      const m = marks.find((x) => x.id === link.toMarkId)
      const content = m ? contents.find((c) => c.id === m.contentId) : undefined
      if (!m || !content) return null
      return {
        markId: m.id,
        markedText: m.markedText,
        comment: m.comment,
        color: m.color,
        contentTitle: content.title,
        contentType: content.type,
        similarity: link.similarity ?? 1,
        isLinked: true,
        createdAt: new Date(m.createdAt).toISOString(),
      } as RelatedMarkSuggestion
    })
    .filter((x): x is RelatedMarkSuggestion => x !== null)

  return (
    <div className="space-y-3">
      {/* 検索ボタン */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">🔗 関連するメモ</h3>
        <button
          type="button"
          onClick={handleSearch}
          disabled={isLoading}
          className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50"
        >
          {isLoading ? '検索中…' : hasSearched ? '🔄 再検索' : '🔍 検索する'}
        </button>
      </div>

      {/* エラー */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          ⚠️ {error}
        </div>
      )}

      {/* 検索結果 */}
      {hasSearched && !isLoading && suggestions.length === 0 && !error && (
        <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 text-center text-xs text-gray-500">
          類似度78%以上の関連マークは見つかりませんでした
          <br />
          <span className="text-[10px]">（OpenAI APIキー未設定の場合は検出されません）</span>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="space-y-2">
          {suggestions
            .filter((s) => !existingLinks.some((e) => e.markId === s.markId))
            .map((s) => (
              <RelatedMarkCard
                key={s.markId}
                suggestion={s}
                onLink={handleLink}
                onClick={(id) => {
                  const m = marks.find((x) => x.id === id)
                  if (m) window.location.href = `/app/contents/${m.contentId}`
                }}
              />
            ))}
        </div>
      )}

      {/* リンク済みセクション */}
      {existingLinks.length > 0 && (
        <div className="space-y-2 border-t border-gray-100 pt-3">
          <p className="text-xs font-medium text-gray-500">✅ リンク済み</p>
          {existingLinks.map((s) => (
            <RelatedMarkCard
              key={s.markId}
              suggestion={s}
              onClick={(id) => {
                const m = marks.find((x) => x.id === id)
                if (m) window.location.href = `/app/contents/${m.contentId}`
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
