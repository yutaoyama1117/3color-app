import { AuthForm } from '@/components/organisms/AuthForm'

export const metadata = { title: '新規登録 | ３色ボールペン読書メモ' }

export default function SignupPage() {
  return (
    <>
      <h2 className="mb-6 text-center text-lg font-semibold text-gray-900">アカウント作成</h2>
      <AuthForm mode="signup" />
    </>
  )
}
