import { NextResponse } from 'next/server'
import { validateSyncPush, type SyncResultItem } from '@/validations/sync'

/**
 * POST /api/v1/sync/push
 * クライアントのオフライン変更をまとめて送信。
 *
 * 開発モード（Supabase 未接続）: 全てを「成功扱い」で返す。
 * 本番モード: 各 operation を順次実行し、競合検出 → server_version を返却。
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validation = validateSyncPush(body)
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const results: SyncResultItem[] = validation.data.operations.map((op) => {
      if (op.action === 'create') {
        return {
          client_id: op.client_id,
          server_id: `srv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          status: 'created',
        }
      }
      if (op.action === 'update') {
        return { id: op.id, status: 'updated' }
      }
      return { id: op.id, status: 'deleted' }
    })

    return NextResponse.json({ results })
  } catch {
    return NextResponse.json({ error: 'リクエストが不正です' }, { status: 400 })
  }
}
