'use client'

import { useEffect, useRef, useCallback } from 'react'

interface YoutubePlayerProps {
  videoId: string
  onTimeUpdate?: (currentSec: number) => void
}

declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string,
        options: {
          videoId: string
          playerVars?: Record<string, number | string>
          events?: {
            onReady?: (event: { target: YoutubePlayerInstance }) => void
            onStateChange?: (event: { data: number }) => void
          }
        },
      ) => YoutubePlayerInstance
      PlayerState: { PLAYING: number }
    }
    onYouTubeIframeAPIReady?: () => void
  }
}

interface YoutubePlayerInstance {
  seekTo: (sec: number, allowSeekAhead: boolean) => void
  getCurrentTime: () => number
  destroy: () => void
}

export function YoutubePlayer({ videoId, onTimeUpdate }: YoutubePlayerProps) {
  const playerRef = useRef<YoutubePlayerInstance | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const containerId = `yt-player-${videoId}`

  const initPlayer = useCallback(() => {
    playerRef.current = new window.YT.Player(containerId, {
      videoId,
      playerVars: { rel: 0, modestbranding: 1 },
      events: {
        onStateChange: (event) => {
          if (event.data === window.YT.PlayerState.PLAYING) {
            intervalRef.current = setInterval(() => {
              const time = playerRef.current?.getCurrentTime() ?? 0
              onTimeUpdate?.(Math.floor(time))
            }, 500)
          } else {
            if (intervalRef.current) clearInterval(intervalRef.current)
          }
        },
      },
    })
  }, [videoId, containerId, onTimeUpdate])

  useEffect(() => {
    if (window.YT?.Player) {
      initPlayer()
      return
    }

    // YouTube IFrame API を動的ロード
    const script = document.createElement('script')
    script.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(script)
    window.onYouTubeIframeAPIReady = initPlayer

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      playerRef.current?.destroy()
    }
  }, [initPlayer])

  /** マークをクリックしたときにその位置にシークする */
  const seekTo = useCallback((sec: number) => {
    playerRef.current?.seekTo(sec, true)
  }, [])

  // seekTo を ref 経由で外部に公開（将来の拡張用）
  const playerApiRef = useRef({ seekTo })
  playerApiRef.current.seekTo = seekTo

  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-black" style={{ paddingTop: '56.25%' }}>
      <div id={containerId} className="absolute inset-0" />
    </div>
  )
}
