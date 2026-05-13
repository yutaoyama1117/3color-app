import { NextRequest, NextResponse } from 'next/server'

// Google Cloud Vision API を使って画像からテキストを抽出する
export async function POST(req: NextRequest) {
  const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'GOOGLE_CLOUD_VISION_API_KEY が設定されていません' },
      { status: 500 }
    )
  }

  // multipart/form-data から画像を受け取る
  let imageBase64: string

  try {
    const formData = await req.formData()
    const file = formData.get('image') as File | null
    if (!file) {
      return NextResponse.json({ error: '画像ファイルがありません' }, { status: 400 })
    }

    // ファイルサイズ制限（10MB）
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: '画像サイズは10MB以下にしてください' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    imageBase64 = Buffer.from(arrayBuffer).toString('base64')
  } catch {
    return NextResponse.json({ error: '画像の読み込みに失敗しました' }, { status: 400 })
  }

  // Vision API を呼び出す
  try {
    const visionRes = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [
            {
              image: {
                content: imageBase64,
              },
              features: [
                {
                  type: 'DOCUMENT_TEXT_DETECTION', // 書籍向け：段落・行を保持して抽出
                  maxResults: 1,
                },
              ],
              imageContext: {
                languageHints: ['ja', 'en'], // 日本語・英語を優先
              },
            },
          ],
        }),
      }
    )

    const data = (await visionRes.json()) as {
      responses?: Array<{
        fullTextAnnotation?: { text: string }
        error?: { message: string }
      }>
      error?: { message: string }
    }

    if (!visionRes.ok || data.error) {
      return NextResponse.json(
        { error: data.error?.message ?? 'Vision APIエラー' },
        { status: 500 }
      )
    }

    const text = data.responses?.[0]?.fullTextAnnotation?.text ?? ''
    if (!text) {
      return NextResponse.json({ error: 'テキストを検出できませんでした' }, { status: 422 })
    }

    return NextResponse.json({ text: text.trim() })
  } catch (err) {
    console.error('Vision API呼び出しエラー:', err)
    return NextResponse.json({ error: 'OCR処理に失敗しました' }, { status: 500 })
  }
}
