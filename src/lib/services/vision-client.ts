export interface VisionAnnotation {
  text: string
  confidence: number
}

/**
 * Google Cloud Vision API でテキスト認識（OCR）を実行する。
 * サーバーサイド専用（GOOGLE_CLOUD_VISION_API_KEY 必要）。
 */
export async function detectText(imageBase64: string): Promise<VisionAnnotation> {
  const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY
  if (!apiKey) throw new Error('GOOGLE_CLOUD_VISION_API_KEY が設定されていません')

  const res = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [
          {
            image: { content: imageBase64 },
            features: [{ type: 'TEXT_DETECTION' }],
            imageContext: { languageHints: ['ja', 'en'] },
          },
        ],
      }),
      signal: AbortSignal.timeout(30000),
    },
  )

  if (!res.ok) throw new Error(`Vision API エラー: ${res.status}`)

  const data = (await res.json()) as {
    responses: Array<{
      textAnnotations?: Array<{ description: string; confidence?: number }>
      error?: { message: string }
    }>
  }

  const response = data.responses[0]
  if (response?.error) throw new Error(response.error.message)

  const annotation = response?.textAnnotations?.[0]
  if (!annotation) throw new Error('テキストが認識されませんでした')

  return {
    text: annotation.description.trim(),
    confidence: annotation.confidence ?? 0.9,
  }
}
