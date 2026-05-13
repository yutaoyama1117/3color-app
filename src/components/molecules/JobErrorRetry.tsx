'use client'

interface JobErrorRetryProps {
  message?: string
  onRetry?: () => void
  onManual?: () => void
}

export function JobErrorRetry({
  message = '取得に失敗しました。',
  onRetry,
  onManual,
}: JobErrorRetryProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 text-4xl">⚠️</div>
      <p className="mb-1 text-sm font-medium text-gray-700">{message}</p>
      <p className="mb-6 text-xs text-gray-400">再試行するかテキストを手動入力してください</p>
      <div className="flex gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            再試行する
          </button>
        )}
        {onManual && (
          <button
            onClick={onManual}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            手動でテキストを入力
          </button>
        )}
      </div>
    </div>
  )
}
