'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { SessionList } from './SessionList'
import { DeleteAccountDialog } from './DeleteAccountDialog'

export function AccountSettings() {
  const { user, signOut } = useAuth()
  const [displayName, setDisplayName] = useState(user?.email?.split('@')[0] ?? '')
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [newPwConfirm, setNewPwConfirm] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const email = user?.email ?? 'demo@example.com'

  // 開発モードのダミーセッション
  const sessions = [
    {
      id: 'current',
      device: 'このブラウザ',
      lastActiveAt: new Date(),
      ipAddress: '127.0.0.1',
      isCurrent: true,
    },
  ]

  const handleProfileSave = () => {
    setMessage('✅ プロフィールを保存しました')
    setTimeout(() => setMessage(null), 2000)
  }

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault()
    if (newPw !== newPwConfirm) {
      setMessage('⚠️ 新しいパスワードが一致しません')
      return
    }
    if (newPw.length < 8) {
      setMessage('⚠️ パスワードは8文字以上にしてください')
      return
    }
    setMessage('✅ パスワードを変更しました')
    setCurrentPw('')
    setNewPw('')
    setNewPwConfirm('')
    setTimeout(() => setMessage(null), 3000)
  }

  const handleRevokeOthers = async () => {
    setMessage('✅ 他デバイスからログアウトしました')
    setTimeout(() => setMessage(null), 3000)
  }

  const handleDelete = async () => {
    // 開発モード: 30日後削除のフラグだけ立てて即ログアウト
    setMessage('✅ アカウント削除を受け付けました（30日以内なら復元可能）')
    setDeleteDialogOpen(false)
    await new Promise((r) => setTimeout(r, 1500))
    await signOut()
  }

  return (
    <div className="space-y-8">
      {message && (
        <div className="rounded-lg bg-blue-50 px-4 py-2 text-sm text-blue-800">
          {message}
        </div>
      )}

      {/* プロフィール */}
      <section>
        <h2 className="mb-3 text-base font-semibold text-gray-900">プロフィール</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">メール</label>
            <p className="mt-1 text-sm text-gray-500">{email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">表示名</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <button
            type="button"
            onClick={handleProfileSave}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            保存
          </button>
        </div>
      </section>

      {/* パスワード変更 */}
      <section>
        <h2 className="mb-3 text-base font-semibold text-gray-900">パスワード変更</h2>
        <form onSubmit={handlePasswordChange} className="space-y-3">
          <input
            type="password"
            value={currentPw}
            onChange={(e) => setCurrentPw(e.target.value)}
            placeholder="現在のパスワード"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <input
            type="password"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            placeholder="新しいパスワード（8文字以上）"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <input
            type="password"
            value={newPwConfirm}
            onChange={(e) => setNewPwConfirm(e.target.value)}
            placeholder="新しいパスワード（確認）"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!currentPw || !newPw || !newPwConfirm}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            パスワードを変更
          </button>
        </form>
      </section>

      {/* セッション */}
      <section>
        <SessionList sessions={sessions} onRevokeOthers={handleRevokeOthers} />
      </section>

      {/* アカウント削除 */}
      <section className="border-t border-gray-200 pt-6">
        <h2 className="mb-2 text-base font-semibold text-red-700">アカウント削除</h2>
        <p className="mb-3 text-xs text-gray-500">
          30日間の猶予期間後にすべてのデータが完全削除されます
        </p>
        <button
          type="button"
          onClick={() => setDeleteDialogOpen(true)}
          className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          アカウントを削除
        </button>
      </section>

      <DeleteAccountDialog
        userEmail={email}
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
