import { transcribeAudio } from '@/lib/services/whisper-client'

/**
 * 音声ファイルを文字起こしするジョブハンドラ。
 * payload: { contentId: string, filePath: string, fileBuffer?: string (base64), mimeType?: string }
 */
export async function handleAudioTranscribe(
  payload: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const fileBufferB64 = payload['fileBuffer']
  const mimeType = (payload['mimeType'] as string | undefined) ?? 'audio/mpeg'

  if (typeof fileBufferB64 !== 'string') {
    throw new Error('payload.fileBuffer (base64) が必要です')
  }

  const buffer = Buffer.from(fileBufferB64, 'base64')
  const result = await transcribeAudio(buffer, mimeType)

  const bodyText = result.segments.map((s) => s.text).join('\n')

  return {
    bodyText,
    durationSec: result.durationSec,
    segments: result.segments,
  }
}
