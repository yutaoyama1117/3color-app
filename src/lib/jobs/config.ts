import type { JobType } from '@/types/job'

/** ジョブタイプ別タイムアウト（秒） */
export const JOB_TIMEOUT_SEC: Record<JobType, number> = {
  url_fetch:          30,
  youtube_caption:    60,
  pdf_extract:        60,
  audio_transcribe:   600,
  ai_summary:         120,
  embedding_generate: 30,
  ocr:                30,
}

/** デフォルト最大リトライ回数 */
export const DEFAULT_MAX_RETRIES = 3

/** ポーリング間隔（ミリ秒） */
export const WORKER_POLL_INTERVAL_MS = 5000

/** 指数バックオフ: リトライ回数 → 次の実行までの待機秒数 */
export function retryDelaySeconds(retryCount: number): number {
  const delays = [0, 10, 60]
  return delays[retryCount] ?? 60
}
