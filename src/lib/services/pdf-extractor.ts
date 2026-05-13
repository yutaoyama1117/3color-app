export interface PdfExtractResult {
  text: string
  pageCount: number
  pages: Array<{ page: number; text: string }>
}

/** PDF バッファからテキストを抽出する（サーバーサイド専用） */
export async function extractPdfText(buffer: Buffer): Promise<PdfExtractResult> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require('pdf-parse') as (
    buffer: Buffer,
  ) => Promise<{ text: string; numpages: number }>

  const data = await pdfParse(buffer)

  // ページ区切りで分割（\f = form feed）
  const rawPages = data.text.split('\f').filter((p: string) => p.trim().length > 0)
  const pages = rawPages.map((text: string, i: number) => ({
    page: i + 1,
    text: text.trim(),
  }))

  return {
    text: data.text.trim().slice(0, 100000), // 最大10万文字
    pageCount: data.numpages,
    pages,
  }
}
