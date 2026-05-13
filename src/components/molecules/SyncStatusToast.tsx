'use client'

import { useEffect, useState } from 'react'

interface SyncStatusToastProps {
  message: string
  variant?: 'success' | 'error' | 'info'
  durationMs?: number
  onDismiss?: () => void
}

export function SyncStatusToast({
  message,
  variant = 'success',
  durationMs = 4000,
  onDismiss,
}: SyncStatusToastProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false)
      onDismiss?.()
    }, durationMs)
    return () => clearTimeout(t)
  }, [durationMs, onDismiss])

  if (!visible) return null

  const variantClass = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  }[variant]

  const icon = { success: '✅', error: '⚠️', info: 'ℹ️' }[variant]

  return (
    <div
      role="status"
      className={`fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-lg border px-4 py-2 shadow-md ${variantClass}`}
    >
      <span>{icon}</span>
      <span className="text-sm font-medium">{message}</span>
    </div>
  )
}
