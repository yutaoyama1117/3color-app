'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ColorTooltip } from '@/components/atoms/ColorTooltip'
import { TextRenderer } from '@/components/molecules/TextRenderer'
import { MarkSidePanel } from '@/components/organisms/MarkSidePanel'
import { CameraOcrButton } from '@/components/molecules/CameraOcrButton'
import { useMarkStore } from '@/stores/markStore'
import { useContentStore } from '@/stores/contentStore'
import type { MarkColor, MarkData, PendingSelection } from '@/types/mark'
import type { TextSection } from '@/types/content'

interface MarkingViewerProps {
  contentId: string
  title: string
  bodyText: string
  /** 書籍タイプかどうか（カメラOCR表示制御） */
  contentType?: string
  /** テキストセクション配列 */
  textSections?: TextSection[]
  /** テキスト追記コールバック */
  onAppendText?: (text: string, label?: string) => void
}

/**
 * テキスト選択範囲の「ビューポート座標」を取得する。
 */
function getSelectionViewportPosition(): { x: number; y: number } | null {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return null
  const range = selection.getRangeAt(0)
  const rect = range.getBoundingClientRect()
  if (rect.width === 0 && rect.height === 0) return null
  return {
    x: rect.left + rect.width / 2,
    y: rect.top,
  }
}

/**
 * テキスト全体における選択開始・終了オフセットを計算する。
 */
function getSelectionOffsets(
  container: HTMLElement,
  selection: Selection
): { start: number; end: number } | null {
  if (selection.rangeCount === 0) return null
  const range = selection.getRangeAt(0)

  let start = 0
  let end = 0
  let charCount = 0

  const treeWalker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT)
  let node = treeWalker.nextNode()

  while (node) {
    const len = node.nodeValue?.length ?? 0

    if (node === range.startContainer) {
      start = charCount + range.startOffset
    }
    if (node === range.endContainer) {
      end = charCount + range.endOffset
      break
    }

    charCount += len
    node = treeWalker.nextNode()
  }

  if (start === 0 && end === 0) return null
  return { start, end }
}

/** セクション用の拡張PendingSelection */
interface SectionPendingSelection extends PendingSelection {
  sectionId: string
}

export function MarkingViewer({
  contentId,
  title,
  bodyText,
  contentType,
  textSections,
  onAppendText,
}: MarkingViewerProps) {
  const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const [pendingSelection, setPendingSelection] = useState<SectionPendingSelection | null>(null)
  const [selectedMarkId, setSelectedMarkId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ color: MarkColor; text: string } | null>(null)
  const [colorFilter, setColorFilter] = useState<MarkColor | null>(null)
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())
  const [deletingSection, setDeletingSection] = useState<string | null>(null)

  // テキスト追記UI
  const [showAddText, setShowAddText] = useState(false)
  const [newText, setNewText] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // セクション名編集
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null)
  const [editingLabel, setEditingLabel] = useState('')
  const editInputRef = useRef<HTMLInputElement>(null)

  // セクションテキスト編集
  const [editingTextSectionId, setEditingTextSectionId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')

  const { marks, addMark, removeMarksBySectionId } = useMarkStore()
  const { removeTextSection, updateSectionLabel, updateSectionText } = useContentStore()
  const contentMarks = marks.filter((m) => m.contentId === contentId)

  // セクションデータ（textSections があればそれを使い、なければ bodyText を1セクションとして扱う）
  const sections: TextSection[] = textSections && textSections.length > 0
    ? textSections
    : bodyText
      ? [{ id: '__default__', text: bodyText, addedAt: new Date() }]
      : []

  /** セクションごとのマークを取得 */
  const getMarksForSection = useCallback(
    (sectionId: string): MarkData[] => {
      let sectionMarks = contentMarks.filter((m) => {
        // sectionId が設定されたマーク
        if (m.sectionId) return m.sectionId === sectionId
        // 旧マーク（sectionIdなし）→ デフォルトセクションに紐づけ
        if (sectionId === '__default__') return !m.sectionId
        return false
      })
      // 色フィルター
      if (colorFilter) {
        sectionMarks = sectionMarks.filter((m) => m.color === colorFilter)
      }
      return sectionMarks
    },
    [contentMarks, colorFilter],
  )

  /** selectionchangeイベントでテキスト選択を検出（モバイル対応） */
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null

    const handleSelectionChange = () => {
      // デバウンス: 選択確定を待つ
      if (timeout) clearTimeout(timeout)
      timeout = setTimeout(() => {
        const selection = window.getSelection()
        if (!selection || selection.isCollapsed) return
        const selectedText = selection.toString().trim()
        if (!selectedText || selectedText.length < 1) return

        // どのセクションの選択か特定
        for (const [sectionId, container] of sectionRefs.current) {
          if (!container.contains(selection.anchorNode)) continue

          const pos = getSelectionViewportPosition()
          if (!pos) return

          const offsets = getSelectionOffsets(container, selection)
          if (!offsets) {
            const fullText = container.textContent ?? ''
            const idx = fullText.indexOf(selectedText)
            if (idx === -1) return
            setPendingSelection({
              text: selectedText,
              startOffset: idx,
              endOffset: idx + selectedText.length,
              position: pos,
              sectionId,
            })
            return
          }

          setPendingSelection({
            text: selectedText,
            startOffset: offsets.start,
            endOffset: offsets.end,
            position: pos,
            sectionId,
          })
          return
        }
      }, 300)
    }

    document.addEventListener('selectionchange', handleSelectionChange)
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange)
      if (timeout) clearTimeout(timeout)
    }
  }, [])

  /** 色選択 → マーク追加 */
  const handleAddMark = useCallback(
    (color: MarkColor) => {
      if (!pendingSelection) return
      addMark({
        contentId,
        sectionId: pendingSelection.sectionId === '__default__' ? undefined : pendingSelection.sectionId,
        color,
        markedText: pendingSelection.text,
        charOffsetStart: pendingSelection.startOffset,
        charOffsetEnd: pendingSelection.endOffset,
      })
      window.getSelection()?.removeAllRanges()
      setToast({ color, text: pendingSelection.text.slice(0, 20) })
      setTimeout(() => setToast(null), 2500)
      setPendingSelection(null)
    },
    [pendingSelection, contentId, addMark],
  )

  /** キーボードショートカット: R / B / G / Esc */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!pendingSelection) return
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      const colorMap: Record<string, MarkColor> = { r: 'red', b: 'blue', g: 'green' }
      const color = colorMap[e.key.toLowerCase()]
      if (color) {
        handleAddMark(color)
        return
      }
      if (e.key === 'Escape') {
        window.getSelection()?.removeAllRanges()
        setPendingSelection(null)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [pendingSelection, handleAddMark])

  /** テキスト追記を確定 */
  const handleSubmitNewText = () => {
    if (!newText.trim() || !onAppendText) return
    onAppendText(newText.trim(), newLabel.trim() || undefined)
    setNewText('')
    setNewLabel('')
    setShowAddText(false)
    setToast({ color: 'blue', text: 'テキストを追加しました' })
    setTimeout(() => setToast(null), 2500)
  }

  /** カメラOCRで追記 */
  const handleOcrAppend = (extracted: string) => {
    if (!onAppendText) return
    onAppendText(extracted)
    setToast({ color: 'blue', text: 'OCRテキストを追加しました' })
    setTimeout(() => setToast(null), 2500)
  }

  /** セクション折りたたみトグル */
  const toggleCollapse = (sectionId: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev)
      if (next.has(sectionId)) next.delete(sectionId)
      else next.add(sectionId)
      return next
    })
  }

  /** テキスト編集を開始 */
  const startEditText = (sectionId: string, currentText: string) => {
    setEditingTextSectionId(sectionId)
    setEditingText(currentText)
    // 選択中マークをリセット
    setPendingSelection(null)
    window.getSelection()?.removeAllRanges()
  }

  /** テキスト編集を確定 */
  const commitEditText = (sectionId: string) => {
    if (editingText.trim()) {
      updateSectionText(contentId, sectionId, editingText.trim())
    }
    setEditingTextSectionId(null)
    setEditingText('')
  }

  /** テキスト編集をキャンセル */
  const cancelEditText = () => {
    setEditingTextSectionId(null)
    setEditingText('')
  }

  /** セクション名の編集を開始 */
  const startEditLabel = (sectionId: string, currentLabel: string) => {
    setEditingSectionId(sectionId)
    setEditingLabel(currentLabel)
    setTimeout(() => editInputRef.current?.focus(), 50)
  }

  /** セクション名の編集を確定 */
  const commitEditLabel = () => {
    if (editingSectionId && editingLabel.trim()) {
      updateSectionLabel(contentId, editingSectionId, editingLabel.trim())
    }
    setEditingSectionId(null)
    setEditingLabel('')
  }

  /** セクション削除を確定 */
  const confirmDeleteSection = (sectionId: string) => {
    removeMarksBySectionId(contentId, sectionId)
    removeTextSection(contentId, sectionId)
    setDeletingSection(null)
    setToast({ color: 'red', text: 'セクションを削除しました' })
    setTimeout(() => setToast(null), 2500)
  }

  const selectedMark = contentMarks.find((m) => m.id === selectedMarkId) ?? null
  const colorLabel: Record<MarkColor, string> = { red: '赤', blue: '青', green: '緑' }
  const totalMarks = contentMarks.length
  const colorCounts = {
    red: contentMarks.filter((m) => m.color === 'red').length,
    blue: contentMarks.filter((m) => m.color === 'blue').length,
    green: contentMarks.filter((m) => m.color === 'green').length,
  }

  return (
    <div className="flex h-full gap-0">
      {/* マーク追加トースト */}
      {toast && (
        <div className="pointer-events-none fixed bottom-20 left-1/2 z-50 -translate-x-1/2">
          <div className="flex items-center gap-2 rounded-full bg-gray-900/90 px-4 py-2 text-[14px] font-medium text-white shadow-lg backdrop-blur-sm">
            <span>{toast.color === 'blue' && toast.text.includes('追加しました')
              ? toast.text
              : toast.color === 'red' && toast.text.includes('削除しました')
                ? toast.text
                : `${colorLabel[toast.color]}マークを追加`
            }</span>
          </div>
        </div>
      )}

      {/* メインコンテンツエリア */}
      <div className="flex-1 overflow-auto">
        {/* 色フィルター + マーク統計バー */}
        <div className="sticky top-0 z-10 border-b border-gray-100 bg-white/90 px-4 py-2 backdrop-blur-sm">
          {/* Segmented Control: 色フィルター */}
          <div className="flex items-center gap-1 rounded-lg bg-gray-100/80 p-0.5">
            <button
              type="button"
              onClick={() => setColorFilter(null)}
              className={`flex-1 rounded-md px-2 py-1.5 text-[12px] font-semibold transition-all ${
                !colorFilter
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500'
              }`}
            >
              すべて ({totalMarks})
            </button>
            {([
              { color: 'red' as MarkColor, label: '重要', dot: 'bg-red-500' },
              { color: 'blue' as MarkColor, label: '客観', dot: 'bg-blue-500' },
              { color: 'green' as MarkColor, label: '気づき', dot: 'bg-green-500' },
            ]).map(({ color, label, dot }) => (
              <button
                key={color}
                type="button"
                onClick={() => setColorFilter(colorFilter === color ? null : color)}
                className={`flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-1.5 text-[12px] font-semibold transition-all ${
                  colorFilter === color
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500'
                }`}
              >
                <span className={`h-[6px] w-[6px] rounded-full ${dot}`} />
                {label} ({colorCounts[color]})
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 py-4 md:px-8">
          <h1 className="mb-4 text-[22px] font-bold leading-tight tracking-tight text-gray-900">{title}</h1>

          {/* セクションが0件の場合の空状態 */}
          {sections.length === 0 && onAppendText && (
            <div className="flex flex-col items-center px-4 pt-12 text-center">
              <div className="mb-4 text-5xl">📝</div>
              <p className="mb-1 text-[16px] font-bold text-gray-700">テキストがありません</p>
              <p className="mb-6 text-[13px] text-gray-400">
                テキストを追加してマーキングを始めましょう
              </p>
              <button
                type="button"
                onClick={() => {
                  setShowAddText(true)
                  setTimeout(() => textareaRef.current?.focus(), 100)
                }}
                className="rounded-xl bg-blue-500 px-8 py-3 text-[15px] font-semibold text-white shadow-sm active:bg-blue-600"
              >
                テキストを追加
              </button>
            </div>
          )}

          {/* 使い方ヒント */}
          {sections.length > 0 && totalMarks === 0 && (
            <div className="mb-4 rounded-xl bg-blue-50 px-4 py-3 text-[13px] font-medium text-blue-700">
              テキストを長押し（スマホ）または選択（PC）すると色マークを付けられます
            </div>
          )}

          {/* セクション目次（2セクション以上ある場合） */}
          {sections.length > 1 && (
            <div className="mb-4 rounded-xl bg-gray-50 px-4 py-3">
              <p className="mb-2 text-[12px] font-bold text-gray-500">セクション一覧</p>
              <div className="space-y-1">
                {sections.map((sec, i) => {
                  const sMarks = getMarksForSection(sec.id)
                  return (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => {
                        // 折りたたまれていれば展開してからスクロール
                        setCollapsedSections((prev) => {
                          const next = new Set(prev)
                          next.delete(sec.id)
                          return next
                        })
                        setTimeout(() => {
                          document.getElementById(`section-${sec.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                        }, 100)
                      }}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left active:bg-gray-100"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-[13px] font-semibold text-gray-800">
                          {sec.label || `セクション ${i + 1}`}
                        </span>
                        <span className="ml-2 text-[11px] text-gray-400">
                          {sec.text.length.toLocaleString()}字
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px]">
                        {sMarks.filter((m) => m.color === 'red').length > 0 && (
                          <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-red-700">
                            {sMarks.filter((m) => m.color === 'red').length}
                          </span>
                        )}
                        {sMarks.filter((m) => m.color === 'blue').length > 0 && (
                          <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-blue-700">
                            {sMarks.filter((m) => m.color === 'blue').length}
                          </span>
                        )}
                        {sMarks.filter((m) => m.color === 'green').length > 0 && (
                          <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-green-700">
                            {sMarks.filter((m) => m.color === 'green').length}
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* テキストセクション表示 */}
          {sections.map((sec, i) => {
            const sectionMarks = getMarksForSection(sec.id)
            const isCollapsed = collapsedSections.has(sec.id)
            const isDefault = sec.id === '__default__'
            // textSectionsが存在する場合は常にラベルを表示（1セクションでも管理可能に）
            const hasRealSections = textSections !== undefined
            const sectionLabel = sec.label || (hasRealSections ? `セクション ${i + 1}` : null)

            return (
              <div key={sec.id} id={`section-${sec.id}`} className="mb-4">
                {/* セクションヘッダー（textSectionsが存在する場合は常に表示） */}
                {(hasRealSections || sectionLabel) && (
                  <div className="mb-2 flex items-center gap-2">
                    {/* 折りたたみ矢印 */}
                    <button
                      type="button"
                      onClick={() => toggleCollapse(sec.id)}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full active:bg-gray-100"
                    >
                      <svg
                        className={`h-4 w-4 text-gray-400 transition-transform ${isCollapsed ? '' : 'rotate-90'}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>

                    {/* セクション名（編集可能） */}
                    {editingSectionId === sec.id ? (
                      <input
                        ref={editInputRef}
                        type="text"
                        value={editingLabel}
                        onChange={(e) => setEditingLabel(e.target.value)}
                        onBlur={commitEditLabel}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitEditLabel()
                          if (e.key === 'Escape') { setEditingSectionId(null); setEditingLabel('') }
                        }}
                        className="min-w-0 flex-1 rounded-lg border border-blue-400 bg-white px-2 py-1 text-[14px] font-bold text-gray-800 outline-none focus:ring-1 focus:ring-blue-400"
                        placeholder="セクション名を入力"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEditLabel(sec.id, sectionLabel || `セクション ${i + 1}`)}
                        className="flex min-w-0 flex-1 items-center gap-2 rounded-lg py-1 text-left active:bg-gray-50"
                      >
                        <span className="truncate text-[14px] font-bold text-gray-700">
                          {sectionLabel}
                        </span>
                        <svg className="h-3 w-3 shrink-0 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    )}

                    <span className="shrink-0 text-[11px] text-gray-400">
                      {sec.text.length.toLocaleString()}字 / {sectionMarks.length}マーク
                    </span>

                    {/* テキスト編集ボタン */}
                    {!isDefault && editingTextSectionId !== sec.id && (
                      <button
                        type="button"
                        onClick={() => startEditText(sec.id, sec.text)}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gray-400 active:bg-blue-50 active:text-blue-500"
                        aria-label="テキストを編集"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    )}

                    {/* セクション削除ボタン（実セクションなら常に表示） */}
                    {!isDefault && editingTextSectionId !== sec.id && (
                      <button
                        type="button"
                        onClick={() => setDeletingSection(sec.id)}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gray-400 active:bg-red-50 active:text-red-500"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                )}

                {/* セクション本文 */}
                {!isCollapsed && (
                  editingTextSectionId === sec.id ? (
                    /* ── 編集モード ── */
                    <div className="space-y-2">
                      <textarea
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        rows={Math.min(Math.max(editingText.split('\n').length + 2, 8), 30)}
                        className="w-full rounded-xl border border-blue-400 bg-white px-4 py-3 text-[15px] leading-relaxed text-gray-800 outline-none focus:ring-2 focus:ring-blue-300"
                        autoFocus
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-gray-400">
                          {editingText.length.toLocaleString()} 文字
                        </span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={cancelEditText}
                            className="rounded-xl border border-gray-200 px-4 py-2 text-[13px] font-semibold text-gray-500 active:bg-gray-50"
                          >
                            キャンセル
                          </button>
                          <button
                            type="button"
                            onClick={() => commitEditText(sec.id)}
                            disabled={!editingText.trim()}
                            className="rounded-xl bg-blue-500 px-4 py-2 text-[13px] font-semibold text-white active:bg-blue-600 disabled:opacity-40"
                          >
                            保存
                          </button>
                        </div>
                      </div>
                      <p className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] text-amber-700">
                        ⚠️ テキストを編集すると、このセクションのマーク位置がずれる場合があります
                      </p>
                    </div>
                  ) : (
                    /* ── 表示モード ── */
                    <div
                      ref={(el) => {
                        if (el) sectionRefs.current.set(sec.id, el)
                        else sectionRefs.current.delete(sec.id)
                      }}
                      className="cursor-text select-text text-[16px] font-normal leading-[2] tracking-wide text-gray-800"
                      data-testid={`text-container-${sec.id}`}
                      data-section-id={sec.id}
                    >
                      <TextRenderer
                        text={sec.text}
                        marks={sectionMarks}
                        onMarkClick={(id) => {
                          setSelectedMarkId(id)
                          setPendingSelection(null)
                        }}
                      />
                    </div>
                  )
                )}

                {/* セクション間の区切り線 */}
                {i < sections.length - 1 && !isCollapsed && (
                  <div className="my-6 border-t border-gray-200" />
                )}
              </div>
            )
          })}

          {/* テキスト追記セクション */}
          {onAppendText && (
            <div className="mt-6 border-t border-gray-200 pt-6">
              {!showAddText ? (
                <button
                  type="button"
                  onClick={() => {
                    setShowAddText(true)
                    setTimeout(() => textareaRef.current?.focus(), 100)
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 py-4 text-[15px] font-semibold text-gray-500 transition-colors active:border-blue-400 active:bg-blue-50 active:text-blue-600"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  テキストを追加
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[15px] font-bold text-gray-900">テキストを追加</p>
                    <button
                      type="button"
                      onClick={() => { setShowAddText(false); setNewText(''); setNewLabel('') }}
                      className="text-[14px] font-medium text-blue-500 active:opacity-60"
                    >
                      キャンセル
                    </button>
                  </div>

                  <p className="text-[12px] text-gray-500">
                    別のページや章のテキストを貼り付けてマーキングできます
                  </p>

                  {/* セクションラベル入力 */}
                  <input
                    type="text"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="ラベル（例: p.42, 第3章）"
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-[14px] text-gray-800 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />

                  {/* カメラOCR（書籍のみ） */}
                  {contentType === 'book' && (
                    <CameraOcrButton onTextExtracted={handleOcrAppend} />
                  )}

                  <textarea
                    ref={textareaRef}
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    placeholder="ここにテキストを貼り付け..."
                    rows={6}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-[15px] leading-relaxed text-gray-800 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />

                  {newText.trim().length > 0 && (
                    <p className="text-right text-[12px] text-gray-400">
                      {newText.trim().length.toLocaleString()} 文字
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={handleSubmitNewText}
                    disabled={!newText.trim()}
                    className="w-full rounded-xl bg-blue-500 py-3 text-[16px] font-semibold text-white active:bg-blue-600 disabled:opacity-40"
                  >
                    追加する
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 色選択ツールチップ */}
      {pendingSelection && (
        <ColorTooltip
          position={pendingSelection.position}
          selectedText={pendingSelection.text}
          onColorSelect={handleAddMark}
          onClose={() => {
            window.getSelection()?.removeAllRanges()
            setPendingSelection(null)
          }}
        />
      )}

      {/* マーク詳細サイドパネル */}
      <MarkSidePanel mark={selectedMark} onClose={() => setSelectedMarkId(null)} />

      {/* セクション削除確認ダイアログ */}
      {deletingSection && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
          <div className="w-full max-w-sm rounded-t-2xl bg-white p-6 shadow-xl sm:mx-6 sm:rounded-2xl">
            <h3 className="mb-2 text-center text-[17px] font-bold text-gray-900">
              セクションを削除
            </h3>
            <p className="mb-6 text-center text-[13px] text-gray-500">
              このセクションのマークも削除されます。この操作は取り消せません。
            </p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => confirmDeleteSection(deletingSection)}
                className="w-full rounded-xl bg-red-500 py-3 text-[16px] font-semibold text-white active:bg-red-600"
              >
                削除する
              </button>
              <button
                type="button"
                onClick={() => setDeletingSection(null)}
                className="w-full rounded-xl py-3 text-[16px] font-semibold text-blue-500 active:bg-gray-50"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
