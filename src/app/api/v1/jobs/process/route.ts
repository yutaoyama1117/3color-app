import { NextResponse } from 'next/server'
import { processJob } from '@/lib/jobs/processor'
import type { JobData } from '@/types/job'

/**
 * GET /api/v1/jobs/process
 * ジョブワーカーを手動トリガーするエンドポイント。
 * 本番: Vercel Cron Jobs から定期呼び出し。
 * 開発: ブラウザまたは curl から手動実行。
 */
export async function GET() {
  // Supabase 未設定時はインメモリ処理をスキップして OK を返す
  // （クライアント側の jobStore が直接処理を担う）
  return NextResponse.json({ message: 'worker triggered (demo mode: client-side processing)' })
}

/**
 * POST /api/v1/jobs/process
 * ジョブを直接実行する（開発用・テスト用）。
 * ボディ: { job_type, payload }
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { job_type: string; payload: Record<string, unknown> }
    const { job_type, payload } = body

    if (!job_type || !payload) {
      return NextResponse.json({ error: 'job_type と payload が必要です' }, { status: 400 })
    }

    const stubJob: JobData = {
      id: `test-${Date.now()}`,
      userId: 'demo-user',
      jobType: job_type as JobData['jobType'],
      status: 'running',
      payload,
      retryCount: 0,
      maxRetries: 3,
      createdAt: new Date(),
      startedAt: new Date(),
    }

    const result = await processJob(stubJob.jobType, payload)
    return NextResponse.json({ status: 'done', result })
  } catch (err) {
    const message = err instanceof Error ? err.message : '処理に失敗しました'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
