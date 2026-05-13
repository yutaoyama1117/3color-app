'use client'

interface Session {
  id: string
  device: string
  lastActiveAt: Date
  ipAddress?: string
  isCurrent: boolean
}

interface SessionListProps {
  sessions: Session[]
  onRevokeOthers: () => Promise<void>
}

export function SessionList({ sessions, onRevokeOthers }: SessionListProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-700">アクティブセッション</h3>
      <ul className="space-y-2">
        {sessions.map((s) => (
          <li
            key={s.id}
            className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3"
          >
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                {s.device}
                {s.isCurrent && (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                    現在のセッション
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500">
                最終アクセス: {s.lastActiveAt.toLocaleString('ja-JP')}
                {s.ipAddress && ` / ${s.ipAddress}`}
              </div>
            </div>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onRevokeOthers}
        disabled={sessions.filter((s) => !s.isCurrent).length === 0}
        className="text-sm text-red-600 hover:underline disabled:opacity-50"
      >
        他の全デバイスからログアウト
      </button>
    </div>
  )
}
