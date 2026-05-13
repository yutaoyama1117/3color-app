/**
 * AI要約レスポンスのバリデーション。
 * Zod は依存に含まれていないため、手書きの型ガードで実装する。
 */

export interface AiSummaryResult {
  red_summary: string
  blue_summary: string
  green_summary: string
  overall: string
  key_insight: string
}

export function isAiSummaryResult(value: unknown): value is AiSummaryResult {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return (
    typeof v.red_summary === 'string' &&
    typeof v.blue_summary === 'string' &&
    typeof v.green_summary === 'string' &&
    typeof v.overall === 'string' &&
    typeof v.key_insight === 'string'
  )
}

/** Claude のレスポンスをパースして検証する */
export function parseAiSummary(text: string): AiSummaryResult {
  // ```json ... ``` の囲みがあれば除去
  const cleaned = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim()

  let parsed: unknown
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    throw new Error('AIの応答がJSON形式ではありません')
  }

  if (!isAiSummaryResult(parsed)) {
    throw new Error('AIの応答が想定の形式ではありません')
  }

  return parsed
}
