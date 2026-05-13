export type JobType =
  | 'url_fetch'
  | 'youtube_caption'
  | 'pdf_extract'
  | 'audio_transcribe'
  | 'ai_summary'
  | 'embedding_generate'
  | 'ocr'

export type JobStatus = 'queued' | 'running' | 'done' | 'error' | 'cancelled'

export interface JobData {
  id: string
  userId: string
  jobType: JobType
  status: JobStatus
  payload: Record<string, unknown>
  result?: Record<string, unknown>
  errorMessage?: string
  retryCount: number
  maxRetries: number
  createdAt: Date
  startedAt?: Date
  finishedAt?: Date
}

/** ジョブ作成時の入力 */
export interface CreateJobInput {
  jobType: JobType
  payload: Record<string, unknown>
  maxRetries?: number
}

/** API レスポンス */
export interface JobResponse {
  jobId: string
  status: JobStatus
}

/** SSE イベント */
export type JobSseEvent =
  | { event: 'job.completed'; data: { jobId: string; jobType: JobType; status: 'done'; contentId?: string } }
  | { event: 'job.error'; data: { jobId: string; jobType: JobType; error: string } }
  | { event: 'related_link.suggested'; data: { fromMarkId: string; suggestions: RelatedMarkSuggestion[] } }

export interface RelatedMarkSuggestion {
  markId: string
  similarity: number
  contentTitle: string
}
