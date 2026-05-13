import { MarkingViewer } from '@/components/organisms/MarkingViewer'
import { DEMO_BODY_TEXT, DEMO_CONTENT_ID } from '@/lib/mock/marks'

export const metadata = { title: 'デモ | ３色ボールペン読書メモ' }

export default function DemoPage() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-hidden">
        <MarkingViewer
          contentId={DEMO_CONTENT_ID}
          title="三色ボールペンで読む日本語（デモ）"
          bodyText={DEMO_BODY_TEXT}
        />
      </div>

      {/* 凡例 */}
      <footer className="border-t border-gray-100 bg-gray-50 px-6 py-2">
        <div className="flex items-center gap-6 text-xs text-gray-500">
          <span>マークの見方:</span>
          <span className="inline-block rounded-sm border-b-2 border-red-500 bg-red-200/60 px-1">🔴 客観的最重要</span>
          <span className="inline-block rounded-sm border-b-2 border-blue-500 bg-blue-200/60 px-1">🔵 客観的重要</span>
          <span className="inline-block rounded-sm border-b-2 border-green-500 bg-green-200/60 px-1">🟢 個人的気づき</span>
          <span className="ml-auto">テキストを選択 → 色を選んでマーク | マーク箇所をクリックで詳細</span>
        </div>
      </footer>
    </div>
  )
}
