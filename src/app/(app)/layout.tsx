export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppHeader, AppTabBar } from '@/components/organisms/AppHeader'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Supabase 未設定時（ローカル開発）はセッションチェックをスキップ
  const supabaseConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'http://localhost:54321'

  if (supabaseConfigured) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')
  }

  return (
    <div className="flex h-dvh flex-col bg-[#f2f2f7]">
      <AppHeader />
      <main className="flex-1 overflow-auto">{children}</main>
      <AppTabBar />
    </div>
  )
}
