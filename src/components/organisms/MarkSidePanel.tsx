'use client'

import { useState } from 'react'
import { ColorBadge } from '@/components/atoms/ColorBadge'
import { useMarkStore } from '@/stores/markStore'
import { RelatedMarkList } from '@/components/organisms/RelatedMarkList'
import type { MarkData } from '@/types/mark'

interface MarkSidePanelProps {
  mark: MarkData | null
  onClose: () => void
}

export function MarkSidePanel({ mark, onClose }: MarkSidePanelProps) {
  const { updateMarkComment, removeMark } = useMarkStore()
  const [editingComment, setEditingComment] = useState(false)
  const [commentDraft, setCommentDraft] = useState('')

  const handleStartEdit = () => {
    setCommentDraft(mark?.comment ?? '')
    setEditingComment(true)
  }

  const handleSaveComment = () => {
    if (!mark) return
    updateMarkComment(mark.id, commentDraft)
    setEditingComment(false)
  }

  const handleDelete = () => {
    if (!mark) return
    removeMark(mark.id)
    onClose()
  }

  // マーク未選択時は非表示（幅ゼロのパネル）
  const isOpen = mark !== null

  return (
    <aside
      aria-label="マーク詳細"
      aria-hidden={!isOpen}
      className={`
        shrink-0 overflow-hidden border-l border-gray-200 bg-white
        transition-all duration-200 ease-in-out
        ${isOpen ? 'w-80 opacity-100' : 'w-0 opacity-0'}
      `}
    >
      {mark && (
        <div className="flex h-full flex-col overflow-y-auto p-4">
          {/* ヘッダー */}
          <div className="mb-4 flex items-center justify-between">
            <ColorBadge color={mark.color} />
            <button
              type="button"
              aria-label="パネルを閉じる"
              onClick={onClose}
              className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {/* マーク本文 */}
          <blockquote className="mb-4 rounded-md border-l-4 border-gray-300 bg-gray-50 p-3 text-sm italic text-gray-700">
            {mark.markedText}
          </blockquote>

          {/* コメント */}
          <div className="mb-4 flex-1">
            <p className="mb-1 text-xs font-medium text-gray-500">コメント</p>
            {editingComment ? (
              <div className="flex flex-col gap-2">
                <textarea
                  autoFocus
                  value={commentDraft}
                  onChange={(e) => setCommentDraft(e.target.value)}
                  placeholder="気づきや感想を入力…"
                  rows={4}
                  className="w-full resize-none rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSaveComment}
                    className="flex-1 rounded-md bg-blue-500 py-1.5 text-xs font-medium text-white hover:bg-blue-600"
                  >
                    保存
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingComment(false)}
                    className="flex-1 rounded-md border border-gray-300 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleStartEdit}
                className="w-full rounded-md border border-dashed border-gray-300 p-2 text-left text-sm text-gray-500 hover:border-gray-400 hover:bg-gray-50"
              >
                {mark.comment ?? '+ コメントを追加'}
              </button>
            )}
          </div>

          {/* 関連マーク（Phase 2-8） */}
          <div className="mb-4 border-t border-gray-100 pt-4">
            <RelatedMarkList mark={mark} />
          </div>

          {/* フッター */}
          <div className="border-t border-gray-100 pt-3">
            <p className="mb-3 text-xs text-gray-400">
              {mark.createdAt.toLocaleDateString('ja-JP')}
            </p>
            <button
              type="button"
              onClick={handleDelete}
              className="w-full rounded-md border border-red-200 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50"
            >
              このマークを削除
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}
