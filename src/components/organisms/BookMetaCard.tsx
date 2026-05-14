'use client'

import { useState } from 'react'
import { BarcodeScanButton } from '@/components/molecules/BarcodeScanButton'
import { useContentStore } from '@/stores/contentStore'
import type { BookMeta, ContentData } from '@/types/content'

interface BookMetaCardProps {
  content: ContentData
}

interface GoogleBooksResult {
  title?: string
  authors?: string[]
  publisher?: string
  publishedAt?: string
  description?: string
  isbn?: string
  coverUrl?: string
}

interface MetaDraft extends Partial<BookMeta> {
  author?: string
}

/**
 * 書籍情報パネル。
 * - データあり → 表紙＋書誌情報を上部に表示
 * - データなし → バーコードスキャンボタンを表示
 */
export function BookMetaCard({ content }: BookMetaCardProps) {
  const { updateBookMeta, updateAuthor } = useContentStore()
  const [isEditing, setIsEditing] = useState(false)
  const [isLookingUp, setIsLookingUp] = useState(false)
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [draft, setDraft] = useState<MetaDraft>({})
  const [descExpanded, setDescExpanded] = useState(false)

  const meta = content.bookMeta
  const hasData = !!(content.author || meta?.isbn || meta?.publisher || meta?.publishedAt)

  const lookupByIsbn = async (isbn: string) => {
    setIsLookingUp(true)
    setLookupError(null)
    try {
      const res = await fetch(`/api/book-lookup?isbn=${isbn}`)
      const data = (await res.json()) as GoogleBooksResult & { error?: string }
      if (!res.ok || data.error) {
        setLookupError(data.error ?? '書籍情報の取得に失敗しました')
        return
      }
      if (data.authors?.length) updateAuthor(content.id, data.authors.join(', '))
      updateBookMeta(content.id, {
        isbn: data.isbn ?? isbn,
        publisher: data.publisher ?? '',
        publishedAt: data.publishedAt ?? '',
        description: data.description ?? '',
        coverUrl: data.coverUrl ?? '',
      })
    } catch {
      setLookupError('ネットワークエラーが発生しました')
    } finally {
      setIsLookingUp(false)
    }
  }

  const startEditing = () => {
    setDraft({
      author: content.author ?? '',
      isbn: meta?.isbn ?? '',
      publisher: meta?.publisher ?? '',
      publishedAt: meta?.publishedAt ?? '',
      description: meta?.description ?? '',
    })
    setLookupError(null)
    setIsEditing(true)
  }

  const saveEditing = () => {
    if (draft.author !== undefined) updateAuthor(content.id, draft.author)
    updateBookMeta(content.id, {
      isbn: draft.isbn ?? '',
      publisher: draft.publisher ?? '',
      publishedAt: draft.publishedAt ?? '',
      description: draft.description ?? '',
      coverUrl: meta?.coverUrl ?? '',
    })
    setIsEditing(false)
    setDraft({})
  }

  const setField = <K extends keyof MetaDraft>(key: K, value: MetaDraft[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }))

  // ─── 編集モード ───
  if (isEditing) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-4 py-3">
          <p className="text-[14px] font-bold text-gray-800">書籍情報を編集</p>
        </div>
        <div className="space-y-3 px-4 py-4">
          {/* ISBNスキャンで再取得 */}
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
            <p className="mb-2 text-[12px] font-bold text-blue-700">📷 バーコードスキャンで更新</p>
            {lookupError && <p className="mb-2 text-[11px] text-orange-600">{lookupError}</p>}
            {isLookingUp
              ? <p className="text-[13px] text-blue-600">⏳ 取得中…</p>
              : <BarcodeScanButton onIsbnDetected={lookupByIsbn} />
            }
          </div>

          <EditField label="著者" value={draft.author ?? ''} onChange={(v) => setField('author', v)} placeholder="例: 齋藤孝" />
          <EditField label="出版社" value={draft.publisher ?? ''} onChange={(v) => setField('publisher', v)} placeholder="例: 株式会社KADOKAWA" />
          <EditField label="発行日" value={draft.publishedAt ?? ''} onChange={(v) => setField('publishedAt', v)} placeholder="例: 2023-04-01" />
          <EditField label="ISBN" value={draft.isbn ?? ''} onChange={(v) => setField('isbn', v)} placeholder="例: 9784062834520" inputMode="numeric" />
          <EditField label="概要" value={draft.description ?? ''} onChange={(v) => setField('description', v)} placeholder="書籍の概要" multiline />

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => { setIsEditing(false); setDraft({}); setLookupError(null) }}
              className="flex-1 rounded-xl border border-gray-200 py-2.5 text-[13px] font-semibold text-gray-500 active:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={saveEditing}
              className="flex-1 rounded-xl bg-blue-500 py-2.5 text-[13px] font-semibold text-white active:bg-blue-600"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── データなし → スキャンを促す ───
  if (!hasData) {
    return (
      <div className="overflow-hidden rounded-2xl border border-dashed border-gray-300 bg-white p-4">
        <p className="mb-1 text-[14px] font-bold text-gray-700">📚 書籍情報</p>
        <p className="mb-3 text-[12px] text-gray-400">バーコードをスキャンして書誌情報を登録しましょう</p>
        {isLookingUp
          ? <div className="flex items-center justify-center gap-2 py-4 text-[14px] text-gray-500"><span className="animate-spin">⏳</span>書籍情報を取得中…</div>
          : <BarcodeScanButton onIsbnDetected={lookupByIsbn} />
        }
        {lookupError && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-[12px] text-red-600">{lookupError}</p>}
        <button type="button" onClick={startEditing} className="mt-3 w-full text-center text-[12px] text-gray-400 active:text-gray-600">
          手動で入力する
        </button>
      </div>
    )
  }

  // ─── データあり → 書誌情報パネル ───
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* 表紙 + 基本情報 */}
      <div className="flex gap-4 p-4">
        {/* 表紙画像 */}
        {meta?.coverUrl ? (
          <div className="shrink-0">
            <img
              src={meta.coverUrl}
              alt="表紙"
              className="h-32 w-[88px] rounded-lg object-cover shadow-md"
            />
          </div>
        ) : (
          <div className="flex h-32 w-[88px] shrink-0 items-center justify-center rounded-lg bg-gray-100 text-[28px]">
            📚
          </div>
        )}

        {/* 書誌情報テーブル */}
        <div className="min-w-0 flex-1">
          {/* タイトル */}
          <p className="mb-2 text-[15px] font-bold leading-tight text-gray-900">{content.title}</p>

          <div className="space-y-1">
            <MetaRow label="著者" value={content.author} />
            <MetaRow label="出版社" value={meta?.publisher} />
            <MetaRow label="発行日" value={meta?.publishedAt} />
            <MetaRow label="ISBN" value={meta?.isbn} mono />
          </div>
        </div>
      </div>

      {/* 概要 */}
      {meta?.description && (
        <div className="border-t border-gray-100 px-4 py-3">
          <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-gray-400">概要</p>
          <p className={`text-[12px] leading-relaxed text-gray-600 ${descExpanded ? '' : 'line-clamp-3'}`}>
            {meta.description}
          </p>
          {meta.description.length > 100 && (
            <button
              type="button"
              onClick={() => setDescExpanded((v) => !v)}
              className="mt-1 text-[11px] text-blue-500 active:opacity-60"
            >
              {descExpanded ? '折りたたむ' : 'もっと見る'}
            </button>
          )}
        </div>
      )}

      {/* 操作ボタン */}
      <div className="flex gap-2 border-t border-gray-100 px-4 py-3">
        <button
          type="button"
          onClick={startEditing}
          className="flex-1 rounded-xl border border-gray-200 py-2 text-[13px] font-semibold text-gray-600 active:bg-gray-50"
        >
          ✏️ 編集
        </button>
        {meta?.isbn && (
          <button
            type="button"
            onClick={() => lookupByIsbn(meta.isbn!)}
            disabled={isLookingUp}
            className="flex-1 rounded-xl border border-blue-200 py-2 text-[13px] font-semibold text-blue-600 active:bg-blue-50 disabled:opacity-40"
          >
            🔄 再スキャン
          </button>
        )}
      </div>
    </div>
  )
}

function MetaRow({ label, value, mono = false }: { label: string; value?: string; mono?: boolean }) {
  return (
    <div className="flex items-start gap-2">
      <span className="w-12 shrink-0 text-[11px] font-bold text-gray-400">{label}</span>
      <span className={`min-w-0 flex-1 text-[12px] text-gray-800 ${mono ? 'font-mono' : 'font-medium'} ${!value ? 'text-gray-300' : ''}`}>
        {value || '—'}
      </span>
    </div>
  )
}

function EditField({
  label, value, onChange, placeholder, inputMode, multiline,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
  multiline?: boolean
}) {
  const baseClass = 'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-[14px] text-gray-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100'
  return (
    <div>
      <label className="mb-1 block text-[12px] font-bold text-gray-500">{label}</label>
      {multiline
        ? <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3} className={baseClass} />
        : <input type="text" inputMode={inputMode} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={baseClass} />
      }
    </div>
  )
}
