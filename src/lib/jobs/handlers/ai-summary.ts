import { sendPrompt } from '@/lib/services/claude-client'
import { buildSummaryPrompt } from '@/lib/prompts/summary-prompt'
import { parseAiSummary } from '@/validations/ai-summary'

/**
 * マーク済み箇所をAIで色別要約するジョブハンドラ。
 * payload: {
 *   contentId: string,
 *   title: string,
 *   author?: string,
 *   redMarks: { text, comment? }[],
 *   blueMarks: ...,
 *   greenMarks: ...
 * }
 */
export async function handleAiSummary(
  payload: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const title = payload['title']
  if (typeof title !== 'string') throw new Error('payload.title が必要です')

  const redMarks = (payload['redMarks'] as { text: string; comment?: string }[]) ?? []
  const blueMarks = (payload['blueMarks'] as { text: string; comment?: string }[]) ?? []
  const greenMarks = (payload['greenMarks'] as { text: string; comment?: string }[]) ?? []

  const totalMarks = redMarks.length + blueMarks.length + greenMarks.length
  if (totalMarks === 0) {
    throw new Error('要約するマークが1件もありません')
  }

  // トークン上限管理: 多すぎる場合は赤を全件 → 青・緑を新しい順に制限
  const MAX_PER_COLOR = 30
  const trimmedBlue = blueMarks.slice(-MAX_PER_COLOR)
  const trimmedGreen = greenMarks.slice(-MAX_PER_COLOR)

  const prompt = buildSummaryPrompt({
    title,
    author: payload['author'] as string | undefined,
    redMarks,
    blueMarks: trimmedBlue,
    greenMarks: trimmedGreen,
  })

  const responseText = await sendPrompt(prompt, 2000)
  const summary = parseAiSummary(responseText)

  return {
    summary,
    usedMarks: {
      red: redMarks.length,
      blue: trimmedBlue.length,
      green: trimmedGreen.length,
    },
    truncated:
      blueMarks.length > MAX_PER_COLOR || greenMarks.length > MAX_PER_COLOR,
  }
}
