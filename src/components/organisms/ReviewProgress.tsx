'use client'

interface ReviewProgressProps {
  current: number
  total: number
}

export function ReviewProgress({ current, total }: ReviewProgressProps) {
  const percent = total > 0 ? Math.round((current / total) * 100) : 0
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-500">
        <span>今日の復習</span>
        <span>
          {current} / {total} 枚
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full bg-blue-500 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
