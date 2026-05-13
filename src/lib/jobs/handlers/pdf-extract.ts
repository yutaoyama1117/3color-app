import { extractPdfText } from '@/lib/services/pdf-extractor'

/**
 * PDF ファイルからテキストを抽出するジョブハンドラ。
 * payload: { contentId: string, filePath: string, fileBuffer?: string (base64) }
 */
export async function handlePdfExtract(
  payload: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const filePath = payload['filePath']
  const fileBufferB64 = payload['fileBuffer']

  if (!filePath && !fileBufferB64) {
    throw new Error('payload.filePath または payload.fileBuffer が必要です')
  }

  let buffer: Buffer

  if (typeof fileBufferB64 === 'string') {
    // クライアントから base64 エンコードされたファイルを受け取った場合
    buffer = Buffer.from(fileBufferB64, 'base64')
  } else {
    // Supabase Storage からダウンロードする場合（本番環境）
    // 開発環境では filePath のみのため、ダミー処理
    throw new Error('Supabase Storage 未設定のため PDF 取得できません。デモ: fileBuffer を直接送信してください')
  }

  // テキスト抽出
  const result = await extractPdfText(buffer)

  if (result.text.trim().length < 10) {
    throw new Error('このPDFはテキスト抽出できませんでした（画像PDFの可能性）。カメラOCRかテキスト手入力をお試しください。')
  }

  // ページ区切りをテキストに挿入
  const bodyText = result.pages
    .map((p) => `── p.${p.page} ──\n${p.text}`)
    .join('\n\n')

  return {
    bodyText,
    pageCount: result.pageCount,
    pages: result.pages,
  }
}
