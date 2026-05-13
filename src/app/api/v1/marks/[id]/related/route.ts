import { NextResponse } from 'next/server'
import { generateEmbedding, cosineSimilarity } from '@/lib/services/openai-embedding'

interface MarkInput {
  id: string
  text: string
  comment?: string
  color: 'red' | 'blue' | 'green'
  contentTitle: string
  contentType: string
  createdAt: string
}

interface RelatedRequestBody {
  /** 対象マーク本文 */
  targetText: string
  targetComment?: string
  /** 検索対象の他マーク一覧（クライアントから渡す） */
  candidateMarks: MarkInput[]
  /** 既にリンク済みのマークIDリスト */
  linkedMarkIds?: string[]
}

const SIMILARITY_THRESHOLD = 0.78
const MAX_RESULTS = 5

/**
 * GET/POST /api/v1/marks/:id/related
 * 対象マークと類似する他マークを取得する。
 * 開発モード: クライアント側からマーク一覧を受け取り、Embedding計算 → コサイン類似度でランキング。
 * 本番モード: Supabase pgvector で SQL 検索。
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: markId } = await params

  try {
    const body = (await request.json()) as RelatedRequestBody
    const { targetText, targetComment, candidateMarks, linkedMarkIds = [] } = body

    if (!targetText) {
      return NextResponse.json({ error: 'targetText が必要です' }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error: 'OPENAI_API_KEY が設定されていません',
          data: [],
          demo_mode: true,
        },
        { status: 200 },
      )
    }

    // 1. 対象マークの Embedding 生成
    const targetInput = targetComment ? `${targetText}\n\n${targetComment}` : targetText
    const targetEmbedding = await generateEmbedding(targetInput)

    // 2. 各候補マークの Embedding を計算（並列）
    const results = await Promise.all(
      candidateMarks
        .filter((m) => m.id !== markId)
        .map(async (m) => {
          try {
            const inputText = m.comment ? `${m.text}\n\n${m.comment}` : m.text
            const emb = await generateEmbedding(inputText)
            const similarity = cosineSimilarity(targetEmbedding, emb)
            return { mark: m, similarity }
          } catch {
            return null
          }
        }),
    )

    // 3. 閾値以上で類似度降順、上位 MAX_RESULTS 件
    const ranked = results
      .filter((r): r is { mark: MarkInput; similarity: number } => r !== null)
      .filter((r) => r.similarity >= SIMILARITY_THRESHOLD)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, MAX_RESULTS)

    return NextResponse.json({
      data: ranked.map(({ mark, similarity }) => ({
        markId: mark.id,
        markedText: mark.text,
        comment: mark.comment,
        color: mark.color,
        contentTitle: mark.contentTitle,
        contentType: mark.contentType,
        similarity,
        isLinked: linkedMarkIds.includes(mark.id),
        createdAt: mark.createdAt,
      })),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : '関連マーク取得に失敗しました'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
