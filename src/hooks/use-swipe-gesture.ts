'use client'

import { useEffect, useRef } from 'react'

type SwipeDirection = 'left' | 'right' | 'up' | 'down'

interface UseSwipeGestureOptions {
  onSwipe: (direction: SwipeDirection) => void
  /** 最小スワイプ距離（px）。デフォルト50 */
  threshold?: number
}

/** タッチデバイスのスワイプジェスチャーを検出するフック */
export function useSwipeGesture(
  elementRef: React.RefObject<HTMLElement | null>,
  { onSwipe, threshold = 50 }: UseSwipeGestureOptions,
): void {
  const startRef = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const el = elementRef.current
    if (!el) return

    const handleStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      startRef.current = { x: touch.clientX, y: touch.clientY }
    }

    const handleEnd = (e: TouchEvent) => {
      if (!startRef.current) return
      const touch = e.changedTouches[0]
      const dx = touch.clientX - startRef.current.x
      const dy = touch.clientY - startRef.current.y
      startRef.current = null

      if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return

      if (Math.abs(dx) > Math.abs(dy)) {
        onSwipe(dx > 0 ? 'right' : 'left')
      } else {
        onSwipe(dy > 0 ? 'down' : 'up')
      }
    }

    el.addEventListener('touchstart', handleStart, { passive: true })
    el.addEventListener('touchend', handleEnd, { passive: true })
    return () => {
      el.removeEventListener('touchstart', handleStart)
      el.removeEventListener('touchend', handleEnd)
    }
  }, [elementRef, onSwipe, threshold])
}
