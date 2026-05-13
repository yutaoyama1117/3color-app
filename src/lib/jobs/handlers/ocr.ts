import { detectText } from '@/lib/services/vision-client'

/**
 * 画像からOCRでテキストを認識するジョブハンドラ。
 * payload: { contentId: string, imageBase64: string }
 * 結果はコンテンツに自動保存せず、ユーザー確認後に /api/v1/contents/:id/ocr-confirm で保存する。
 */
export async function handleOcr(
  payload: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const imageBase64 = payload['imageBase64']
  if (typeof imageBase64 !== 'string') {
    throw new Error('payload.imageBase64 が必要です')
  }

  const result = await detectText(imageBase64)

  return {
    text: result.text,
    confidence: result.confidence,
  }
}
