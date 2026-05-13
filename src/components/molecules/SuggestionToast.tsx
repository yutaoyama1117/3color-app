'use client'

import { useEffect, useState } from 'react'

interface SuggestionToastProps {
  message: string
  onClick?: () => void
  durationMs?: number
}

export function SuggestionToast({ message, onClick, durationMs = 5000 }: SuggestionToastProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), durationMs)
    return () => clearTimeout(t)
  }, [durationMs])

  if (!visible) return null

  return (
    <button
      type="button"
      onClick={() => {
        onClick?.()
        setVisible(false)
      }}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-3 shadow-lg hover:bg-blue-50"
    >
      <span className="text-lg">🔗</span>
      <span className="text-sm font-medium text-gray-700">{message}</span>
    </button>
  )
}
