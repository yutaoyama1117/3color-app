import { AuthForm } from '@/components/organisms/AuthForm'

export const metadata = { title: 'ログイン | ３色ボールペン読書メモ' }

export default function LoginPage() {
  return (
    <>
      <h2 className="mb-6 text-center text-lg font-semibold text-gray-900">ログイン</h2>
      <AuthForm mode="login" />
    </>
  )
}
