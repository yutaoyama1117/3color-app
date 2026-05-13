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

    // Jina APIはAccept: application/jsonでJSONを返す
    const json = await response.json() as {
      code?: number
      data?: { title?: string; content?: string; url?: string }
    }

    // JSONレスポンスからtitleとcontentを抽出
    const title = json.data?.title?.trim() ?? new URL(url).hostname
    const content = json.data?.content?.trim() ?? ''

    if (!content) {
      throw new Error('本文を取得できませんでした')
    }

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
