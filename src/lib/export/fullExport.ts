import type { ContentData } from '@/types/content'
import type { MarkData } from '@/types/mark'

export interface FullExportPayload {
  export_version: string
  exported_at: string
  user: {
    email?: string
    display_name?: string
    plan: string
    created_at?: string
  }
  contents: Array<ContentData & { marks: MarkData[] }>
  stats: {
    total_contents: number
    total_marks: number
    marks_by_color: { red: number; blue: number; green: number }
  }
}

/** 全データを構造化された JSON として組み立てる */
export function buildFullExport(
  contents: ContentData[],
  marks: MarkData[],
  user?: { email?: string; display_name?: string },
): FullExportPayload {
  const contentsWithMarks = contents.map((c) => ({
    ...c,
    marks: marks.filter((m) => m.contentId === c.id),
  }))

  return {
    export_version: '1.0',
    exported_at: new Date().toISOString(),
    user: {
      email: user?.email,
      display_name: user?.display_name,
      plan: 'free',
    },
    contents: contentsWithMarks,
    stats: {
      total_contents: contents.length,
      total_marks: marks.length,
      marks_by_color: {
        red: marks.filter((m) => m.color === 'red').length,
        blue: marks.filter((m) => m.color === 'blue').length,
        green: marks.filter((m) => m.color === 'green').length,
      },
    },
  }
}

/** JSON 文字列をブラウザでダウンロード */
export function downloadJson(filename: string, data: unknown): void {
  const content = JSON.stringify(data, null, 2)
  const blob = new Blob([content], { type: 'application/json; charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
