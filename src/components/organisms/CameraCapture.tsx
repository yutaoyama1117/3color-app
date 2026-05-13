'use client'

import { useRef, useState, useCallback, useEffect } from 'react'

interface CameraCaptureProps {
  onCapture: (imageBase64: string) => void
  onError: (message: string) => void
}

export function CameraCapture({ onCapture, onError }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [isReady, setIsReady] = useState(false)
  const [captured, setCaptured] = useState<string | null>(null)
  const [permissionDenied, setPermissionDenied] = useState(false)

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setPermissionDenied(true)
      onError('このブラウザはカメラに対応していません')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => setIsReady(true)
      }
    } catch (err) {
      setPermissionDenied(true)
      onError(
        err instanceof Error && err.name === 'NotAllowedError'
          ? 'カメラのアクセスが拒否されました。ブラウザの設定から許可してください。'
          : 'カメラの起動に失敗しました',
      )
    }
  }, [onError])

  useEffect(() => {
    startCamera()
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [startCamera])

  const handleCapture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0)
    const base64 = canvas.toDataURL('image/jpeg', 0.9).split(',')[1]
    setCaptured(canvas.toDataURL('image/jpeg', 0.9))
    onCapture(base64)
  }, [onCapture])

  const handleRetake = useCallback(() => {
    setCaptured(null)
  }, [])

  if (permissionDenied) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-red-200 bg-red-50 py-12 text-center">
        <div className="mb-2 text-3xl">📵</div>
        <p className="mb-1 text-sm font-medium text-red-700">カメラにアクセスできません</p>
        <p className="text-xs text-red-500">
          ブラウザの設定でカメラの権限を許可してください
        </p>
        <p className="mt-2 text-xs text-gray-400">
          ※ カメラはHTTPS環境でのみ利用可能です（localhostは例外）
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {captured ? (
        <div className="space-y-3">
          {/* 撮影直後の動的画像のため next/image は使わない */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={captured} alt="撮影画像" className="w-full rounded-xl" />
          <button
            type="button"
            onClick={handleRetake}
            className="w-full rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            撮り直す
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-xl bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full"
            />
            {!isReady && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-sm text-white">カメラ起動中...</p>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleCapture}
            disabled={!isReady}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            📸 撮影する
          </button>
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
