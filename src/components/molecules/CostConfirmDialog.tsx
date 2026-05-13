'use client'

interface CostConfirmDialogProps {
  durationMin: number
  estimatedCostJpy: number
  onConfirm: () => void
  onCancel: () => void
}

export function CostConfirmDialog({
  durationMin,
  estimatedCostJpy,
  onConfirm,
  onCancel,
}: CostConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-1 text-base font-semibold text-gray-900">
          文字起こしの実行確認
        </h2>
        <p className="mb-4 text-sm text-gray-500">
          OpenAI Whisper API を使用して文字起こしを行います。
        </p>

        <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">推定音声時間</span>
            <span className="font-medium">{durationMin}分</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">推定コスト</span>
            <span className="font-medium text-orange-600">約{estimatedCostJpy}円</span>
          </div>
        </div>

        <p className="mb-5 text-xs text-gray-400">
          ※ 実際のコストはOpenAIの料金体系に準じます。コストはOpenAIアカウントに請求されます。
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            キャンセル
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            実行する
          </button>
        </div>
      </div>
    </div>
  )
}
