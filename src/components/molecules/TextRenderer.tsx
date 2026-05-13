'use client'

import type { MarkColor, MarkData, TextSegment } from '@/types/mark'

/** マークの色に対応するTailwindクラス */
const MARK_STYLE: Record<MarkColor, string> = {
  red: 'bg-red-200/60 border-b-2 border-red-500 cursor-pointer rounded-sm',
  blue: 'bg-blue-200/60 border-b-2 border-blue-500 cursor-pointer rounded-sm',
  green: 'bg-green-200/60 border-b-2 border-green-500 cursor-pointer rounded-sm',
}

/**
 * テキスト文字列をマーク境界で分割してセグメント配列を生成する。
 * 重複マークは考慮しない（開始位置でソートして先勝ち）。
 */
export function buildSegments(text: string, marks: MarkData[]): TextSegment[] {
  const sorted = [...marks].sort((a, b) => a.charOffsetStart - b.charOffsetStart)
  const segments: TextSegment[] = []
  let cursor = 0

  for (const mark of sorted) {
    const start = mark.charOffsetStart
    const end = mark.charOffsetEnd

    // マーク範囲外のプレーンテキスト
    if (cursor < start) {
      segments.push({ type: 'plain', text: text.slice(cursor, start) })
    }

    // マーク箇所（カーソルより前の場合はスキップ）
    if (end > cursor) {
      segments.push({
        type: 'marked',
        text: text.slice(Math.max(cursor, start), end),
        mark,
      })
      cursor = end
    }
  }

  // 末尾のプレーンテキスト
  if (cursor < text.length) {
    segments.push({ type: 'plain', text: text.slice(cursor) })
  }

  return segments
}

interface TextRendererProps {
  text: string
  marks: MarkData[]
  onMarkClick: (markId: string) => void
}

export function TextRenderer({ text, marks, onMarkClick }: TextRendererProps) {
  const segments = buildSegments(text, marks)

  return (
    <>
      {segments.map((seg, i) => {
        if (seg.type === 'plain') {
          // 改行を <br> に変換
          return seg.text.split('\n').map((line, j) => (
            <span key={`${i}-${j}`}>
              {j > 0 && <br />}
              {line}
            </span>
          ))
        }

        return (
          <mark
            key={seg.mark.id}
            data-mark-id={seg.mark.id}
            data-color={seg.mark.color}
            role="button"
            tabIndex={0}
            aria-label={`${seg.mark.color}マーク: ${seg.mark.markedText}`}
            onClick={() => onMarkClick(seg.mark.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onMarkClick(seg.mark.id)
            }}
            className={`bg-transparent ${MARK_STYLE[seg.mark.color]}`}
          >
            {seg.text}
          </mark>
        )
      })}
    </>
  )
}
