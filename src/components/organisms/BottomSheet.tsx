'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  /** スナップポイント（画面高比、0〜1） */
  snapPoints?: number[]
  /** 初期スナップポイントの index */
  defaultSnapIndex?: number
}

/** モバイル向けボトムシート（ドラッグでスナップ） */
export function BottomSheet({
  open,
  onClose,
  children,
  snapPoints = [0.25, 0.5, 0.9],
  defaultSnapIndex = 1,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const startYRef = useRef<number | null>(null)
  const [snapIndex, setSnapIndex] = useState(defaultSnapIndex)
  const [dragOffset, setDragOffset] = useState(0)

  useEffect(() => {
    if (open) setSnapIndex(defaultSnapIndex)
  }, [open, defaultSnapIndex])

  // 背景のスクロールロック
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [open])

  const handleStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    const y = 'touches' in e ? e.touches[0].clientY : e.clientY
    startYRef.current = y
  }, [])

  const handleMove = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (startYRef.current === null) return
    const y = 'touches' in e ? e.touches[0].clientY : e.clientY
    const delta = y - startYRef.current
    setDragOffset(Math.max(0, delta))
  }, [])

  const handleEnd = useCallback(() => {
    if (dragOffset > 100) {
      // 下方向に大きくドラッグ → 次の小さいスナップへ or 閉じる
      if (snapIndex > 0) {
        setSnapIndex(snapIndex - 1)
      } else {
        onClose()
      }
    } else if (dragOffset < -50 && snapIndex < snapPoints.length - 1) {
      setSnapIndex(snapIndex + 1)
    }
    setDragOffset(0)
    startYRef.current = null
  }, [dragOffset, snapIndex, snapPoints.length, onClose])

  if (!open) return null

  const sheetHeight = `${snapPoints[snapIndex] * 100}vh`

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* 背景オーバーレイ */}
      <div
        className="absolute inset-0 bg-black/40 transition-opacity"
        onClick={onClose}
        aria-hidden
      />

      {/* シート本体 */}
      <div
        ref={sheetRef}
        style={{
          height: sheetHeight,
          transform: `translateY(${dragOffset}px)`,
          transition: startYRef.current === null ? 'all 0.2s ease-out' : 'none',
        }}
        className="relative w-full overflow-y-auto rounded-t-2xl bg-white shadow-xl"
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
      >
        {/* ドラッグハンドル */}
        <div
          className="sticky top-0 z-10 flex cursor-grab justify-center bg-white py-3"
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
        >
          <div className="h-1 w-10 rounded-full bg-gray-300" />
        </div>

        <div className="px-5 pb-8">{children}</div>
      </div>
    </div>
  )
}
