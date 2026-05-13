export interface JinaResult {
  title: string
  content: string
  url: string
  publishedAt?: string
}

/** プライベートIPへのアクセスをブロック（SSRF防止） */
function isPrivateUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url)
    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) ||
      hostname.endsWith('.local')
    )
  } catch {
    return true
  }
}

/** Jina Reader API で URL の本文テキストを取得する */
export async function fetchWithJina(url: string): Promise<JinaResult> {
  if (isPrivateUrl(url)) {
    throw new Error('プライベートIPへのアクセスはブロックされています')
  }

  const apiKey = process.env.JINA_API_KEY
  const jinaUrl = `https://r.jina.ai/${encodeURIComponent(url)}`

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-Return-Format': 'markdown',
  }
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`

  const response = await fetch(jinaUrl, {
    headers,
    signal: AbortSignal.timeout(15000),
    redirect: 'follow',
  })

  if (!response.ok) {
    throw new Error(`Jina API エラー: ${response.status}`)
  }

  const text = await response.text()

  const titleMatch = text.match(/^Title:\s*(.+)$/m)
  const title = titleMatch?.[1]?.trim() ?? new URL(url).hostname

  const publishedMatch = text.match(/^Published Time:\s*(.+)$/m)
  const publishedAt = publishedMatch?.[1]?.trim()

  const bodyLines = text
    .split('\n')
    .filter(
      (line) =>
        !line.startsWith('Title:') &&
        !line.startsWith('URL Source:') &&
        !line.startsWith('Markdown Content:') &&
        !line.startsWith('Published Time:'),
    )
  const content = bodyLines.join('\n').trim().slice(0, 20000)

  return { title, content, url, publishedAt }
}
