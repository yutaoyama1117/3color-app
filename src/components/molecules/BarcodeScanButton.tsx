'use client'

import { useRef, useState, useEffect, useCallback } from 'react'

interface BarcodeScanButtonProps {
  /** スキャン成功時にISBNを返す */
  onIsbnDetected: (isbn: string) => void
}

/**
 * リアルタイムカメラでバーコードを読み取るボタン。
 * @zxing/browser でiOS Safariを含む全ブラウザに対応。
 * カメラモードはフルスクリーンのビューファインダーを表示する。
 */
export function BarcodeScanButton({ onIsbnDetected }: BarcodeScanButtonProps) {
  const [mode, setMode] = useState<'idle' | 'camera' | 'manual'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [manualIsbn, setManualIsbn] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const readerRef = useRef<any>(null)

  const stopCamera = useCallback(() => {
    if (readerRef.current) {
      try { readerRef.current.reset() } catch { /* ignore */ }
      readerRef.current = null
    }
    setMode('idle')
  }, [])

  // カメラモードになったら @zxing でリアルタイムスキャン開始
  useEffect(() => {
    if (mode !== 'camera') return

    let cancelled = false

    const start = async () => {
      try {
        const { BrowserMultiFormatReader } = await import('@zxing/browser')
        const reader = new BrowserMultiFormatReader()
        readerRef.current = reader

        if (cancelled || !videoRef.current) return

        await reader.decodeFromConstraints(
          {
            video: {
              facingMode: { ideal: 'environment' }, // 背面カメラ優先
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          },
          videoRef.current,
          (result) => {
            if (!result || cancelled) return

            const raw = result.getText()
            const isbn = raw.replace(/\D/g, '')

            // ISBN-13（978/979始まり）またはISBN-10を検出
            const isIsbn13 = isbn.length === 13 && (isbn.startsWith('978') || isbn.startsWith('979'))
            const isIsbn10 = isbn.length === 10

            if (isIsbn13 || isIsbn10) {
              cancelled = true
              try { readerRef.current?.reset() } catch { /* ignore */ }
              readerRef.current = null
              setMode('idle')
              onIsbnDetected(isbn)
            }
          },
        )
      } catch {
        if (!cancelled) {
          setError('カメラを起動できませんでした。手動でISBNを入力してください。')
          setMode('manual')
        }
      }
    }

    start()

    return () => {
      cancelled = true
      try { readerRef.current?.reset() } catch { /* ignore */ }
      readerRef.current = null
    }
  }, [mode, onIsbnDetected])

  const handleManualSubmit = () => {
    const isbn = manualIsbn.replace(/[-\s]/g, '')
    if (isbn.length < 10) {
      setError('ISBNは10桁または13桁で入力してください')
      return
    }
    onIsbnDetected(isbn)
    setManualIsbn('')
    setMode('idle')
    setError(null)
  }

  return (
    <>
      <div className="space-y-2">
        {/* スキャンボタン */}
        <button
          type="button"
          onClick={() => { setError(null); setMode('camera') }}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-blue-300 bg-blue-50 px-4 py-3 text-[14px] font-semibold text-blue-700 active:bg-blue-100"
        >
          <span className="text-[18px]">📷</span>
          バーコードをスキャン（ISBN）
        </button>

        {/* 手動入力モード */}
        {mode === 'manual' && (
          <div className="space-y-2 rounded-xl border border-gray-200 bg-gray-50 p-3">
            <p className="text-[12px] font-medium text-gray-600">ISBNを手動入力</p>
            {error && <p className="text-[11px] text-orange-600">{error}</p>}
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

        {/* 手動入力リンク（通常時） */}
        {mode === 'idle' && (
          <button
            type="button"
            onClick={() => setMode('manual')}
            className="w-full text-center text-[12px] text-gray-400 active:text-gray-600"
          >
            ISBNを手動入力する
          </button>
        )}
      </div>

      {/* カメラモーダル（フルスクリーン） */}
      {mode === 'camera' && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black">
          {/* ヘッダー */}
          <div className="flex items-center justify-between px-4 py-3 pt-safe">
            <button
              type="button"
              onClick={stopCamera}
              className="rounded-lg bg-white/20 px-3 py-1.5 text-[14px] font-medium text-white"
            >
              キャンセル
            </button>
            <p className="text-[15px] font-semibold text-white">バーコードをスキャン</p>
            <div className="w-20" />
          </div>

          {/* カメラビュー */}
          <div className="relative flex-1 overflow-hidden">
            <video
              ref={videoRef}
              className="h-full w-full object-cover"
              playsInline
              muted
              autoPlay
            />

            {/* 暗幕オーバーレイ（ターゲット以外を暗く） */}
            <div className="absolute inset-0 flex items-center justify-center">
              {/* 上 */}
              <div className="absolute inset-x-0 top-0 bg-black/50" style={{ bottom: 'calc(50% + 56px)' }} />
              {/* 下 */}
              <div className="absolute inset-x-0 bottom-0 bg-black/50" style={{ top: 'calc(50% + 56px)' }} />
              {/* 左 */}
              <div className="absolute inset-y-0 left-0 bg-black/50" style={{ top: 'calc(50% - 56px)', bottom: 'calc(50% - 56px)', right: 'calc(50% + 144px)' }} />
              {/* 右 */}
              <div className="absolute inset-y-0 right-0 bg-black/50" style={{ top: 'calc(50% - 56px)', bottom: 'calc(50% - 56px)', left: 'calc(50% + 144px)' }} />

              {/* ターゲットフレーム */}
              <div className="relative h-28 w-72">
                {/* 四隅 */}
                <div className="absolute left-0 top-0 h-7 w-7 border-l-[3px] border-t-[3px] border-white rounded-tl-sm" />
                <div className="absolute right-0 top-0 h-7 w-7 border-r-[3px] border-t-[3px] border-white rounded-tr-sm" />
                <div className="absolute left-0 bottom-0 h-7 w-7 border-l-[3px] border-b-[3px] border-white rounded-bl-sm" />
                <div className="absolute right-0 bottom-0 h-7 w-7 border-r-[3px] border-b-[3px] border-white rounded-br-sm" />
                {/* スキャンライン */}
                <div className="absolute left-2 right-2 top-1/2 h-0.5 -translate-y-1/2 animate-pulse rounded-full bg-red-400" />
              </div>
            </div>

            {/* ガイドテキスト */}
            <div className="absolute bottom-10 left-0 right-0 text-center">
              <p className="mx-8 rounded-xl bg-black/60 px-4 py-2.5 text-[13px] text-white">
                📚 裏表紙のバーコードをフレームに合わせてください
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
