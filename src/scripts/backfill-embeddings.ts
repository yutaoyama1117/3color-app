/**
 * 既存マークの Embedding を一括生成するバックフィルスクリプト。
 *
 * 実行方法（Supabase 接続済み環境）:
 *   npx tsx src/scripts/backfill-embeddings.ts
 *
 * 開発モード（DBなし）では Zustand jobStore に対して順次 enqueue する想定。
 */

import { generateEmbedding } from '@/lib/services/openai-embedding'

interface MarkRow {
  id: string
  markedText: string
  comment?: string
  embedding?: number[] | null
}

/** Embedding 未生成のマークに対して順次生成する */
export async function backfillEmbeddings(
  marks: MarkRow[],
  saveEmbedding: (markId: string, embedding: number[]) => Promise<void>,
): Promise<{ processed: number; skipped: number; errors: number }> {
  let processed = 0
  let skipped = 0
  let errors = 0

  for (const mark of marks) {
    if (mark.embedding && mark.embedding.length === 1536) {
      skipped++
      continue
    }

    try {
      const text = mark.comment ? `${mark.markedText}\n\n${mark.comment}` : mark.markedText
      const embedding = await generateEmbedding(text)
      await saveEmbedding(mark.id, embedding)
      processed++
      // OpenAI のレート制限対策: 1秒1件ペース
      await new Promise((r) => setTimeout(r, 1000))
    } catch (err) {
      console.error(`Mark ${mark.id} の Embedding 生成失敗:`, err)
      errors++
    }
  }

  return { processed, skipped, errors }
}

// CLI 実行時のエントリポイント（DB 接続が必要なため Supabase 設定済み環境で動作）
if (require.main === module) {
  console.log(
    'バックフィルスクリプト: Supabase に接続して実装してください（現在はスケルトンのみ）',
  )
}
