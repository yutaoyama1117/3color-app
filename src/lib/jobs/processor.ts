import type { JobType } from '@/types/job'
import { handleUrlFetch } from './handlers/url-fetch'
import { handleYoutubeCaption } from './handlers/youtube-caption'
import { handlePdfExtract } from './handlers/pdf-extract'
import { handleAudioTranscribe } from './handlers/audio-transcribe'
import { handleAiSummary } from './handlers/ai-summary'
import { handleEmbeddingGenerate } from './handlers/embedding-generate'
import { handleOcr } from './handlers/ocr'

type JobHandler = (payload: Record<string, unknown>) => Promise<Record<string, unknown>>

const handlers: Record<JobType, JobHandler> = {
  url_fetch:          handleUrlFetch,
  youtube_caption:    handleYoutubeCaption,
  pdf_extract:        handlePdfExtract,
  audio_transcribe:   handleAudioTranscribe,
  ai_summary:         handleAiSummary,
  embedding_generate: handleEmbeddingGenerate,
  ocr:                handleOcr,
}

/** ジョブタイプに対応するハンドラを実行する */
export async function processJob(
  jobType: JobType,
  payload: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const handler = handlers[jobType]
  if (!handler) throw new Error(`未知のジョブタイプ: ${jobType}`)
  return handler(payload)
}
