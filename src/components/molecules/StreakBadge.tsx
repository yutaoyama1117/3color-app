'use client'

interface StreakBadgeProps {
  days: number
}

export function StreakBadge({ days }: StreakBadgeProps) {
  if (days === 0) return null
  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700">
      🔥 {days} 日連続
    </div>
  )
}
