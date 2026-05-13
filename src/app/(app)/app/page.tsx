'use client'

import { Suspense, useState, useEffect, useMemo, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useContentStore } from '@/stores/contentStore'
import { useMarkStore } from '@/stores/markStore'
import { ContentCard } from '@/components/molecules/ContentCard'
import { SearchFilterBar } from '@/components/molecules/SearchFilterBar'
import type { MarkColor } from '@/types/mark'

type SortMode = 'newest' | 'oldest' | 'most_marks' | 'favorites'

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
    const t = setTimeout(() => setAddedContent(null), 5000)
    return () => clearTimeout(t)
  }, [searchParams, contents])

  if (!addedContent) return null

  return (
    <div className="mx-4 mb-3 flex items-center justify-between rounded-2xl bg-green-50 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-green-800">登録完了</p>
        <p className="truncate text-[12px] text-green-600">{addedContent.title}</p>
      </div>
      <Link
        href={`/app/contents/${addedContent.id}`}
        className="ml-3 shrink-0 rounded-lg bg-green-600 px-3 py-1.5 text-[13px] font-semibold text-white active:bg-green-700"
      >
        開く
      </Link>
    </div>
  )
}

function AppContent() {
  const { contents, removeContents } = useContentStore()
  const { marks, removeMarksByContentIds } = useMarkStore()
  const [keyword, setKeyword] = useState('')
  const [activeColors, setActiveColors] = useState<MarkColor[]>([])
  const [sortMode, setSortMode] = useState<SortMode>('newest')
  const [authorFilter, setAuthorFilter] = useState<string | null>(null)
  const [publisherFilter, setPublisherFilter] = useState<string | null>(null)
  const [showBookFilter, setShowBookFilter] = useState(false)

  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const [toast, setToast] = useState<string | null>(null)
  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }, [])

  // 著者・出版社の選択肢（重複除去）
  const authorOptions = useMemo(() => {
    const set = new Set<string>()
    contents.forEach((c) => { if (c.author) set.add(c.author) })
    return Array.from(set).sort()
  }, [contents])

  const publisherOptions = useMemo(() => {
    const set = new Set<string>()
    contents.forEach((c) => { if (c.bookMeta?.publisher) set.add(c.bookMeta.publisher) })
    return Array.from(set).sort()
  }, [contents])

  // 書籍タイプのコンテンツがあればフィルターボタンを表示
  const hasBookFilter = contents.some((c) => c.type === 'book') || authorOptions.length > 0 || publisherOptions.length > 0

  const handleColorToggle = (color: MarkColor) => {
    setActiveColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color],
    )
  }

  const clearAllFilters = () => {
    setKeyword('')
    setActiveColors([])
    setAuthorFilter(null)
    setPublisherFilter(null)
  }

  const activeFilterCount = (keyword ? 1 : 0) + activeColors.length + (authorFilter ? 1 : 0) + (publisherFilter ? 1 : 0)

  const enterSelectMode = () => { setSelectMode(true); setSelectedIds(new Set()) }
  const exitSelectMode = () => { setSelectMode(false); setSelectedIds(new Set()) }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const selectAll = () => setSelectedIds(new Set(filtered.map((c) => c.id)))

  const confirmDelete = () => {
    const count = selectedIds.size
    const ids = Array.from(selectedIds)
    removeMarksByContentIds(ids)
    removeContents(ids)
    setShowDeleteConfirm(false)
    exitSelectMode()
    showToast(`${count}件を削除しました`)
  }

  const filtered = useMemo(() => {
    const result = contents.filter((content) => {
      // キーワード検索（タイトル・著者・出版社）
      if (keyword.trim()) {
        const kw = keyword.trim().toLowerCase()
        const matchTitle = content.title.toLowerCase().includes(kw)
        const matchAuthor = content.author?.toLowerCase().includes(kw) ?? false
        const matchPublisher = content.bookMeta?.publisher?.toLowerCase().includes(kw) ?? false
        const matchIsbn = content.bookMeta?.isbn?.includes(kw) ?? false
        if (!matchTitle && !matchAuthor && !matchPublisher && !matchIsbn) return false
      }
      // マーク色フィルター
      if (activeColors.length > 0) {
        const cm = marks.filter((m) => m.contentId === content.id)
        if (!activeColors.every((color) => cm.some((m) => m.color === color))) return false
      }
      // 著者フィルター
      if (authorFilter && content.author !== authorFilter) return false
      // 出版社フィルター
      if (publisherFilter && content.bookMeta?.publisher !== publisherFilter) return false
      return true
    })

    switch (sortMode) {
      case 'newest': result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break
      case 'oldest': result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()); break
      case 'most_marks': result.sort((a, b) => marks.filter((m) => m.contentId === b.id).length - marks.filter((m) => m.contentId === a.id).length); break
      case 'favorites': result.sort((a, b) => {
        if (a.isFavorite && !b.isFavorite) return -1
        if (!a.isFavorite && b.isFavorite) return 1
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }); break
    }
    return result
  }, [contents, keyword, activeColors, sortMode, marks, authorFilter, publisherFilter])

  const totalContents = contents.length

  return (
    <div className="pb-4">
      <Suspense><AddedBanner /></Suspense>

      {/* 選択モードツールバー */}
      {selectMode && (
        <div className="mx-4 mb-3 flex items-center justify-between rounded-xl bg-blue-50 px-4 py-2.5">
          <div className="flex items-center gap-3">
            <span className="text-[14px] font-semibold text-blue-800">
              {selectedIds.size}件選択
            </span>
            <button type="button" onClick={selectAll} className="text-[13px] font-medium text-blue-500 active:opacity-60">
              すべて
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { if (selectedIds.size > 0) setShowDeleteConfirm(true) }}
              disabled={selectedIds.size === 0}
              className="rounded-lg bg-red-500 px-3 py-1.5 text-[13px] font-semibold text-white active:bg-red-600 disabled:opacity-40"
            >
              削除
            </button>
            <button
              type="button"
              onClick={exitSelectMode}
              className="text-[14px] font-medium text-blue-500 active:opacity-60"
            >
              完了
            </button>
          </div>
        </div>
      )}

      {/* 検索・フィルター */}
      {totalContents > 0 && !selectMode && (
        <div className="px-4">
          <SearchFilterBar
            keyword={keyword}
            onKeywordChange={setKeyword}
            activeColors={activeColors}
            onColorToggle={handleColorToggle}
          />

          {/* 書籍絞り込み（著者・出版社） */}
          {hasBookFilter && (
            <div className="mb-2">
              <button
                type="button"
                onClick={() => setShowBookFilter((v) => !v)}
                className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-gray-600 active:bg-gray-50"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
                </svg>
                書籍で絞り込む
                {(authorFilter || publisherFilter) && (
                  <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[10px] text-white">
                    {(authorFilter ? 1 : 0) + (publisherFilter ? 1 : 0)}
                  </span>
                )}
              </button>

              {showBookFilter && (
                <div className="mt-2 space-y-3 rounded-xl border border-gray-100 bg-white p-3">
                  {/* 著者フィルター（常に表示） */}
                  <div>
                    <p className="mb-1.5 text-[11px] font-bold text-gray-400">著者</p>
                    {authorOptions.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {authorOptions.map((author) => (
                          <button
                            key={author}
                            type="button"
                            onClick={() => setAuthorFilter(authorFilter === author ? null : author)}
                            className={`rounded-full px-3 py-1 text-[12px] font-semibold transition-colors ${
                              authorFilter === author
                                ? 'bg-blue-500 text-white'
                                : 'border border-gray-200 bg-white text-gray-700 active:bg-gray-50'
                            }`}
                          >
                            {author}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-gray-300">著者が登録されると絞り込めます</p>
                    )}
                  </div>

                  {/* 出版社フィルター（常に表示） */}
                  <div>
                    <p className="mb-1.5 text-[11px] font-bold text-gray-400">出版社</p>
                    {publisherOptions.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {publisherOptions.map((publisher) => (
                          <button
                            key={publisher}
                            type="button"
                            onClick={() => setPublisherFilter(publisherFilter === publisher ? null : publisher)}
                            className={`rounded-full px-3 py-1 text-[12px] font-semibold transition-colors ${
                              publisherFilter === publisher
                                ? 'bg-purple-500 text-white'
                                : 'border border-gray-200 bg-white text-gray-700 active:bg-gray-50'
                            }`}
                          >
                            {publisher}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-gray-300">書籍情報をスキャンすると出版社で絞り込めます</p>
                    )}
                  </div>

                  {(authorFilter || publisherFilter) && (
                    <button
                      type="button"
                      onClick={() => { setAuthorFilter(null); setPublisherFilter(null) }}
                      className="text-[12px] font-medium text-red-500 active:opacity-70"
                    >
                      絞り込みを解除
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* アクティブフィルター表示 */}
          {activeFilterCount > 0 && (
            <div className="mb-2 flex items-center gap-2">
              <div className="flex flex-1 flex-wrap gap-1.5">
                {authorFilter && (
                  <span className="flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                    ✍️ {authorFilter}
                    <button type="button" onClick={() => setAuthorFilter(null)} className="ml-0.5">✕</button>
                  </span>
                )}
                {publisherFilter && (
                  <span className="flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-1 text-[11px] font-semibold text-purple-700">
                    🏢 {publisherFilter}
                    <button type="button" onClick={() => setPublisherFilter(null)} className="ml-0.5">✕</button>
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={clearAllFilters}
                className="shrink-0 text-[11px] font-medium text-gray-400 active:text-gray-600"
              >
                すべて解除
              </button>
            </div>
          )}

          {/* ソート + 編集ボタン */}
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-1 overflow-x-auto">
              {([
                { key: 'newest', label: '新着' },
                { key: 'most_marks', label: 'マーク' },
                { key: 'favorites', label: 'お気に入り' },
              ] as { key: SortMode; label: string }[]).map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSortMode(key)}
                  className={`shrink-0 rounded-full px-2.5 py-[5px] text-[12px] font-semibold transition-colors ${
                    sortMode === key
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-500 active:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={enterSelectMode}
              className="text-[14px] font-medium text-blue-500 active:opacity-60"
            >
              編集
            </button>
          </div>
        </div>
      )}

      {/* コンテンツ一覧 */}
      {filtered.length > 0 ? (
        <>
          {activeFilterCount > 0 && (
            <p className="mb-2 px-4 text-[13px] font-medium text-gray-400">{filtered.length}件</p>
          )}
          <div className="mx-4 overflow-hidden rounded-xl bg-white">
            {filtered.map((content, i) => (
              <div key={content.id}>
                {i > 0 && <div className="ml-[54px] border-t border-gray-100" />}
                <ContentCard
                  content={content}
                  href={`/app/contents/${content.id}`}
                  selectable={selectMode}
                  selected={selectedIds.has(content.id)}
                  onToggleSelect={() => toggleSelect(content.id)}
                />
              </div>
            ))}
          </div>
        </>
      ) : totalContents === 0 ? (
        <div className="flex flex-col items-center px-8 pt-24 text-center">
          <div className="mb-5 text-6xl">📚</div>
          <p className="mb-1 text-[18px] font-bold text-gray-800">まだ何もありません</p>
          <p className="mb-8 text-[14px] font-normal text-gray-400">
            本や記事のテキストを登録して{'\n'}3色マーキングを始めましょう
          </p>
          <Link
            href="/app/register"
            className="rounded-xl bg-blue-500 px-8 py-3 text-[15px] font-semibold text-white shadow-sm active:bg-blue-600"
          >
            最初のコンテンツを追加
          </Link>
        </div>
      ) : (
        <div className="flex flex-col items-center px-8 pt-20 text-center">
          <p className="text-[15px] font-medium text-gray-500">該当なし</p>
          <p className="mt-1 text-[13px] font-normal text-gray-400">検索条件を変えてみてください</p>
          <button
            type="button"
            onClick={clearAllFilters}
            className="mt-3 rounded-xl border border-gray-200 px-5 py-2 text-[13px] font-semibold text-gray-600 active:bg-gray-50"
          >
            フィルターをリセット
          </button>
        </div>
      )}

      {/* 削除確認ダイアログ */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
          <div className="w-full max-w-sm rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl sm:mx-6">
            <h3 className="mb-2 text-center text-[17px] font-bold text-gray-900">
              {selectedIds.size}件を削除
            </h3>
            <p className="mb-6 text-center text-[13px] text-gray-500">
              関連するマークも削除されます。この操作は取り消せません。
            </p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={confirmDelete}
                className="w-full rounded-xl bg-red-500 py-3 text-[16px] font-semibold text-white active:bg-red-600"
              >
                削除する
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="w-full rounded-xl py-3 text-[16px] font-semibold text-blue-500 active:bg-gray-50"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* トースト */}
      {toast && (
        <div className="pointer-events-none fixed bottom-24 left-1/2 z-50 -translate-x-1/2">
          <div className="rounded-full bg-gray-900/90 px-5 py-2.5 text-[14px] font-medium text-white shadow-lg backdrop-blur-sm">
            {toast}
          </div>
        </div>
      )}
    </div>
  )
}

export default function AppTopPage() {
  return (
    <Suspense fallback={<div className="flex h-32 items-center justify-center text-[14px] text-gray-400">読み込み中...</div>}>
      <AppContent />
    </Suspense>
  )
}
