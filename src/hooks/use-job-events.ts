'use client'

import { useEffect, useCallback } from 'react'
import { useJobStore } from '@/stores/jobStore'
import type { JobSsePayload } from '@/stores/jobStore'

interface UseJobEventsOptions {
  onCompleted?: (data: Record<string, unknown>) => void
  onError?: (data: Record<string, unknown>) => void
  onRelatedSuggested?: (data: Record<string, unknown>) => void
}

/**
 * ジョブ完了イベントを購読するフック。
 * 開発モード: Zustand jobStore の emit を使用（SSEなし）。
 * 本番モード: /api/v1/events の SSE を購読（切断時は3秒後に再接続、最大5回）。
 */
export function useJobEvents(options: UseJobEventsOptions = {}) {
  const { subscribe } = useJobStore()

  const handleEvent = useCallback(
    (event: JobSsePayload) => {
      if (event.event === 'job.completed') options.onCompleted?.(event.data)
      if (event.event === 'job.error') options.onError?.(event.data)
      if (event.event === 'related_link.suggested') options.onRelatedSuggested?.(event.data)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  // クライアント側 jobStore のイベント購読
  useEffect(() => {
    const unsub = subscribe(handleEvent)
    return unsub
  }, [subscribe, handleEvent])

  // 本番 SSE 購読（Supabase設定済み時のみ）
  useEffect(() => {
    const supabaseConfigured =
      typeof window !== 'undefined' &&
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_URL !== 'http://localhost:54321'

    if (!supabaseConfigured) return

    let retryCount = 0
    const maxRetries = 5
    let es: EventSource | null = null

    const connect = () => {
      es = new EventSource('/api/v1/events')

      es.addEventListener('job.completed', (e) => {
        try {
          options.onCompleted?.(JSON.parse(e.data))
        } catch {}
      })

      es.addEventListener('job.error', (e) => {
        try {
          options.onError?.(JSON.parse(e.data))
        } catch {}
      })

      es.addEventListener('related_link.suggested', (e) => {
        try {
          options.onRelatedSuggested?.(JSON.parse(e.data))
        } catch {}
      })

      es.onerror = () => {
        es?.close()
        if (retryCount < maxRetries) {
          retryCount++
          setTimeout(connect, 3000)
        }
      }

      es.addEventListener('connected', () => {
        retryCount = 0
      })
    }

    connect()
    return () => es?.close()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
