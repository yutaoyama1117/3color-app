'use client'

import { useRef, useState } from 'react'

interface CameraOcrButtonProps {
  /** OCR完了時にテキストを返すコールバック */
  onTextExtracted: (text: string) => void
  /** 追記モード：既存テキストの末尾に追記するか（デフォルト: true） */
  append?: boolean
}

export function CameraOcrButton({ onTextExtracted }: CameraOcrButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<'idle' | 'uploading' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setStatus('uploading')
    setErrorMsg(null)

    try {
      const formData = new FormData()
      formData.append('image', file)

      const res = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
      })

      const data = (await res.json()) as { text?: string; error?: string }

      if (!res.ok || data.error) {
        setErrorMsg(data.error ?? 'OCRに失敗しました')
        setStatus('error')
        return
      }

      onTextExtracted(data.text ?? '')
      setStatus('idle')
    } catch {
      setErrorMsg('ネットワークエラーが発生しました')
      setStatus('error')
    } finally {
      // 同じファイルを再選択できるようにリセット
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col gap-1">
      {/* 隠しinput：スマホではカメラ起動、PCではファイル選択 */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={status === 'uploading'}
        className="flex items-center gap-2 rounded-lg border border-dashed border-blue-300 bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100 disabled:opacity-50"
      >
        {status === 'uploading' ? (
          <>
            <span className="animate-spin">⏳</span>
            OCR処理中…
          </>
        ) : (
          <>
            <span>📷</span>
            写真を撮ってテキスト抽出（OCR）
          </>
        )}
      </button>

      {/* エラー表示 */}
      {status === 'error' && errorMsg && (
        <p className="text-xs text-red-500">{errorMsg}</p>
      )}

      <p className="text-xs text-gray-400">
        スマホ：カメラが起動します　PC：画像ファイルを選択できます
      </p>
    </div>
  )
}
