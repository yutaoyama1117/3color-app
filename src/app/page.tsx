import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // ログイン済み → アプリへ、未ログイン → ログインページへ
  if (user) redirect('/app')
  else redirect('/login')
}
