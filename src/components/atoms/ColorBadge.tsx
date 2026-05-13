import type { MarkColor } from '@/types/mark'

const COLOR_CONFIG: Record<MarkColor, { label: string; className: string }> = {
  red: { label: '🔴 最重要', className: 'bg-red-100 text-red-700 border border-red-300' },
  blue: { label: '🔵 重要', className: 'bg-blue-100 text-blue-700 border border-blue-300' },
  green: { label: '🟢 気づき', className: 'bg-green-100 text-green-700 border border-green-300' },
}

interface ColorBadgeProps {
  color: MarkColor
  className?: string
}

export function ColorBadge({ color, className = '' }: ColorBadgeProps) {
  const { label, className: colorClass } = COLOR_CONFIG[color]
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass} ${className}`}>
      {label}
    </span>
  )
}
