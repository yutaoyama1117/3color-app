'use client'

interface ReviewCompleteProps {
  reviewedCount: number
  streakDays: number
}

export function ReviewComplete({ reviewedCount, streakDays }: ReviewCompleteProps) {
  return (
    <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
      <div className="mb-3 text-5xl">🎉</div>
      <h2 className="mb-1 text-xl font-bold text-gray-900">おつかれさまでした！</h2>
      <p className="mb-4 text-sm text-gray-600">
        本日は <span className="font-semibold">{reviewedCount}</span> 枚の復習を完了しました
      </p>

      {streakDays > 0 && (
        <div className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-4 py-1 text-sm font-medium text-orange-700">
          🔥 {streakDays} 日連続継続中！
        </div>
      )}

      <div className="mt-6">
        <a
          href="/app"
          className="inline-block rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          マイ本棚へ戻る
        </a>
      </div>
    </div>
  )
}
