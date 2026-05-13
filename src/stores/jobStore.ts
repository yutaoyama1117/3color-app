import { create } from 'zustand'
import type { JobData, CreateJobInput } from '@/types/job'

interface JobStore {
  jobs: JobData[]
  /** ジョブを登録して ID を返す */
  enqueue: (input: CreateJobInput) => string
  /** ジョブのステータスを更新 */
  updateJob: (id: string, patch: Partial<JobData>) => void
  /** ID でジョブを取得 */
  getJob: (id: string) => JobData | undefined
  /** content_id ペイロードで関連ジョブを取得 */
  getJobsByContentId: (contentId: string) => JobData[]
  /** SSE イベント購読者（コールバック登録） */
  listeners: Array<(event: JobSsePayload) => void>
  subscribe: (fn: (event: JobSsePayload) => void) => () => void
  emit: (event: JobSsePayload) => void
}

export interface JobSsePayload {
  event: 'job.completed' | 'job.error' | 'related_link.suggested'
  data: Record<string, unknown>
}

export const useJobStore = create<JobStore>((set, get) => ({
  jobs: [],
  listeners: [],

  enqueue: (input) => {
    const id = `job-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const now = new Date()
    const job: JobData = {
      id,
      userId: 'demo-user',
      jobType: input.jobType,
      status: 'queued',
      payload: input.payload,
      retryCount: 0,
      maxRetries: input.maxRetries ?? 3,
      createdAt: now,
    }
    set((state) => ({ jobs: [job, ...state.jobs] }))
    return id
  },

  updateJob: (id, patch) => {
    set((state) => ({
      jobs: state.jobs.map((j) => (j.id === id ? { ...j, ...patch } : j)),
    }))
  },

  getJob: (id) => get().jobs.find((j) => j.id === id),

  getJobsByContentId: (contentId) =>
    get().jobs.filter((j) => j.payload['contentId'] === contentId),

  subscribe: (fn) => {
    set((state) => ({ listeners: [...state.listeners, fn] }))
    return () => {
      set((state) => ({ listeners: state.listeners.filter((l) => l !== fn) }))
    }
  },

  emit: (event) => {
    get().listeners.forEach((fn) => fn(event))
  },
}))

/** ジョブを実行してステータスを更新するヘルパー（クライアント側デモ処理用） */
export async function runJobInStore(
  jobId: string,
  handler: () => Promise<Record<string, unknown>>,
): Promise<void> {
  const store = useJobStore.getState()
  store.updateJob(jobId, { status: 'running', startedAt: new Date() })
  try {
    const result = await handler()
    store.updateJob(jobId, { status: 'done', result, finishedAt: new Date() })
    const job = store.getJob(jobId)
    if (job) {
      store.emit({
        event: 'job.completed',
        data: {
          jobId,
          jobType: job.jobType,
          status: 'done',
          contentId: job.payload['contentId'],
        },
      })
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : '処理に失敗しました'
    const job = store.getJob(jobId)
    const retryCount = (job?.retryCount ?? 0) + 1
    const maxRetries = job?.maxRetries ?? 3
    if (retryCount >= maxRetries) {
      store.updateJob(jobId, {
        status: 'error',
        errorMessage: message,
        finishedAt: new Date(),
        retryCount,
      })
      if (job) {
        store.emit({ event: 'job.error', data: { jobId, jobType: job.jobType, error: message } })
      }
    } else {
      store.updateJob(jobId, { status: 'queued', retryCount })
    }
  }
}
