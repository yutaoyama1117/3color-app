// 環境変数（Supabase URL/KEY）が未設定でも静的プリレンダリングを避けるため動的レンダリングを強制
export const dynamic = 'force-dynamic'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        {/* ロゴ */}
        <div className="mb-8 text-center">
          <div className="mb-2 text-4xl">📖</div>
          <h1 className="text-xl font-bold text-gray-900">３色ボールペン読書メモ</h1>
          <p className="mt-1 text-sm text-gray-500">読んだ知識をカラーで整理する</p>
        </div>

        {/* カード */}
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          {children}
        </div>
      </div>
    </div>
  )
}
