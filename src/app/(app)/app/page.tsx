'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useContentStore } from '@/stores/contentStore'
import { ContentCard } from '@/components/molecules/ContentCard'
import { SearchFilterBar } from '@/components/molecules/SearchFilterBar'
import type { MarkColor } from '@/types/mark'

export default function AppTopPage() {
  const { contents } = useContentStore()
  const [keyword, setKeyword] = useState('')
  const [activeColors, setActiveColors] = useState<MarkColor[]>([])
  const [addedId, setAddedId] = useState<string | null>(null)
  const searchParams = useSearchParams()

  // 登録完了通知（?added=xxxで遷移してきた場合）
  useEffect(() => {
    const id = searchParams.get('added')
    if (id) {
      setAddedId(id)
      // URLからパラメータを消す（履歴を汚さない）
      window.history.replaceState({}, '', '/app')
      // 5秒後に通知を消す
      const t = setTimeout(() => setAddedId(null), 5000)
      return () => clearTimeout(t)
    }
  }, [searchParams])

  const handleColorToggle = (color: MarkColor) => {
    setActiveColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color],
    )
  }

  const addedContent = contents.find((c) => c.id === addedId)

  const filtered = contents.filter((content) => {
    if (keyword.trim()) {
      const kw = keyword.trim().toLowerCase()
      const inTitle = content.title.toLowerCase().includes(kw)
      const inAuthor = content.author?.toLowerCase().includes(kw) ?? false
      if (!inTitle && !inAuthor) return false
    }
    if (activeColors.length > 0) {
      const allMatch = activeColors.every(
        (color) => (content.markCounts?.[color] ?? 0) > 0,
      )
      if (!allMatch) return false
    }
    return true
  })

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      {/* 登録完了バナー */}
      {addedContent && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-green-800">
              ✅ 「{addedContent.title}」を登録しました
            </p>
            <p className="text-xs text-green-600 mt-0.5">タップして色マークをつけましょう</p>
          </div>
          <a
            href={`/app/contents/${addedContent.id}`}
            className="ml-4 shrink-0 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
          >
            マーキングする →
          </a>
        </div>
      )}

      {/* ヘッダー行 */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">マイ本棚</h1>
        <a
          href="/app/register"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          ＋ コンテンツを追加
        </a>
      </div>

      {/* 検索・フィルター（コンテンツが1件以上あるときのみ表示） */}
      {contents.length > 0 && (
        <SearchFilterBar
          keyword={keyword}
          onKeywordChange={setKeyword}
          activeColors={activeColors}
          onColorToggle={handleColorToggle}
        />
      )}

      {/* コンテンツ一覧 */}
      {filtered.length > 0 ? (
        <>
          {(keyword || activeColors.length > 0) && (
            <p className="mb-3 text-sm text-gray-400">
              {filtered.length} 件ヒット
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            {filtered.map((content) => (
              <ContentCard
                key={content.id}
                content={content}
                href={`/app/contents/${content.id}`}
              />
            ))}
          </div>
        </>
      ) : contents.length === 0 ? (
        /* 空状態 */
        <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-gray-200 py-20 text-center">
          <div className="mb-4 text-5xl">📚</div>
          <p className="mb-2 text-lg font-medium text-gray-700">
            まだコンテンツがありません
          </p>
          <p className="mb-6 text-sm text-gray-400">
            本・記事・動画を登録してマーキングを始めましょう
          </p>
          <a
            href="/app/register"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            コンテンツを登録する
          </a>
        </div>
      ) : (
        /* 検索結果ゼロ */
        <div className="flex flex-col items-center py-16 text-center">
          <p className="mb-1 text-base font-medium text-gray-600">
            該当するコンテンツがありません
          </p>
          <p className="text-sm text-gray-400">
            検索条件を変えてみてください
          </p>
        </div>
      )}
    </div>
  )
}
