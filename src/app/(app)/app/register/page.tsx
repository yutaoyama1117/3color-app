import { ContentRegisterForm } from '@/components/organisms/ContentRegisterForm'

export const metadata = { title: 'コンテンツを追加 | 3色メモ' }

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-4 sm:px-6">
      <div className="mx-0 overflow-hidden rounded-xl bg-white p-5 sm:p-6">
        <ContentRegisterForm />
      </div>
    </div>
  )
}
