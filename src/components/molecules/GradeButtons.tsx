'use client'

import type { ReviewGrade } from '@/lib/review/sm2'

interface GradeButtonsProps {
  onGrade: (grade: ReviewGrade) => void
  disabled?: boolean
}

const GRADES: { value: ReviewGrade; emoji: string; label: string }[] = [
  { value: 0, emoji: '😰', label: '忘れた' },
  { value: 1, emoji: '🥲', label: 'うろ覚え' },
  { value: 2, emoji: '🤔', label: '曖昧' },
  { value: 3, emoji: '😐', label: '迷った' },
  { value: 4, emoji: '🙂', label: 'OK' },
  { value: 5, emoji: '🎯', label: '即答' },
]

export function GradeButtons({ onGrade, disabled }: GradeButtonsProps) {
  return (
    <div className="grid grid-cols-6 gap-2">
      {GRADES.map((g) => (
        <button
          key={g.value}
          type="button"
          onClick={() => onGrade(g.value)}
          disabled={disabled}
          className="flex flex-col items-center rounded-lg border border-gray-200 bg-white py-3 text-xs hover:border-blue-400 hover:bg-blue-50 disabled:opacity-50"
        >
          <span className="text-xl">{g.emoji}</span>
          <span className="mt-1 font-medium text-gray-700">{g.value}</span>
          <span className="text-[10px] text-gray-500">{g.label}</span>
        </button>
      ))}
    </div>
  )
}
