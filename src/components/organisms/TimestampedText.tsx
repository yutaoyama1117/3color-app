'use client'

import { useRef } from 'react'

export interface TimestampSegment {
  startSec: number
  endSec: number
  text: string
}

interface TimestampedTextProps {
  segments: TimestampSegment[]
  currentSec?: number
  onSeek?: (sec: number) => void
}

function formatTime(sec: number): string {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

export function TimestampedText({ segments, currentSec = 0, onSeek }: TimestampedTextProps) {
  const activeRef = useRef<HTMLButtonElement | null>(null)

  return (
    <div className="space-y-1">
      {segments.map((seg, i) => {
        const isActive = currentSec >= seg.startSec && currentSec < seg.endSec
        return (
          <button
            key={i}
            ref={isActive ? activeRef : null}
            onClick={() => onSeek?.(seg.startSec)}
            className={`flex w-full gap-3 rounded px-2 py-1 text-left text-sm transition-colors ${
              isActive
                ? 'bg-blue-50 text-blue-900'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span className="shrink-0 font-mono text-xs text-gray-400 pt-0.5">
              {formatTime(seg.startSec)}
            </span>
            <span className="flex-1 leading-relaxed">{seg.text}</span>
          </button>
        )
      })}
    </div>
  )
}
