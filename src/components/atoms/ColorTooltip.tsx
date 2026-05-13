'use client'

import { useEffect, useRef } from 'react'
import type { MarkColor } from '@/types/mark'

const BUTTONS: {
  color: MarkColor
  emoji: string
  label: string
  desc: string
  key: string
  bg: string
  border: string
  text: string
}[] = [
  {
    color: 'red',
    emoji: '🔴',
    label: '赤',
    desc: '最重要',
    key: 'R',
    bg: 'bg-red-50 hover:bg-red-100 active:bg-red-200',
    border: 'border-red-400',
    text: 'text-red-700',
  },
  {
    color: 'blue',
    emoji: '🔵',
    label: '青',
    desc: '重要',
    key: 'B',
    bg: 'bg-blue-50 hover:bg-blue-100 active:bg-blue-200',
    border: 'border-blue-400',
    text: 'text-blue-700',
  },
  {
    color: 'green',
    emoji: '🟢',
    label: '緑',
    desc: '気づき',
    key: 'G',
    bg: 'bg-green-50 hover:bg-green-100 active:bg-green-200',
    border: 'border-green-400',
    text: 'text-green-700',
  },
]

interface ColorTooltipProps {
  position: { x: number; y: number }
  selectedText: string
  onColorSelect: (color: MarkColor) => void
  onClose: () => void
}

export function ColorTooltip({
  position,
  selectedText,
  onColorSelect,
  onClose,
}: ColorTooltipProps) {
  const ref = useRef<HTMLDivElement>(null)

  // ツールチップ外タップ/クリックで閉じる（少し遅延して誤クローズ防止）
  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const timer = setTimeout(() => {
      document.addEventListener('pointerdown', handlePointerDown)
    }, 100)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [onClose])

  // 画面端からはみ出さないようにX座標を補正
  const tooltipWidth = 264
  const vw = typeof window !== 'undefined' ? window.innerWidth : 400
  const safeX = Math.min(Math.max(position.x, tooltipWidth / 2 + 8), vw - tooltipWidth / 2 - 8)

  // 上に十分な余裕がなければ下に表示
  const showAbove = position.y > 180

  return (
    <div
      ref={ref}
      role="toolbar"
      aria-label="マーク色を選択"
      style={{
        position: 'fixed',
        left: safeX,
        top: position.y,
        transform: `translateX(-50%) translateY(${showAbove ? 'calc(-100% - 8px)' : '8px'})`,
        zIndex: 9999,
        width: tooltipWidth,
      }}
      className="rounded-2xl border border-gray-200 bg-white shadow-2xl"
    >
      {/* 矢印 */}
      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{
          width: 0,
          height: 0,
          ...(showAbove
            ? {
                bottom: -6,
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: '6px solid #e5e7eb',
              }
            : {
                top: -6,
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderBottom: '6px solid #e5e7eb',
              }),
        }}
      />

      {/* 選択テキストプレビュー */}
      <div className="border-b border-gray-100 px-4 py-2.5">
        <p className="text-[10px] uppercase tracking-wide text-gray-400">選択中のテキスト</p>
        <p className="mt-0.5 line-clamp-2 text-sm font-medium text-gray-700">
          「{selectedText}」
        </p>
      </div>

      {/* 色ボタン — 3つ横並び・タッチしやすい大きさ */}
      <div className="flex gap-2 p-3">
        {BUTTONS.map(({ color, emoji, label, desc, key, bg, border, text }) => (
          <button
            key={color}
            type="button"
            aria-label={`${label}マーク（${desc}）`}
            onClick={() => onColorSelect(color)}
            className={`flex flex-1 flex-col items-center gap-1 rounded-xl border-2 py-3 transition-all ${bg} ${border} ${text}`}
          >
            <span className="text-2xl leading-none">{emoji}</span>
            <span className="text-xs font-bold">{label}</span>
            <span className="text-[10px] opacity-60">{desc}</span>
            {/* PCのみキーボードショートカットを表示 */}
            <kbd className="hidden rounded bg-white/70 px-1 text-[9px] md:block">{key}キー</kbd>
          </button>
        ))}
      </div>

      {/* キャンセル */}
      <div className="border-t border-gray-100 px-3 pb-2.5">
        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-lg py-2 text-xs text-gray-400 hover:bg-gray-50 active:bg-gray-100"
        >
          キャンセル
        </button>
      </div>
    </div>
  )
}
