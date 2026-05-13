import type { ContentData, ContentType } from '@/types/content'

const TYPE_ICON: Record<ContentType, string> = {
  book: '📖',
  pdf: '📄',
  web: '🌐',
  youtube: '▶️',
  audio: '🎙️',
}

const TYPE_LABEL: Record<ContentType, string> = {
  book: '書籍',
  pdf: 'PDF',
  web: 'Web記事',
  youtube: 'YouTube',
  audio: '音声',
}

interface ContentCardProps {
  content: ContentData
  href: string
}

export function ContentCard({ content, href }: ContentCardProps) {
  const totalMarks =
    (content.markCounts?.red ?? 0) +
    (content.markCounts?.blue ?? 0) +
    (content.markCounts?.green ?? 0)

  return (
    <a
      href={href}
      className="block rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
    >
      {/* ヘッダー行 */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xl" aria-hidden="true">
            {TYPE_ICON[content.type]}
          </span>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
            {TYPE_LABEL[content.type]}
          </span>
        </div>
        {content.lastMarkedAt && (
          <span className="shrink-0 text-xs text-gray-400">
            {content.lastMarkedAt.toLocaleDateString('ja-JP')}
          </span>
        )}
      </div>

      {/* タイトル */}
      <h3 className="mb-1 line-clamp-2 text-base font-semibold text-gray-900">
        {content.title}
      </h3>
      {content.author && (
        <p className="mb-3 text-sm text-gray-500">{content.author}</p>
      )}

      {/* マーク数バッジ */}
      {totalMarks > 0 && (
        <div className="flex items-center gap-2">
          {(content.markCounts?.red ?? 0) > 0 && (
            <span className="text-xs text-gray-600">
              🔴 {content.markCounts?.red}
            </span>
          )}
          {(content.markCounts?.blue ?? 0) > 0 && (
            <span className="text-xs text-gray-600">
              🔵 {content.markCounts?.blue}
            </span>
          )}
          {(content.markCounts?.green ?? 0) > 0 && (
            <span className="text-xs text-gray-600">
              🟢 {content.markCounts?.green}
            </span>
          )}
          <span className="text-xs text-gray-400">（計{totalMarks}件）</span>
        </div>
      )}

      {totalMarks === 0 && (
        <p className="text-xs text-gray-400">まだマークなし</p>
      )}
    </a>
  )
}
