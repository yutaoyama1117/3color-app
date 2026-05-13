import { fetchWithJina } from '@/lib/services/jina-reader'
import { fetchWithHtmlFallback } from '@/lib/services/html-extractor'

/**
 * URLからWebページ本文を取得するジョブハンドラ。
 * payload: { url: string, contentId: string }
 * result:  { title: string, content: string, publishedAt?: string }
 */
export async function handleUrlFetch(
  payload: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const url = payload['url']
  if (typeof url !== 'string' || !url) throw new Error('payload.url が必要です')

  // まず Jina Reader API を試みる
  try {
    const result = await fetchWithJina(url)
    return {
      title: result.title,
      content: result.content,
      publishedAt: result.publishedAt ?? null,
      source: 'jina',
    }
  } catch (jinaErr) {
    // Jina が失敗した場合は直接 HTML fetch にフォールバック
    try {
      const result = await fetchWithHtmlFallback(url)
      return {
        title: result.title,
        content: result.content,
        publishedAt: null,
        source: 'html_fallback',
      }
    } catch (htmlErr) {
      const msg1 = jinaErr instanceof Error ? jinaErr.message : 'Jina失敗'
      const msg2 = htmlErr instanceof Error ? htmlErr.message : 'HTML取得失敗'
      throw new Error(`${msg1} / フォールバック: ${msg2}`)
    }
  }
}
