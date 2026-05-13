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

/** 編集ドラフトの型（著者を含む） */
interface MetaDraft extends Partial<BookMeta> {
  author?: string
}

/** 書籍情報カード（表示・編集・バーコードスキャン対応） */
export function BookMetaCard({ content }: BookMetaCardProps) {
  const { updateBookMeta, updateAuthor } = useContentStore()
  const [isOpen, setIsOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isLookingUp, setIsLookingUp] = useState(false)
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [draft, setDraft] = useState<MetaDraft>({})

  const meta = content.bookMeta
  // 著者またはいずれかのメタデータがあれば「登録済み」扱い
  const hasData = !!(content.author || meta?.isbn || meta?.publisher || meta?.publishedAt)

  /** ISBNでGoogle Books APIを呼び出して書籍情報を一括取得・保存 */
  const lookupByIsbn = async (isbn: string) => {
    setIsLookingUp(true)
    setLookupError(null)
    try {
      const res = await fetch(`/api/book-lookup?isbn=${isbn}`)
      const data = (await res.json()) as GoogleBooksResult & { error?: string }

      if (!res.ok || data.error) {
        setLookupError(data.error ?? '書籍情報の取得に失敗しました')
        // ISBNだけドラフトに入れて編集モードへ
        setDraft({ isbn, author: content.author ?? '' })
        setIsEditing(true)
        setIsOpen(true)
        return
      }

      // 著者を content.author に保存（既存の値があっても上書き）
      const authorStr = data.authors?.join(', ') ?? ''
      if (authorStr) updateAuthor(content.id, authorStr)

      // その他のメタデータを bookMeta に保存
      updateBookMeta(content.id, {
        isbn: data.isbn ?? isbn,
        publisher: data.publisher ?? '',
        publishedAt: data.publishedAt ?? '',
        description: data.description ?? '',
        coverUrl: data.coverUrl ?? '',
      })

      setIsOpen(true)
      setIsEditing(false)
    } catch {
      setLookupError('ネットワークエラーが発生しました')
      setDraft({ isbn, author: content.author ?? '' })
      setIsEditing(true)
      setIsOpen(true)
    } finally {
      setIsLookingUp(false)
    }
  }

  /** 編集開始 */
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

  /** 編集を保存 */
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

  const setField = <K extends keyof MetaDraft>(key: K, value: MetaDraft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* ヘッダー */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3.5 text-left active:bg-gray-50"
      >
        <div className="flex items-center gap-2">
          <span className="text-[17px]">📚</span>
          <span className="text-[15px] font-bold text-gray-800">書籍情報</span>
          {hasData ? (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
              登録済み
            </span>
          ) : (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-400">
              未登録
            </span>
          )}
        </div>
        <svg
          className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="border-t border-gray-100 px-4 pb-5 pt-4">

          {/* ─── 表示モード ─── */}
          {!isEditing && (
            <div className="space-y-4">
              {/* バーコードスキャン / ISBN取得 */}
              <div className="space-y-2">
                {isLookingUp ? (
                  <div className="flex items-center justify-center gap-2 py-4 text-[14px] text-gray-500">
                    <span className="animate-spin">⏳</span>
                    書籍情報を取得中…
                  </div>
                ) : (
                  <>
                    <BarcodeScanButton onIsbnDetected={lookupByIsbn} />
                    {lookupError && (
                      <p className="rounded-lg bg-red-50 px-3 py-2 text-[12px] text-red-600">{lookupError}</p>
                    )}
                  </>
                )}
              </div>

              {/* 4項目の情報表示（常に表示・未入力は「—」） */}
              <div className="overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
                {/* 表紙サムネイル（ある場合） */}
                {meta?.coverUrl && (
                  <div className="flex justify-center border-b border-gray-100 bg-white py-3">
                    <img
                      src={meta.coverUrl}
                      alt="表紙"
                      className="h-24 w-[68px] rounded object-cover shadow-sm"
                    />
                  </div>
                )}

                <div className="divide-y divide-gray-100">
                  <MetaRow label="著者" value={content.author} />
                  <MetaRow label="出版社" value={meta?.publisher} />
                  <MetaRow label="発行日" value={meta?.publishedAt} />
                  <MetaRow label="ISBN" value={meta?.isbn} mono />
                </div>
              </div>

              {/* 概要 */}
              {meta?.description && (
                <div className="rounded-xl bg-gray-50 px-3 py-3">
                  <p className="mb-1 text-[11px] font-bold text-gray-400">概要</p>
                  <p className="line-clamp-4 text-[12px] leading-relaxed text-gray-600">
                    {meta.description}
                  </p>
                </div>
              )}

              {/* 操作ボタン */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={startEditing}
                  className="flex-1 rounded-xl border border-gray-200 py-2.5 text-[13px] font-semibold text-gray-600 active:bg-gray-50"
                >
                  ✏️ 手動で編集
                </button>
                {meta?.isbn && (
                  <button
                    type="button"
                    onClick={() => lookupByIsbn(meta.isbn!)}
                    disabled={isLookingUp}
                    className="flex-1 rounded-xl border border-blue-200 py-2.5 text-[13px] font-semibold text-blue-600 active:bg-blue-50 disabled:opacity-40"
                  >
                    🔄 再取得
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ─── 編集モード ─── */}
          {isEditing && (
            <div className="space-y-3">
              {/* ISBNでの自動取得 */}
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
                <p className="mb-2 text-[12px] font-bold text-blue-700">📷 ISBNスキャンで自動入力</p>
                {lookupError && (
                  <p className="mb-2 text-[11px] text-orange-600">{lookupError}</p>
                )}
                {isLookingUp ? (
                  <p className="text-[13px] text-blue-600">⏳ 取得中…</p>
                ) : (
                  <BarcodeScanButton onIsbnDetected={lookupByIsbn} />
                )}
              </div>

              {/* 手動入力フィールド（4項目） */}
              <EditField
                label="著者"
                value={draft.author ?? ''}
                onChange={(v) => setField('author', v)}
                placeholder="例: 齋藤孝"
              />
              <EditField
                label="出版社"
                value={draft.publisher ?? ''}
                onChange={(v) => setField('publisher', v)}
                placeholder="例: 株式会社KADOKAWA"
              />
              <EditField
                label="発行日"
                value={draft.publishedAt ?? ''}
                onChange={(v) => setField('publishedAt', v)}
                placeholder="例: 2023-04-01"
              />
              <EditField
                label="ISBN"
                value={draft.isbn ?? ''}
                onChange={(v) => setField('isbn', v)}
                placeholder="例: 9784062834520"
                inputMode="numeric"
              />
              <EditField
                label="概要（任意）"
                value={draft.description ?? ''}
                onChange={(v) => setField('description', v)}
                placeholder="書籍の内容や感想"
                multiline
              />

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
          )}
        </div>
      )}
    </div>
  )
}

/** 情報表示行（値がなければ「—」を表示） */
function MetaRow({ label, value, mono = false }: { label: string; value?: string; mono?: boolean }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <span className="w-14 shrink-0 text-[12px] font-bold text-gray-400">{label}</span>
      <span className={`min-w-0 flex-1 text-[14px] text-gray-800 ${mono ? 'font-mono text-[12px]' : 'font-medium'} ${!value ? 'text-gray-300' : ''}`}>
        {value || '—'}
      </span>
    </div>
  )
}

/** 編集入力フィールド */
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
  const baseClass =
    'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-[14px] text-gray-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100'
  return (
    <div>
      <label className="mb-1 block text-[12px] font-bold text-gray-500">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className={baseClass}
        />
      ) : (
        <input
          type="text"
          inputMode={inputMode}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={baseClass}
        />
      )}
    </div>
  )
}
