'use client'

import { use, useState } from 'react'
import Link from 'next/link'
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

  useJobEvents({})

  if (!content) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center px-6">
        <p className="mb-4 text-lg font-medium text-gray-700">コンテンツが見つかりません</p>
        <Link href="/app" className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white">
          ← マイ本棚へ
        </Link>
      </div>
    )
  }

  if (content.status === 'processing') {
    return (
      <div className="mx-auto max-w-2xl px-6 py-10">
        <Link href="/app" className="mb-6 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          ← 本棚へ戻る
        </Link>
        <h1 className="mb-4 text-xl font-bold text-gray-900">{content.title}</h1>
        <JobProgressIndicator
          message={
            content.type === 'web' ? '記事を取得しています' :
            content.type === 'youtube' ? '字幕を取得しています' :
            content.type === 'pdf' ? 'PDFを解析しています' :
            content.type === 'audio' ? '音声を文字起こししています' : '処理中'
          }
        />
      </div>
    )
  }

  if (content.status === 'error') {
    const lastJob = getJobsByContentId(id)[0]
    return (
      <div className="mx-auto max-w-2xl px-6 py-10">
        <Link href="/app" className="mb-6 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          ← 本棚へ戻る
        </Link>
        <h1 className="mb-4 text-xl font-bold text-gray-900">{content.title}</h1>
        <JobErrorRetry
          message={lastJob?.errorMessage ?? '取得に失敗しました'}
          onRetry={() => updateContentStatus(id, 'processing')}
          onManual={() => updateContentStatus(id, 'ready', { bodyText: '' })}
        />
      </div>
    )
  }

  if (!content.bodyText) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center px-6">
        <p className="mb-4 text-lg font-medium text-gray-700">本文テキストがありません</p>
        <Link href="/app" className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white">
          ← マイ本棚へ
        </Link>
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

        {showSummary && (
          <div className="mx-auto max-w-2xl px-4 pb-10">
            <AiSummarySection content={content} monthlyUsage={{ used: 0, limit: 10 }} />
          </div>
        )}
      </div>

      {/* フッター：モバイル最適化 */}
      <footer className="border-t border-gray-100 bg-white px-4 py-3 safe-area-bottom">
        <div className="flex items-center gap-2">
          <Link
            href="/app"
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 active:bg-gray-50"
          >
            ← 本棚へ
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setShowSummary((v) => !v)}
              className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-xs font-semibold text-blue-700 active:bg-blue-100"
            >
              🤖 AI要約
            </button>
            <button
              onClick={handleExport}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-semibold text-gray-600 active:bg-gray-50"
            >
              📥 保存
            </button>
          </div>
        </div>
      </footer>
    </div>
  )
}
