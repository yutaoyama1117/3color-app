'use client'

import { useRef, useState } from 'react'

interface BarcodeScanButtonProps {
  /** スキャン成功時にISBNを返す */
  onIsbnDetected: (isbn: string) => void
}

/**
 * カメラでバーコードを撮影してISBNを読み取るボタン。
 * BarcodeDetector API（Chrome/Safari対応）を使い、非対応の場合は手動入力に切り替える。
 */
export function BarcodeScanButton({ onIsbnDetected }: BarcodeScanButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<'idle' | 'scanning' | 'manual' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [manualIsbn, setManualIsbn] = useState('')

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setStatus('scanning')
    setErrorMsg(null)

    try {
      // BarcodeDetector API の利用可否を確認
      if (!('BarcodeDetector' in window)) {
        // 非対応ブラウザ → 手動入力に切り替え
        setStatus('manual')
        return
      }

      // @ts-expect-error BarcodeDetector は型定義が不完全なため
      const detector = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] })
      const img = await createImageBitmap(file)
      const codes = await detector.detect(img)

      if (codes.length === 0) {
        setErrorMsg('バーコードを認識できませんでした。明るい場所で再試行するか、ISBNを手動入力してください。')
        setStatus('manual')
        return
      }

      const raw = codes[0].rawValue as string
      // ISBN-13は978または979始まりの13桁
      const isbn = raw.replace(/\D/g, '')
      if (isbn.length === 13 && (isbn.startsWith('978') || isbn.startsWith('979'))) {
        onIsbnDetected(isbn)
        setStatus('idle')
      } else if (isbn.length === 10) {
        // ISBN-10をISBN-13に変換
        onIsbnDetected(isbn)
        setStatus('idle')
      } else {
        setErrorMsg(`読み取ったコード: ${raw}（ISBNとして認識できませんでした）`)
        setStatus('manual')
      }
    } catch {
      setErrorMsg('スキャンに失敗しました')
      setStatus('manual')
    } finally {
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleManualSubmit = () => {
    const isbn = manualIsbn.replace(/[-\s]/g, '')
    if (isbn.length < 10) {
      setErrorMsg('ISBNは10桁または13桁で入力してください')
      return
    }
    onIsbnDetected(isbn)
    setManualIsbn('')
    setStatus('idle')
    setErrorMsg(null)
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* スキャンボタン */}
      <button
        type="button"
        onClick={() => {
          setStatus('idle')
          setErrorMsg(null)
          inputRef.current?.click()
        }}
        disabled={status === 'scanning'}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-blue-300 bg-blue-50 px-4 py-3 text-[14px] font-semibold text-blue-700 active:bg-blue-100 disabled:opacity-50"
      >
        {status === 'scanning' ? (
          <>
            <span className="animate-spin">⏳</span>
            スキャン中…
          </>
        ) : (
          <>
            <span className="text-[18px]">📷</span>
            バーコードをスキャン（ISBN）
          </>
        )}
      </button>

      {/* 手動入力モード */}
      {(status === 'manual' || status === 'error') && (
        <div className="space-y-2 rounded-xl border border-gray-200 bg-gray-50 p-3">
          <p className="text-[12px] font-medium text-gray-600">ISBNを手動入力</p>
          {errorMsg && <p className="text-[11px] text-orange-600">{errorMsg}</p>}
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              value={manualIsbn}
              onChange={(e) => setManualIsbn(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleManualSubmit() }}
              placeholder="例: 9784062834520"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-[14px] outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
            />
            <button
              type="button"
              onClick={handleManualSubmit}
              className="rounded-lg bg-blue-500 px-4 py-2 text-[13px] font-semibold text-white active:bg-blue-600"
            >
              検索
            </button>
          </div>
        </div>
      )}

      {/* 手動入力へのリンク（通常時） */}
      {status === 'idle' && (
        <button
          type="button"
          onClick={() => setStatus('manual')}
          className="w-full text-center text-[12px] text-gray-400 active:text-gray-600"
        >
          ISBNを手動入力する
        </button>
      )}
    </div>
  )
}
