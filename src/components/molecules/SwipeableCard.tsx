'use client'

import { useRef, useState, useCallback } from 'react'

interface SwipeableCardProps {
  children: React.ReactNode
  onDelete?: () => void
  className?: string
}

/** 左スワイプで削除ボタンを表示するカード */
export function SwipeableCard({ children, onDelete, className = '' }: SwipeableCardProps) {
  const [translateX, setTranslateX] = useState(0)
  const startXRef = useRef<number | null>(null)
  const [exposed, setExposed] = useState(false)

  const handleStart = useCallback((e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX
  }, [])

  const handleMove = useCallback((e: React.TouchEvent) => {
    if (startXRef.current === null) return
    const delta = e.touches[0].clientX - startXRef.current
    // 左スワイプのみ（負方向）
    if (delta < 0) setTranslateX(Math.max(-80, delta))
  }, [])

  const handleEnd = useCallback(() => {
    if (translateX < -40) {
      setTranslateX(-80)
      setExposed(true)
    } else {
      setTranslateX(0)
      setExposed(false)
    }
    startXRef.current = null
  }, [translateX])

  const handleDelete = useCallback(() => {
    onDelete?.()
    setTranslateX(0)
    setExposed(false)
  }, [onDelete])

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* 削除ボタン（背面） */}
      {onDelete && (
        <button
          type="button"
          onClick={handleDelete}
          aria-hidden={!exposed}
          className="absolute right-0 top-0 flex h-full w-20 items-center justify-center bg-red-500 text-sm font-medium text-white"
        >
          削除
        </button>
      )}

      {/* カード本体 */}
      <div
        style={{ transform: `translateX(${translateX}px)`, transition: startXRef.current === null ? 'transform 0.2s' : 'none' }}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
        className="relative bg-white"
      >
        {children}
      </div>
    </div>
  )
}
