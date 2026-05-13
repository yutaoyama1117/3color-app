import { NextResponse } from 'next/server'
import type { UrlFetchResult } from '@/types/content'

export async function POST(request: Request) {
  const { url } = await request.json() as { url: string }

  if (!url) {
    return NextResponse.json({ error: 'URLが必要です' }, { status: 400 })
  }

  // URL形式のバリデーション
  try {
    new URL(url)
  } catch {
    return NextResponse.json({ error: '有効なURLを入力してください' }, { status: 400 })
  }

  try {
    // Jina Reader API で本文抽出（https://r.jina.ai/{url}）
    const jinaUrl = `https://r.jina.ai/${url}`
    const response = await fetch(jinaUrl, {
      headers: {
        Accept: 'application/json',
        'X-Return-Format': 'markdown',
      },
      signal: AbortSignal.timeout(15000),
    })

    if (!response.ok) {
      throw new Error(`Jina API error: ${response.status}`)
    }

    const text = await response.text()

    // Jina のレスポンスからタイトルと本文を抽出
    const titleMatch = text.match(/^Title:\s*(.+)$/m)
    const title = titleMatch?.[1]?.trim() ?? new URL(url).hostname

    // Title行・URL行・メタ情報を除いた本文部分を取得
    const bodyLines = text
      .split('\n')
      .filter((line) => !line.startsWith('Title:') && !line.startsWith('URL Source:') && !line.startsWith('Markdown Content:'))
    const content = bodyLines.join('\n').trim()

    const result: UrlFetchResult = {
      title,
      content: content.slice(0, 20000), // 最大2万文字
      url,
    }

    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : '取得に失敗しました'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
