'use client'

import { useState } from 'react'

export default function ReviewSettingsPage() {
  const [newCardsPerDay, setNewCardsPerDay] = useState(20)
  const [maxReviewsPerDay, setMaxReviewsPerDay] = useState(100)
  const [colorFilter, setColorFilter] = useState<'all' | 'red' | 'red_blue'>('all')
  const [reminderTime, setReminderTime] = useState('08:00')

  const handleSave = () => {
    // 開発モード: localStorage に保存
    localStorage.setItem(
      'review-settings',
      JSON.stringify({ newCardsPerDay, maxReviewsPerDay, colorFilter, reminderTime }),
    )
    alert('設定を保存しました')
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <a href="/app/settings" className="mb-4 inline-block text-sm text-gray-500 hover:text-gray-700">
        ← 設定へ戻る
      </a>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">復習設定</h1>

      <div className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        {/* 1日あたりの新規復習カード上限 */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            1日あたりの新規復習カード上限
          </label>
          <input
            type="number"
            min={1}
            max={100}
            value={newCardsPerDay}
            onChange={(e) => setNewCardsPerDay(parseInt(e.target.value, 10) || 20)}
            className="mt-1 w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">デフォルト: 20枚</p>
        </div>

        {/* 1日あたりの最大復習数 */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            1日あたりの最大復習数
          </label>
          <input
            type="number"
            min={10}
            max={500}
            value={maxReviewsPerDay}
            onChange={(e) => setMaxReviewsPerDay(parseInt(e.target.value, 10) || 100)}
            className="mt-1 w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">デフォルト: 100枚</p>
        </div>

        {/* 色フィルター */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            復習対象の色
          </label>
          <select
            value={colorFilter}
            onChange={(e) => setColorFilter(e.target.value as 'all' | 'red' | 'red_blue')}
            className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">全色（🔴🔵🟢）</option>
            <option value="red_blue">赤+青のみ</option>
            <option value="red">赤のみ</option>
          </select>
        </div>

        {/* リマインダー時刻 */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            復習リマインダー時刻
          </label>
          <input
            type="time"
            value={reminderTime}
            onChange={(e) => setReminderTime(e.target.value)}
            className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          設定を保存
        </button>
      </div>
    </div>
  )
}
