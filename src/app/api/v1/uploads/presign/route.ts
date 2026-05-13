import { NextResponse } from 'next/server'

const MAX_PDF_SIZE = 50 * 1024 * 1024    // 50MB
const MAX_AUDIO_SIZE = 200 * 1024 * 1024 // 200MB

/**
 * POST /api/v1/uploads/presign
 * Supabase Storage への presigned URL を取得する。
 * 開発環境では Supabase 未設定のためダミーレスポンスを返す。
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      filename: string
      content_type: string
      file_size: number
    }

    const { filename, content_type, file_size } = body

    // バリデーション
    if (content_type === 'application/pdf') {
      if (file_size > MAX_PDF_SIZE) {
        return NextResponse.json(
          { error: 'PDFファイルは50MB以下にしてください' },
          { status: 400 },
        )
      }
    } else if (content_type.startsWith('audio/')) {
      if (file_size > MAX_AUDIO_SIZE) {
        return NextResponse.json(
          { error: '音声ファイルは200MB以下にしてください' },
          { status: 400 },
        )
      }
    } else {
      return NextResponse.json(
        { error: 'PDFまたは音声ファイルのみ対応しています' },
        { status: 400 },
      )
    }

    // Supabase 設定済みの場合は Supabase Storage の presigned URL を返す
    const supabaseConfigured =
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_URL !== 'http://localhost:54321'

    if (!supabaseConfigured) {
      // 開発モード: ダミー URL を返す（クライアント側でファイルを直接 base64 処理する）
      const file_path = `uploads/demo/${Date.now()}_${filename}`
      return NextResponse.json({
        presigned_url: null,
        file_path,
        demo_mode: true,
        message: 'Supabase 未設定のため直接処理モードで動作します',
      })
    }

    // 本番: Supabase Storage presigned URL 生成（実装省略）
    return NextResponse.json(
      { error: 'Supabase Storage 設定が必要です' },
      { status: 501 },
    )
  } catch {
    return NextResponse.json({ error: '不正なリクエストです' }, { status: 400 })
  }
}
