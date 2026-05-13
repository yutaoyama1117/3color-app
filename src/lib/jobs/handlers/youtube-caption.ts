import { extractVideoId, fetchVideoInfo, fetchCaptions } from '@/lib/services/youtube-client'

/**
 * YouTube URLから字幕テキストを取得するジョブハンドラ。
 * payload: { url: string, contentId: string }
 */
export async function handleYoutubeCaption(
  payload: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const url = payload['url']
  if (typeof url !== 'string' || !url) throw new Error('payload.url が必要です')

  const videoId = extractVideoId(url)
  if (!videoId) throw new Error('有効な YouTube URL を入力してください')

  const [info, segments] = await Promise.all([
    fetchVideoInfo(videoId),
    fetchCaptions(videoId),
  ])

  if (segments.length === 0) {
    throw new Error('この動画には字幕がありません。テキストを手動入力してください。')
  }

  const bodyText = segments.map((s) => s.text).join('\n')

  return {
    title: info.title,
    channelTitle: info.channelTitle,
    thumbnailUrl: info.thumbnailUrl,
    durationSec: info.durationSec,
    bodyText,
    segments,
    videoId,
  }
}
