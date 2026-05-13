/**
 * OpenAI Embedding API でテキストを 1536 次元ベクトルに変換する。
 * サーバーサイド専用（OPENAI_API_KEY 必要）。
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY が設定されていません')

  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
    }),
    signal: AbortSignal.timeout(30000),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Embedding API エラー: ${res.status} ${err}`)
  }

  const data = (await res.json()) as {
    data: Array<{ embedding: number[] }>
  }

  const embedding = data.data[0]?.embedding
  if (!embedding || embedding.length !== 1536) {
    throw new Error('Embedding の取得に失敗しました')
  }

  return embedding
}

/** コサイン類似度 (両ベクトルが正規化されていない前提) */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0
  let dot = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  if (normA === 0 || normB === 0) return 0
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}
