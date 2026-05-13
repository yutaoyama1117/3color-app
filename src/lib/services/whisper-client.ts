export interface TranscriptionSegment {
  startSec: number
  endSec: number
  text: string
}

export interface TranscriptionResult {
  text: string
  segments: TranscriptionSegment[]
  durationSec: number
}

/**
 * OpenAI Whisper API で音声ファイルを文字起こしする。
 * サーバーサイド専用（OPENAI_API_KEY 必要）。
 */
export async function transcribeAudio(audioBuffer: Buffer, mimeType: string): Promise<TranscriptionResult> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY が設定されていません')

  const formData = new FormData()
  // Buffer → Uint8Array に変換（Blob の型互換のため）
  const uint8 = new Uint8Array(audioBuffer)
  const blob = new Blob([uint8], { type: mimeType })
  formData.append('file', blob, 'audio.mp3')
  formData.append('model', 'whisper-1')
  formData.append('language', 'ja')
  formData.append('response_format', 'verbose_json')

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
    signal: AbortSignal.timeout(600000), // 10分
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Whisper API エラー: ${res.status} ${err}`)
  }

  const data = (await res.json()) as {
    text: string
    duration: number
    segments: Array<{ start: number; end: number; text: string }>
  }

  const segments: TranscriptionSegment[] = data.segments.map((s) => ({
    startSec: Math.floor(s.start),
    endSec: Math.floor(s.end),
    text: s.text.trim(),
  }))

  return {
    text: data.text,
    segments,
    durationSec: Math.floor(data.duration),
  }
}

/** 音声ファイルのコスト見積もり（$0.006/min * 150円/$ ≒ 0.9円/分） */
export function estimateCost(durationSec: number): {
  durationMin: number
  estimatedCostJpy: number
  estimatedCostUsd: number
} {
  const durationMin = Math.ceil(durationSec / 60)
  const estimatedCostUsd = parseFloat((durationMin * 0.006).toFixed(3))
  const estimatedCostJpy = Math.ceil(estimatedCostUsd * 150)
  return { durationMin, estimatedCostJpy, estimatedCostUsd }
}
