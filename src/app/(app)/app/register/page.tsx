import { ContentRegisterForm } from '@/components/organisms/ContentRegisterForm'

export const metadata = { title: 'コンテンツを追加 | ３色ボールペン読書メモ' }

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-8">
        <a
          href="/app"
          className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          ← マイ本棚へ戻る
        </a>
        <h1 className="text-2xl font-bold text-gray-900">コンテンツを追加</h1>
        <p className="mt-1 text-sm text-gray-500">
          本・記事・動画などのテキストを登録してマーキングできます
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <ContentRegisterForm />
      </div>
    </div>
  )
}
