import Link from 'next/link'

export const metadata = { title: '設定 | 3色メモ' }

const SETTINGS_LINKS = [
  { href: '/app/settings/account', icon: '👤', label: 'アカウント', description: 'プロフィール・パスワード・セッション' },
  { href: '/app/settings/review', icon: '📖', label: '復習設定', description: '1日の上限・色フィルター・リマインダー' },
  { href: '/app/settings/obsidian', icon: '🔗', label: 'Obsidian連携', description: 'Vault への自動書き出し（Mac版のみ）' },
  { href: '/app/settings/export', icon: '📦', label: 'データエクスポート', description: '全データJSON+ZIP出力' },
  { href: '/app/settings/appearance', icon: '🎨', label: '外観', description: 'テーマ・フォントサイズ・言語' },
]

export default function SettingsHubPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">設定</h1>

      <nav className="space-y-2">
        {SETTINGS_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-blue-300 hover:shadow-sm"
          >
            <span className="text-2xl">{link.icon}</span>
            <div className="flex-1">
              <div className="font-medium text-gray-900">{link.label}</div>
              <div className="text-xs text-gray-500">{link.description}</div>
            </div>
            <span className="text-gray-400">→</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
