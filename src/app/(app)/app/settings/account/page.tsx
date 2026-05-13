import { AccountSettings } from '@/components/organisms/AccountSettings'

export const metadata = { title: 'アカウント | 3色メモ' }

export default function AccountSettingsPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <a href="/app/settings" className="mb-4 inline-block text-sm text-gray-500 hover:text-gray-700">
        ← 設定へ戻る
      </a>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">アカウント</h1>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <AccountSettings />
      </div>
    </div>
  )
}
