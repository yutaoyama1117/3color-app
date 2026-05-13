'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useContentStore } from '@/stores/contentStore'
import { useJobStore, runJobInStore } from '@/stores/jobStore'
import { FileUploadArea } from '@/components/molecules/FileUploadArea'
import { CameraOcrButton } from '@/components/molecules/CameraOcrButton'
import type { ContentType } from '@/types/content'

type TabMode = 'text' | 'url' | 'file'

const TYPE_OPTIONS: {
  value: ContentType
  label: string
  icon: string
  tab: TabMode
}[] = [
  { value: 'book',    label: '書籍',     icon: '📖', tab: 'text' },
  { value: 'web',     label: 'Web記事',  icon: '🌐', tab: 'url' },
  { value: 'youtube', label: 'YouTube',  icon: '▶️', tab: 'url' },
  { value: 'pdf',     label: 'PDF',      icon: '📄', tab: 'file' },
  { value: 'audio',   label: '音声',     icon: '🎙️', tab: 'file' },
]

export function ContentRegisterForm() {
  const router = useRouter()
  const { addContent, updateContentStatus } = useContentStore()
  const { enqueue } = useJobStore()

  const [type, setType] = useState<ContentType>('book')
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [bodyText, setBodyText] = useState('')
  const [url, setUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)

  const [isFetching, setIsFetching] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [costEstimate, setCostEstimate] = useState<string | null>(null)

  const pendingJobId = useRef<string | null>(null)

  // 現在の種別に対応するタブ
  const currentTab: TabMode =
    TYPE_OPTIONS.find((o) => o.value === type)?.tab ?? 'text'

  const handleTypeChange = (newType: ContentType) => {
    setType(newType)
    setFetchError(null)
  }

  // URL から本文を取得（Web/YouTube）
  const handleFetchUrl = async () => {
    if (!url.trim()) return
    setIsFetching(true)
    setFetchError(null)
    try {
      const res = await fetch('/api/fetch-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })
      const data = (await res.json()) as { title?: string; content?: string; error?: string }
      if (!res.ok || data.error) {
        setFetchError(data.error ?? '取得に失敗しました')
        return
      }
      if (data.title) setTitle(data.title)
      if (data.content) setBodyText(data.content)
    } catch {
      setFetchError('ネットワークエラーが発生しました')
    } finally {
      setIsFetching(false)
    }
  }

  // 音声ファイルのコスト見積もり取得
  const handleAudioFileSelected = async (selectedFile: File) => {
    setFile(selectedFile)
    if (type !== 'audio') return
    try {
      // 仮の見積もり: ファイルサイズ(MB)から概算
      const sizeMb = selectedFile.size / 1024 / 1024
      const estMinutes = Math.ceil(sizeMb * 0.5) // rough estimate
      const estJpy = Math.ceil(estMinutes * 0.9)
      setCostEstimate(`約${estMinutes}分 / 推定コスト ${estJpy}円`)
    } catch {
      setCostEstimate(null)
    }
  }

  const canSubmit =
    title.trim().length > 0 &&
    (currentTab === 'text'
      ? bodyText.trim().length > 0
      : currentTab === 'url'
        ? url.trim().length > 0
        : file !== null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit || isSubmitting) return
    setIsSubmitting(true)

    // コンテンツを即座に登録（楽観的UI）
    const contentId = addContent({
      type,
      title: title.trim(),
      author: author.trim() || undefined,
      sourceUrl: currentTab === 'url' ? url.trim() : undefined,
      bodyText: currentTab === 'text' ? bodyText.trim() : undefined,
      // ファイル系・URLジョブ系は status='processing' で登録
      status: currentTab === 'text' ? 'ready' : 'processing',
    })

    // テキスト直接入力の場合は本棚へ（マーキングは任意）
    if (currentTab === 'text') {
      router.push(`/app?added=${contentId}`)
      return
    }

    // URL / ファイル系はジョブをエンキュー → バックグラウンド処理
    let jobType: 'url_fetch' | 'youtube_caption' | 'pdf_extract' | 'audio_transcribe'
    let payload: Record<string, unknown> = { contentId }

    if (type === 'web') {
      jobType = 'url_fetch'
      payload = { contentId, url: url.trim() }
    } else if (type === 'youtube') {
      jobType = 'youtube_caption'
      payload = { contentId, url: url.trim() }
    } else if (type === 'pdf') {
      jobType = 'pdf_extract'
      payload = { contentId, filePath: file?.name }
    } else {
      jobType = 'audio_transcribe'
      payload = { contentId, filePath: file?.name }
    }

    const jobId = enqueue({ jobType, payload })
    pendingJobId.current = jobId

    // バックグラウンドでジョブを処理
    runJobInStore(jobId, async () => {
      const res = await fetch('/api/v1/jobs/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_type: jobType, payload }),
      })
      const data = (await res.json()) as { result?: Record<string, unknown>; error?: string }
      if (!res.ok || data.error) throw new Error(data.error ?? '処理に失敗しました')

      // 結果をコンテンツに反映
      const result = data.result ?? {}
      if (result['content']) {
        updateContentStatus(contentId, 'ready', {
          bodyText: result['content'] as string,
          title: (result['title'] as string | undefined) ?? title.trim(),
        })
      }
      return result
    }).catch(() => {
      updateContentStatus(contentId, 'error')
    })

    router.push(`/app/contents/${contentId}`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 種別選択 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">種別</label>
        <div className="flex flex-wrap gap-2">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleTypeChange(opt.value)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors ${
                type === opt.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <span>{opt.icon}</span>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* URL 入力（Web/YouTube） */}
      {currentTab === 'url' && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            URL <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={
                type === 'youtube'
                  ? 'https://www.youtube.com/watch?v=...'
                  : 'https://example.com/article'
              }
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {type === 'web' && (
              <button
                type="button"
                onClick={handleFetchUrl}
                disabled={!url.trim() || isFetching}
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
              >
                {isFetching ? '取得中…' : 'プレビュー取得'}
              </button>
            )}
          </div>
          {type === 'youtube' && (
            <p className="text-xs text-blue-600">
              💡 字幕からテキストが自動取得されます（YOUTUBE_DATA_API_KEY 設定時）
            </p>
          )}
          {type === 'web' && (
            <p className="text-xs text-blue-600">
              💡 URLを貼るだけで本文テキストが自動取得されます
            </p>
          )}
          {fetchError && <p className="text-sm text-red-500">{fetchError}</p>}
        </div>
      )}

      {/* ファイルアップロード（PDF/音声） */}
      {currentTab === 'file' && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            ファイル <span className="text-red-500">*</span>
          </label>
          <FileUploadArea
            accept={type === 'pdf' ? '.pdf,application/pdf' : '.mp3,.m4a,.wav,.ogg,audio/*'}
            maxSizeMb={type === 'pdf' ? 50 : 200}
            onFileSelected={type === 'audio' ? handleAudioFileSelected : setFile}
          />
          {costEstimate && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
              ⚠️ 文字起こしの推定: {costEstimate}
              <br />
              <span className="text-xs">登録後にコスト確認ダイアログが表示されます</span>
            </div>
          )}
          {type === 'pdf' && (
            <p className="text-xs text-blue-600">
              💡 PDFからテキストを自動抽出します（最大50MB）
            </p>
          )}
          {type === 'audio' && (
            <p className="text-xs text-blue-600">
              💡 OpenAI Whisperで音声を自動文字起こしします（最大200MB）
            </p>
          )}
        </div>
      )}

      {/* タイトル */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          タイトル{' '}
          {currentTab !== 'text' && (
            <span className="text-xs font-normal text-gray-400">（URL/ファイル取得後に自動補完）</span>
          )}
          {currentTab === 'text' && <span className="text-red-500">*</span>}
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例：FACTFULNESS"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* 著者（任意） */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          著者・発行者
          <span className="ml-1 text-xs text-gray-400">（任意）</span>
        </label>
        <input
          type="text"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="例：ハンス・ロスリング"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* 本文テキスト（テキストタブのみ表示） */}
      {currentTab === 'text' && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            本文テキスト <span className="text-red-500">*</span>
          </label>

          {/* 書籍のみ：カメラOCRボタンを表示 */}
          {type === 'book' && (
            <CameraOcrButton
              onTextExtracted={(extracted) => {
                // 既存テキストに追記（複数ページ撮影に対応）
                setBodyText((prev) =>
                  prev ? prev + '\n\n' + extracted : extracted
                )
              }}
            />
          )}

          <textarea
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
            placeholder="ここにテキストを貼り付けてください"
            rows={10}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm leading-relaxed focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {bodyText.length > 0 && (
            <p className="text-right text-xs text-gray-400">
              {bodyText.length.toLocaleString()} 文字
            </p>
          )}
        </div>
      )}

      {/* URL 取得後のプレビュー */}
      {currentTab === 'url' && bodyText && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            取得済みテキストプレビュー
          </label>
          <div className="max-h-40 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
            {bodyText.slice(0, 500)}
            {bodyText.length > 500 && '…'}
          </div>
          <p className="text-xs text-gray-400">{bodyText.length.toLocaleString()} 文字取得済み</p>
        </div>
      )}

      {/* 送信ボタン */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={!canSubmit || isSubmitting}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting
            ? '登録中…'
            : currentTab === 'text'
              ? '登録する'
              : '登録してバックグラウンド取得'}
        </button>
      </div>
    </form>
  )
}
