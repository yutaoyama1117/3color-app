'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ColorTooltip } from '@/components/atoms/ColorTooltip'
import { TextRenderer } from '@/components/molecules/TextRenderer'
import { MarkSidePanel } from '@/components/organisms/MarkSidePanel'
import { useMarkStore } from '@/stores/markStore'
import type { MarkColor, PendingSelection } from '@/types/mark'

interface MarkingViewerProps {
  contentId: string
  title: string
  bodyText: string
}

/**
 * テキスト選択範囲の「ビューポート座標」を取得する。
 * スクロール量を含むため、fixed 位置のツールチップに正確に渡せる。
 */
function getSelectionViewportPosition(): { x: number; y: number } | null {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return null
  const range = selection.getRangeAt(0)
  const rect = range.getBoundingClientRect()
  if (rect.width === 0 && rect.height === 0) return null
  return {
    x: rect.left + rect.width / 2,
    y: rect.top, // ビューポート基準（fixed に渡す）
  }
}

/**
 * テキスト全体における選択開始・終了オフセットを計算する。
 * indexOf は重複テキストで誤検知するため、DOM の textContent を走査して位置を特定する。
 */
function getSelectionOffsets(
  container: HTMLElement,
  selection: Selection
): { start: number; end: number } | null {
  if (selection.rangeCount === 0) return null
  const range = selection.getRangeAt(0)

  // コンテナ全体のテキストノードを走査してオフセットを計算
  let start = 0
  let end = 0
  let charCount = 0
  let startFound = false

  const treeWalker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT)
  let node = treeWalker.nextNode()

  while (node) {
    const len = node.nodeValue?.length ?? 0

    if (node === range.startContainer) {
      start = charCount + range.startOffset
      startFound = true
    }
    if (node === range.endContainer) {
      end = charCount + range.endOffset
      break
    }
    if (startFound && node !== range.endContainer) {
      // 開始ノードの後でまだ終了ノードに達していない
    }

    charCount += len
    node = treeWalker.nextNode()
  }

  if (start === 0 && end === 0) return null
  return { start, end }
}

export function MarkingViewer({ contentId, title, bodyText }: MarkingViewerProps) {
  const textContainerRef = useRef<HTMLDivElement>(null)
  const [pendingSelection, setPendingSelection] = useState<PendingSelection | null>(null)
  const [selectedMarkId, setSelectedMarkId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ color: MarkColor; text: string } | null>(null)

  const { marks, addMark } = useMarkStore()
  const contentMarks = marks.filter((m) => m.contentId === contentId)

  /** テキスト選択が確定したときに呼ぶ共通処理 */
  const handleSelectionEnd = useCallback(() => {
    // 少し待ってから取得（タッチ選択の確定を待つ）
    requestAnimationFrame(() => {
      const selection = window.getSelection()
      if (!selection || selection.isCollapsed) return
      const selectedText = selection.toString().trim()
      if (!selectedText || selectedText.length < 1) return

      const container = textContainerRef.current
      if (!container) return

      const pos = getSelectionViewportPosition()
      if (!pos) return

      const offsets = getSelectionOffsets(container, selection)
      if (!offsets) {
        // フォールバック: indexOf で近似
        const fullText = container.textContent ?? ''
        const idx = fullText.indexOf(selectedText)
        if (idx === -1) return
        setPendingSelection({
          text: selectedText,
          startOffset: idx,
          endOffset: idx + selectedText.length,
          position: pos,
        })
        return
      }

      setPendingSelection({
        text: selectedText,
        startOffset: offsets.start,
        endOffset: offsets.end,
        position: pos,
      })
    })
  }, [])

  // PC: mouseup
  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      // ツールチップ自体のクリックでは発火させない
      if ((e.target as HTMLElement).closest('[role="toolbar"]')) return
      handleSelectionEnd()
    },
    [handleSelectionEnd]
  )

  // スマホ: touchend
  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if ((e.target as HTMLElement).closest('[role="toolbar"]')) return
      handleSelectionEnd()
    },
    [handleSelectionEnd]
  )

  /** 色選択 → マーク追加 */
  const handleAddMark = useCallback(
    (color: MarkColor) => {
      if (!pendingSelection) return
      addMark({
        contentId,
        color,
        markedText: pendingSelection.text,
        charOffsetStart: pendingSelection.startOffset,
        charOffsetEnd: pendingSelection.endOffset,
      })
      window.getSelection()?.removeAllRanges()
      // マーク追加トースト通知
      setToast({ color, text: pendingSelection.text.slice(0, 20) })
      setTimeout(() => setToast(null), 2500)
      setPendingSelection(null)
    },
    [pendingSelection, contentId, addMark]
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

  const selectedMark = contentMarks.find((m) => m.id === selectedMarkId) ?? null

  // 色ラベル
  const colorLabel: Record<MarkColor, string> = { red: '🔴 赤', blue: '🔵 青', green: '🟢 緑' }

  return (
    <div className="flex h-full gap-0">
      {/* マーク追加トースト */}
      {toast && (
        <div className="pointer-events-none fixed bottom-20 left-1/2 z-50 -translate-x-1/2">
          <div className="flex items-center gap-2 rounded-full bg-gray-900/90 px-4 py-2 text-sm text-white shadow-lg backdrop-blur-sm">
            <span>{colorLabel[toast.color]}マークを追加しました</span>
          </div>
        </div>
      )}

      {/* メインコンテンツエリア */}
      <div className="flex-1 overflow-auto">
        {/* 色の凡例バー（常時表示） */}
        <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-gray-100 bg-white/90 px-6 py-2 text-xs backdrop-blur-sm">
          <span className="text-gray-400">マーク：</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 font-medium text-red-700">
            🔴 赤＝最重要
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 font-medium text-blue-700">
            🔵 青＝重要
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 font-medium text-green-700">
            🟢 緑＝気づき
          </span>
          {/* マーク数サマリー */}
          {contentMarks.length > 0 && (
            <span className="ml-auto text-gray-400">
              {contentMarks.length}件のマーク
            </span>
          )}
        </div>

        <div className="px-6 py-6 md:px-10">
          <h1 className="mb-6 text-2xl font-bold text-gray-900">{title}</h1>

          {/* 使い方ヒント（マークが0件のとき表示） */}
          {contentMarks.length === 0 && (
            <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              💡 テキストを長押し（スマホ）または選択（PC）すると色マークを付けられます
            </div>
          )}

          <div
            ref={textContainerRef}
            onMouseUp={handleMouseUp}
            onTouchEnd={handleTouchEnd}
            className="cursor-text select-text text-base leading-9 text-gray-800"
            data-testid="text-container"
          >
            <TextRenderer
              text={bodyText}
              marks={contentMarks}
              onMarkClick={(id) => {
                setSelectedMarkId(id)
                setPendingSelection(null)
              }}
            />
          </div>
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
    </div>
  )
}
