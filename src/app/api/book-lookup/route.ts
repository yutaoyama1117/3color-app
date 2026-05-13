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

/** ISBNからGoogle Books APIで書籍情報を取得する */
export async function GET(request: NextRequest) {
  const isbn = request.nextUrl.searchParams.get('isbn')
  if (!isbn) {
    return NextResponse.json({ error: 'ISBNを指定してください' }, { status: 400 })
  }

  // ISBNのハイフンと空白を除去
  const cleanIsbn = isbn.replace(/[-\s]/g, '')

  try {
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanIsbn}&maxResults=1`,
      { next: { revalidate: 86400 } }, // 24時間キャッシュ
    )

    if (!res.ok) {
      return NextResponse.json({ error: '書籍情報の取得に失敗しました' }, { status: 502 })
    }

    const data = (await res.json()) as GoogleBooksResponse

    if (!data.items || data.items.length === 0) {
      return NextResponse.json({ error: '該当する書籍が見つかりませんでした' }, { status: 404 })
    }

    const info = data.items[0].volumeInfo
    const isbn13 = info.industryIdentifiers?.find((i) => i.type === 'ISBN_13')?.identifier
    const isbn10 = info.industryIdentifiers?.find((i) => i.type === 'ISBN_10')?.identifier

    // httpsに変換（GoogleのAPIはhttpで返すことがある）
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
  } catch {
    return NextResponse.json({ error: 'ネットワークエラーが発生しました' }, { status: 500 })
  }
}
