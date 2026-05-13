/**
 * Jina API 失敗時のフォールバック: HTML を直接 fetch してテキスト抽出する。
 * Node.js 環境（API Route）でのみ動作する。
 */
export async function fetchWithHtmlFallback(url: string): Promise<{ title: string; content: string }> {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; 3colorbot/1.0)' },
    signal: AbortSignal.timeout(15000),
    redirect: 'follow',
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${url}`)
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('html')) {
    throw new Error('HTML以外のコンテンツタイプです')
  }

  const html = await response.text()

  // タイトル抽出
  const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1]
  const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]
  const title = (ogTitle ?? titleTag ?? new URL(url).hostname).trim()

  // body テキスト抽出（スクリプト・スタイル除去後）
  const body = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 20000)

  return { title, content: body }
}
