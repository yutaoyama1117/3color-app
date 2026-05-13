'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useContentStore } from '@/stores/contentStore'
import { ContentCard } from '@/components/molecules/ContentCard'
import { SearchFilterBar } from '@/components/molecules/SearchFilterBar'
import type { MarkColor } from '@/types/mark'

// useSearchParams を使う部分を分離（Suspense 必須）
function AddedBanner() {
  const searchParams = useSearchParams()
  const { contents } = useContentStore()
  const [addedContent, setAddedContent] = useState<{ id: string; title: string } | null>(null)

  useEffect(() => {
    const id = searchParams.get('added')
    if (!id) return
    const content = contents.find((c) => c.id === id)
    if (content) setAddedContent({ id: content.id, title: content.title })
    window.history.replaceState({}, '', '/app')
    const t = setTimeout(() => setAddedContent(null), 6000)
    return () => clearTimeout(t)
  }, [searchParams, contents])

  if (!addedContent) return null

  return (
    <div className="mb-5 flex items-center justify-between rounded-2xl border border-green-200 bg-green-50 px-4 py-3.5 shadow-sm">
      <div>
        <p className="text-sm font-semibold text-green-800">✅ 登録完了</p>
        <p className="mt-0.5 text-xs text-green-600 line-clamp-1">「{addedContent.title}」</p>
      </div>
      <Link
        href={`/app/contents/${addedContent.id}`}
        className="ml-3 shrink-0 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white active:bg-green-700"
      >
        マーキングする →
      </Link>
    </div>
  )
}

function AppContent() {
  const { contents } = useContentStore()
  const [keyword, setKeyword] = useState('')
  const [activeColors, setActiveColors] = useState<MarkColor[]>([])

  const handleColorToggle = (color: MarkColor) => {
    setActiveColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color],
    )
  }

  const filtered = contents.filter((content) => {
    if (keyword.trim()) {
      const kw = keyword.trim().toLowerCase()
      const inTitle = content.title.toLowerCase().includes(kw)
      const inAuthor = content.author?.toLowerCase().includes(kw) ?? false
      if (!inTitle && !inAuthor) return false
    }
    if (activeColors.length > 0) {
      const allMatch = activeColors.every((color) => (content.markCounts?.[color] ?? 0) > 0)
      if (!allMatch) return false
    }
    return true
  })

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      {/* 登録完了バナー */}
      <Suspense>
        <AddedBanner />
      </Suspense>

      {/* ヘッダー */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">マイ本棚</h1>
        <Link
          href="/app/register"
          className="flex items-center gap-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm active:bg-blue-700"
        >
          ＋ 追加
        </Link>
      </div>

      {/* 検索・フィルター */}
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
            <p className="mb-3 text-sm text-gray-400">{filtered.length} 件ヒット</p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
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
        <div className="flex flex-col items-center rounded-3xl border-2 border-dashed border-gray-200 py-20 text-center">
          <div className="mb-4 text-6xl">📚</div>
          <p className="mb-1 text-lg font-bold text-gray-800">まだ何もありません</p>
          <p className="mb-8 text-sm text-gray-400">本・記事・動画を登録してみましょう</p>
          <Link
            href="/app/register"
            className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow active:bg-blue-700"
          >
            ＋ 最初のコンテンツを追加
          </Link>
        </div>
      ) : (
        <div className="flex flex-col items-center py-16 text-center">
          <p className="text-base font-medium text-gray-500">該当するコンテンツがありません</p>
          <p className="mt-1 text-sm text-gray-400">検索条件を変えてみてください</p>
        </div>
      )}
    </div>
  )
}

// Suspense で囲んでクラッシュを防ぐ
export default function AppTopPage() {
  return (
    <Suspense fallback={<div className="flex h-32 items-center justify-center text-gray-400 text-sm">読み込み中…</div>}>
      <AppContent />
    </Suspense>
  )
}
