import Link from 'next/link'
import { ContentRegisterForm } from '@/components/organisms/ContentRegisterForm'

export const metadata = { title: 'コンテンツを追加 | 3色メモ' }

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <Link
          href="/app"
          className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          ← マイ本棚へ戻る
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">コンテンツを追加</h1>
        <p className="mt-1 text-sm text-gray-500">
          本・記事・動画のテキストを登録してマーキングできます
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <ContentRegisterForm />
      </div>
    </div>
  )
}
