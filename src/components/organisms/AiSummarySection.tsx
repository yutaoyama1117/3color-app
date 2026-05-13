'use client'

import { useState } from 'react'
import { useMarkStore } from '@/stores/markStore'
import type { ContentData } from '@/types/content'
import type { AiSummaryResult } from '@/validations/ai-summary'

interface AiSummarySectionProps {
  content: ContentData
  /** 既存のサマリ（保存済み） */
  initialSummary?: AiSummaryResult | null
  /** AI要約使用回数（今月） */
  monthlyUsage?: { used: number; limit: number }
}

export function AiSummarySection({
  content,
  initialSummary = null,
  monthlyUsage,
}: AiSummarySectionProps) {
  const { marks } = useMarkStore()
  const [summary, setSummary] = useState<AiSummaryResult | null>(initialSummary)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [truncated, setTruncated] = useState(false)

  const contentMarks = marks.filter((m) => m.contentId === content.id)
  const redMarks = contentMarks.filter((m) => m.color === 'red')
  const blueMarks = contentMarks.filter((m) => m.color === 'blue')
  const greenMarks = contentMarks.filter((m) => m.color === 'green')
  const totalMarks = contentMarks.length

  const limitReached = monthlyUsage ? monthlyUsage.used >= monthlyUsage.limit : false

  const handleGenerate = async () => {
    if (totalMarks === 0 || isGenerating) return

    if (summary && !confirm('既存の要約が上書きされます。続行しますか？')) {
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const res = await fetch(`/api/v1/contents/${content.id}/summary/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: content.title,
          author: content.author,
          redMarks: redMarks.map((m) => ({ text: m.markedText, comment: m.comment })),
          blueMarks: blueMarks.map((m) => ({ text: m.markedText, comment: m.comment })),
          greenMarks: greenMarks.map((m) => ({ text: m.markedText, comment: m.comment })),
        }),
      })

      const data = (await res.json()) as {
        summary?: AiSummaryResult
        truncated?: boolean
        error?: string
      }

      if (!res.ok || data.error) {
        setError(data.error ?? '要約の生成に失敗しました')
        return
      }

      if (data.summary) {
        setSummary(data.summary)
        setTruncated(!!data.truncated)
      }
    } catch {
      setError('ネットワークエラーが発生しました')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white">
      {/* ヘッダー */}
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          🤖 AI要約
          {monthlyUsage && (
            <span className="text-xs font-normal text-gray-400">
              （今月 {monthlyUsage.used}/{monthlyUsage.limit} 回使用）
            </span>
          )}
        </h2>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={totalMarks === 0 || isGenerating || limitReached}
          title={
            totalMarks === 0
              ? 'マークを追加してから生成してください'
              : limitReached
                ? '今月のAI要約回数が上限に達しました'
                : ''
          }
          className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isGenerating
            ? '生成中…'
            : summary
              ? '🔄 再生成'
              : '✨ AI要約を生成'}
        </button>
      </div>

      <div className="space-y-4 p-5">
        {/* エラー */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            ⚠️ {error}
          </div>
        )}

        {/* 切り捨て警告 */}
        {truncated && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-700">
            ※ マーク数が多いため、青・緑は新しい順に一部のみ使用されました
          </div>
        )}

        {/* 生成中スピナー */}
        {isGenerating && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="mb-3 h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
            <p className="text-sm text-gray-600">要約を生成しています...</p>
          </div>
        )}

        {/* 要約表示 */}
        {!isGenerating && summary && (
          <div className="space-y-4">
            {/* キーインサイト */}
            <div className="rounded-lg bg-amber-50 p-4 text-center">
              <p className="text-base font-semibold text-amber-900">
                💡「{summary.key_insight}」
              </p>
            </div>

            {/* 色別要約 */}
            <SummaryBlock title="🔴 最重要ポイント" content={summary.red_summary} accent="red" />
            <SummaryBlock title="🔵 重要ポイント" content={summary.blue_summary} accent="blue" />
            <SummaryBlock
              title="🟢 あなたの気づき"
              content={summary.green_summary}
              accent="green"
            />

            {/* 総括 */}
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
              <h3 className="mb-2 text-sm font-medium text-gray-700">📝 総括</h3>
              <p className="text-sm leading-relaxed text-gray-600">{summary.overall}</p>
            </div>
          </div>
        )}

        {/* 未生成 */}
        {!isGenerating && !summary && (
          <div className="py-8 text-center text-sm text-gray-400">
            {totalMarks === 0
              ? '本文をマーキングするとAI要約が生成できます'
              : `現在 ${totalMarks} 件のマークがあります。「AI要約を生成」をクリックしてください。`}
          </div>
        )}
      </div>
    </section>
  )
}

function SummaryBlock({
  title,
  content,
  accent,
}: {
  title: string
  content: string
  accent: 'red' | 'blue' | 'green'
}) {
  const accentClass = {
    red: 'border-red-200 bg-red-50',
    blue: 'border-blue-200 bg-blue-50',
    green: 'border-green-200 bg-green-50',
  }[accent]

  return (
    <div className={`rounded-lg border p-4 ${accentClass}`}>
      <h3 className="mb-2 text-sm font-medium text-gray-700">{title}</h3>
      <p className="text-sm leading-relaxed text-gray-600">{content}</p>
    </div>
  )
}
