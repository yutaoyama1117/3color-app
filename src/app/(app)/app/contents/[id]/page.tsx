'use client'

import { use, useEffect } from 'react'
import Link from 'next/link'
import { useContentStore } from '@/stores/contentStore'
import { useMarkStore } from '@/stores/markStore'
import { useJobStore } from '@/stores/jobStore'
import { MarkingViewer } from '@/components/organisms/MarkingViewer'
import { JobProgressIndicator } from '@/components/molecules/JobProgressIndicator'
import { JobErrorRetry } from '@/components/molecules/JobErrorRetry'
import { BookMetaCard } from '@/components/organisms/BookMetaCard'
import { toMarkdown, downloadMarkdown } from '@/lib/export/toMarkdown'
import { useJobEvents } from '@/hooks/use-job-events'

interface Props {
  params: Promise<{ id: string }>
}

export default function ContentDetailPage({ params }: Props) {
  const { id } = use(params)
  const { getContent, updateContentStatus, addTextSection, migrateToSections } = useContentStore()
  const { marks } = useMarkStore()
  const { getJobsByContentId } = useJobStore()
  const content = getContent(id)

  useJobEvents({})

  // 旧bodyTextからtextSectionsへの自動移行（textSectionsが未定義の場合のみ）
  useEffect(() => {
    if (content && content.bodyText && content.textSections === undefined) {
      migrateToSections(id)
    }
  }, [content, id, migrateToSections])

  if (!content) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center px-6">
        <p className="mb-4 text-lg font-medium text-gray-700">コンテンツが見つかりません</p>
        <Link href="/app" className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white">
          本棚へ戻る
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

  const contentMarks = marks.filter((m) => m.contentId === id)

  const handleExport = () => {
    const md = toMarkdown(content, marks)
    const safeName = content.title.replace(/[\\/:*?"<>|]/g, '_').slice(0, 50)
    downloadMarkdown(`${safeName}.md`, md)
  }

  /** テキスト追記（addTextSection使用） */
  const handleAppendText = (text: string, label?: string) => {
    addTextSection(id, text, label)
  }

  return (
    <div className="flex h-full flex-col">
      {/* iOS NavBar風 スティッキーヘッダー */}
      <header className="sticky top-0 z-30 border-b border-gray-200/60 bg-[#f2f2f7]/80 backdrop-blur-xl safe-area-top">
        <div className="flex items-center justify-between px-4 py-2">
          {/* 左: 戻るボタン */}
          <Link
            href="/app"
            className="flex items-center gap-0.5 text-[17px] font-normal text-blue-500 active:opacity-60"
          >
            <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            本棚
          </Link>

          {/* 中央: タイトル */}
          <h1 className="mx-3 flex-1 truncate text-center text-[17px] font-semibold text-gray-900">
            {content.title}
          </h1>

          {/* 右: Markdown保存ボタン */}
          <button
            type="button"
            onClick={handleExport}
            className="flex h-8 w-8 items-center justify-center rounded-full active:bg-gray-200/60"
            aria-label="Markdown保存"
          >
            <svg className="h-[20px] w-[20px] text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
        </div>
      </header>

      {/* メインコンテンツ */}
      <div className="flex-1 overflow-auto">
        <MarkingViewer
          contentId={content.id}
          title={content.title}
          bodyText={content.bodyText ?? ''}
          contentType={content.type}
          textSections={content.textSections}
          onAppendText={handleAppendText}
        />

        {/* 書籍情報カード（本タイプのみ表示） */}
        {content.type === 'book' && (
          <div className="mx-auto max-w-2xl px-4 pb-8">
            <BookMetaCard content={content} />
          </div>
        )}
      </div>
    </div>
  )
}
