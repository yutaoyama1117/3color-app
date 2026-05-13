import { generateEmbedding } from '@/lib/services/openai-embedding'

/**
 * マークテキストの Embedding を生成するジョブハンドラ。
 * payload: { markId: string, text: string, comment?: string }
 */
export async function handleEmbeddingGenerate(
  payload: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const text = payload['text']
  const comment = payload['comment']

  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('payload.text が必要です')
  }

  // コメントがある場合は連結（マーク本文 + コメントで意味を表現）
  const inputText =
    typeof comment === 'string' && comment.trim()
      ? `${text}\n\n${comment}`
      : text

  const embedding = await generateEmbedding(inputText)

  return {
    embedding,
    dimensions: embedding.length,
  }
}
