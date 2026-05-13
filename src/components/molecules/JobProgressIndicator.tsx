'use client'

import { useEffect, useState } from 'react'

interface JobProgressIndicatorProps {
  message?: string
}

export function JobProgressIndicator({
  message = 'テキストを取得中...',
}: JobProgressIndicatorProps) {
  const [dots, setDots] = useState('.')

  useEffect(() => {
    const timer = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '.' : d + '.'))
    }, 500)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {/* スピナー */}
      <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
      <p className="text-sm font-medium text-gray-600">
        {message}
        {dots}
      </p>
      <p className="mt-1 text-xs text-gray-400">しばらくお待ちください</p>
    </div>
  )
}
