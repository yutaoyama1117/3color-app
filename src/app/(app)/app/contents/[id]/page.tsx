'use client'

import { use, useState } from 'react'
import { useContentStore } from '@/stores/contentStore'
import { useMarkStore } from '@/stores/markStore'
import { useJobStore } from '@/stores/jobStore'
import { MarkingViewer } from '@/components/organisms/MarkingViewer'
import { AiSummarySection } from '@/components/organisms/AiSummarySection'
import { JobProgressIndicator } from '@/components/molecules/JobProgressIndicator'
import { JobErrorRetry } from '@/components/molecules/JobErrorRetry'
import { toMarkdown, downloadMarkdown } from '@/lib/export/toMarkdown'
import { useJobEvents } from '@/hooks/use-job-events'

interface Props {
  params: Promise<{ id: string }>
}

export default function ContentDetailPage({ params }: Props) {
  const { id } = use(params)
  const { getContent, updateContentStatus } = useContentStore()
  const { marks } = useMarkStore()
  const { getJobsByContentId } = useJobStore()
  const [showSummary, setShowSummary] = useState(false)
  const content = getContent(id)

  // SSE / 内部イベントを購読してジョブ完了時に画面更新を促す
  useJobEvents({})

  if (!content) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <p className="mb-2 text-lg font-medium text-gray-700">
          コンテンツが見つかりません
        </p>
        <a href="/app" className="text-sm text-blue-600 hover:underline">
          マイ本棚へ戻る
        </a>
      </div>
    )
  }

  // 処理中表示
  if (content.status === 'processing') {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <a href="/app" className="mb-4 inline-block text-sm text-gray-500 hover:text-gray-700">
          ← マイ本棚へ戻る
        </a>
        <h1 className="mb-2 text-xl font-semibold text-gray-900">{content.title}</h1>
        <JobProgressIndicator
          message={
            content.type === 'web'
              ? '記事を取得しています'
              : content.type === 'youtube'
                ? '字幕を取得しています'
                : content.type === 'pdf'
                  ? 'PDFを解析しています'
                  : content.type === 'audio'
                    ? '音声を文字起こししています'
                    : '処理中'
          }
        />
      </div>
    )
  }

  // エラー表示
  if (content.status === 'error') {
    const lastJob = getJobsByContentId(id)[0]
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <a href="/app" className="mb-4 inline-block text-sm text-gray-500 hover:text-gray-700">
          ← マイ本棚へ戻る
        </a>
        <h1 className="mb-2 text-xl font-semibold text-gray-900">{content.title}</h1>
        <JobErrorRetry
          message={lastJob?.errorMessage ?? '取得に失敗しました'}
          onRetry={() => {
            // ジョブ再投入
            updateContentStatus(id, 'processing')
          }}
          onManual={() => {
            updateContentStatus(id, 'ready', { bodyText: '' })
          }}
        />
      </div>
    )
  }

  if (!content.bodyText) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <p className="mb-2 text-lg font-medium text-gray-700">
          本文テキストがありません
        </p>
        <a href="/app" className="text-sm text-blue-600 hover:underline">
          マイ本棚へ戻る
        </a>
      </div>
    )
  }

  const handleExport = () => {
    const md = toMarkdown(content, marks)
    const safeName = content.title.replace(/[\\/:*?"<>|]/g, '_').slice(0, 50)
    downloadMarkdown(`${safeName}.md`, md)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-auto">
        <MarkingViewer
          contentId={content.id}
          title={content.title}
          bodyText={content.bodyText}
        />

        {/* AI要約セクション切替 */}
        {showSummary && (
          <div className="mx-auto max-w-3xl px-6 pb-10">
            <AiSummarySection content={content} monthlyUsage={{ used: 0, limit: 10 }} />
          </div>
        )}
      </div>

      {/* フッター */}
      <footer className="border-t border-gray-100 bg-gray-50 px-6 py-2">
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <a href="/app" className="hover:text-gray-700">
            ← 本棚へ戻る
          </a>
          <span className="inline-block rounded-sm border-b-2 border-red-500 bg-red-200/60 px-1">
            🔴 客観的最重要
          </span>
          <span className="inline-block rounded-sm border-b-2 border-blue-500 bg-blue-200/60 px-1">
            🔵 客観的重要
          </span>
          <span className="inline-block rounded-sm border-b-2 border-green-500 bg-green-200/60 px-1">
            🟢 個人的気づき
          </span>
          <button
            onClick={() => setShowSummary((v) => !v)}
            className="ml-auto rounded-md border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
          >
            {showSummary ? '🤖 AI要約を隠す' : '🤖 AI要約を見る'}
          </button>
          <button
            onClick={handleExport}
            className="rounded-md border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            📥 エクスポート
          </button>
        </div>
      </footer>
    </div>
  )
}
