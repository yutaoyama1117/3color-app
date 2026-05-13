import { ObsidianSettings } from '@/components/organisms/ObsidianSettings'

export const metadata = { title: 'Obsidian連携 | 3色メモ' }

export default function ObsidianSettingsPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <a href="/app/settings" className="mb-4 inline-block text-sm text-gray-500 hover:text-gray-700">
        ← 設定へ戻る
      </a>
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Obsidian連携</h1>
      <p className="mb-6 text-sm text-gray-500">
        マーキング内容を Obsidian Vault に Markdown として自動書き出します
      </p>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <ObsidianSettings />
      </div>
    </div>
  )
}
