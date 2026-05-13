import { NextRequest, NextResponse } from 'next/server'

interface GoogleBooksItem {
  volumeInfo: {
    title?: string
    authors?: string[]
    publisher?: string
    publishedDate?: string
    description?: string
    pageCount?: number
    imageLinks?: { thumbnail?: string; smallThumbnail?: string }
    industryIdentifiers?: { type: string; identifier: string }[]
  }
}

interface GoogleBooksResponse {
  totalItems?: number
  items?: GoogleBooksItem[]
}

/** OpenBD APIのレスポンス型（日本書籍データベース） */
interface OpenBdSummary {
  isbn?: string
  title?: string
  author?: string
  publisher?: string
  pubdate?: string
  cover?: string
}

interface OpenBdItem {
  summary?: OpenBdSummary
  onix?: {
    CollateralDetail?: {
      TextContent?: { Text?: string; TextType?: string }[]
    }
  }
}

/** ISBNからGoogle Books APIで書籍情報を取得。失敗時はOpenBD（日本語書籍DB）にフォールバック */
export async function GET(request: NextRequest) {
  const isbn = request.nextUrl.searchParams.get('isbn')
  if (!isbn) {
    return NextResponse.json({ error: 'ISBNを指定してください' }, { status: 400 })
  }

  const cleanIsbn = isbn.replace(/[-\s]/g, '')

  // ─── Google Books API（優先） ───
  try {
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanIsbn}&maxResults=1`,
      { next: { revalidate: 86400 } },
    )

    if (res.ok) {
      const data = (await res.json()) as GoogleBooksResponse

      if (data.items && data.items.length > 0) {
        const info = data.items[0].volumeInfo
        const isbn13 = info.industryIdentifiers?.find((i) => i.type === 'ISBN_13')?.identifier
        const isbn10 = info.industryIdentifiers?.find((i) => i.type === 'ISBN_10')?.identifier
        const coverUrl = (info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail)
          ?.replace('http://', 'https://')

        return NextResponse.json({
          title: info.title ?? '',
          authors: info.authors ?? [],
          publisher: info.publisher ?? '',
          publishedAt: info.publishedDate ?? '',
          description: info.description ?? '',
          pageCount: info.pageCount,
          isbn: isbn13 ?? isbn10 ?? cleanIsbn,
          coverUrl,
        })
      }
    }
  } catch {
    // Google Books失敗 → OpenBDへフォールバック
  }

  // ─── OpenBD（日本書籍データベース・フォールバック） ───
  try {
    const res = await fetch(
      `https://api.openbd.jp/v1/get?isbn=${cleanIsbn}`,
      { next: { revalidate: 86400 } },
    )

    if (res.ok) {
      const data = (await res.json()) as (OpenBdItem | null)[]

      if (data[0]?.summary) {
        const s = data[0].summary

        // 概要テキストを取得（onix.CollateralDetail.TextContent から）
        const textContents = data[0].onix?.CollateralDetail?.TextContent ?? []
        const description = textContents.find((t) => t.TextType === '03')?.Text
          ?? textContents[0]?.Text
          ?? ''

        return NextResponse.json({
          title: s.title ?? '',
          authors: s.author ? [s.author] : [],
          publisher: s.publisher ?? '',
          publishedAt: s.pubdate ?? '',
          description,
          isbn: s.isbn ?? cleanIsbn,
          coverUrl: s.cover ?? '',
        })
      }
    }
  } catch {
    // OpenBDも失敗
  }

  return NextResponse.json(
    { error: '書籍情報が見つかりませんでした。ISBNをご確認ください。' },
    { status: 404 },
  )
}
