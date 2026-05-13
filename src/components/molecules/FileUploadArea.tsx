'use client'

import { useRef, useState, useCallback } from 'react'

interface FileUploadAreaProps {
  accept: string
  maxSizeMb: number
  onFileSelected: (file: File) => void
}

export function FileUploadArea({ accept, maxSizeMb, onFileSelected }: FileUploadAreaProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [selected, setSelected] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  const validate = useCallback(
    (file: File): string | null => {
      if (file.size > maxSizeMb * 1024 * 1024) {
        return `ファイルサイズは${maxSizeMb}MB以下にしてください（現在: ${(file.size / 1024 / 1024).toFixed(1)}MB）`
      }
      return null
    },
    [maxSizeMb],
  )

  const handleFile = useCallback(
    (file: File) => {
      const err = validate(file)
      if (err) {
        setError(err)
        setSelected(null)
        return
      }
      setError(null)
      setSelected(file)
      onFileSelected(file)
    },
    [validate, onFileSelected],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile],
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFile(file)
    },
    [handleFile],
  )

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
          isDragging
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="hidden"
        />
        {selected ? (
          <div className="space-y-1">
            <div className="text-2xl">✅</div>
            <p className="text-sm font-medium text-gray-700">{selected.name}</p>
            <p className="text-xs text-gray-400">
              {(selected.size / 1024 / 1024).toFixed(2)} MB
            </p>
            <p className="text-xs text-blue-600">クリックして変更</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-3xl">📂</div>
            <p className="text-sm font-medium text-gray-600">
              ここにファイルをドラッグ&ドロップ
            </p>
            <p className="text-xs text-gray-400">
              またはクリックしてファイルを選択（最大{maxSizeMb}MB）
            </p>
          </div>
        )}
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}
