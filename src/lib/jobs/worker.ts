import { JOB_TIMEOUT_SEC, retryDelaySeconds } from './config'
import { processJob } from './processor'
import type { JobData } from '@/types/job'

/**
 * ジョブ一覧から実行対象を選択して処理する。
 * Vercel Cron / 手動トリガーから /api/v1/jobs/process 経由で呼ばれる。
 * DB 未接続時はインメモリジョブストアで動作する。
 */
export async function runWorkerCycle(
  getQueuedJobs: () => Promise<JobData[]>,
  updateJob: (id: string, patch: Partial<JobData>) => Promise<void>,
  emitCompleted: (job: JobData, result: Record<string, unknown>) => Promise<void>,
  emitError: (job: JobData, message: string) => Promise<void>,
): Promise<{ processed: number; errors: number }> {
  const queued = await getQueuedJobs()
  let processed = 0
  let errors = 0

  for (const job of queued) {
    const timeoutMs = JOB_TIMEOUT_SEC[job.jobType] * 1000
    const startedAt = new Date()

    await updateJob(job.id, { status: 'running', startedAt })

    try {
      const result = await Promise.race([
        processJob(job.jobType, job.payload),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('タイムアウト')), timeoutMs),
        ),
      ])

      await updateJob(job.id, { status: 'done', result, finishedAt: new Date() })
      await emitCompleted(job, result)
      processed++
    } catch (err) {
      const message = err instanceof Error ? err.message : '処理に失敗しました'
      const retryCount = job.retryCount + 1
      errors++

      if (retryCount >= job.maxRetries) {
        await updateJob(job.id, {
          status: 'error',
          errorMessage: message,
          finishedAt: new Date(),
          retryCount,
        })
        await emitError(job, message)
      } else {
        // 指数バックオフでキューに戻す
        const delaySec = retryDelaySeconds(retryCount)
        await new Promise((r) => setTimeout(r, delaySec * 1000))
        await updateJob(job.id, { status: 'queued', retryCount })
      }
    }
  }

  return { processed, errors }
}
