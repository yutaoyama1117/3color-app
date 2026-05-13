'use client'

import { useState } from 'react'

interface DeleteAccountDialogProps {
  userEmail: string
  open: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
}

export function DeleteAccountDialog({
  userEmail,
  open,
  onClose,
  onConfirm,
}: DeleteAccountDialogProps) {
  const [confirmEmail, setConfirmEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!open) return null

  const canConfirm = confirmEmail === userEmail

  const handleConfirm = async () => {
    setSubmitting(true)
    try {
      await onConfirm()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-1 text-xl font-bold text-red-700">⚠️ アカウントを削除</h2>
        <p className="mb-4 text-sm text-gray-600">
          すべてのコンテンツ・マーク・タグが削除されます（30日間の猶予期間あり）。
          この操作は取り消せません。
        </p>

        <div className="mb-4 rounded-lg bg-red-50 p-3 text-xs text-red-800">
          ご利用のメールアドレス（<strong>{userEmail}</strong>）を入力して確認してください。
        </div>

        <input
          type="email"
          value={confirmEmail}
          onChange={(e) => setConfirmEmail(e.target.value)}
          placeholder="メールアドレス"
          className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
        />

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm || submitting}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {submitting ? '処理中…' : '削除を実行'}
          </button>
        </div>
      </div>
    </div>
  )
}
