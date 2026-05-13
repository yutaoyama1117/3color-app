'use client'

import { useJobStore } from '@/stores/jobStore'
import type { JobData } from '@/types/job'

/** ジョブIDでジョブ状態を取得するフック */
export function useJobStatus(jobId: string | null): JobData | undefined {
  const { getJob } = useJobStore()
  if (!jobId) return undefined
  return getJob(jobId)
}

/** コンテンツIDに紐づく最新ジョブを取得するフック */
export function useContentJobStatus(contentId: string): JobData | undefined {
  const { getJobsByContentId } = useJobStore()
  const jobs = getJobsByContentId(contentId)
  // 最新のジョブを返す（createdAt 降順の先頭）
  return jobs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]
}
