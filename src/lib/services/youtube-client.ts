export interface YoutubeVideoInfo {
  videoId: string
  title: string
  channelTitle: string
  thumbnailUrl: string
  durationSec: number
  description: string
}

export interface CaptionSegment {
  startSec: number
  endSec: number
  text: string
}

/** YouTube URL から videoId を抽出する */
export function extractVideoId(url: string): string | null {
  const patterns = [
    /[?&]v=([^&#]+)/,           // watch?v=xxx
    /youtu\.be\/([^?#]+)/,      // youtu.be/xxx
    /\/shorts\/([^?#]+)/,       // shorts/xxx
    /\/embed\/([^?#]+)/,        // embed/xxx
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match?.[1]) return match[1]
  }
  return null
}

/** YouTube Data API v3 で動画情報を取得する */
export async function fetchVideoInfo(videoId: string): Promise<YoutubeVideoInfo> {
  const apiKey = process.env.YOUTUBE_DATA_API_KEY
  if (!apiKey) throw new Error('YOUTUBE_DATA_API_KEY が設定されていません')

  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet,contentDetails&key=${apiKey}`,
    { signal: AbortSignal.timeout(10000) },
  )
  if (!res.ok) throw new Error(`YouTube API エラー: ${res.status}`)

  const data = (await res.json()) as {
    items?: Array<{
      snippet: {
        title: string
        channelTitle: string
        thumbnails: { high?: { url: string }; default?: { url: string } }
        description: string
      }
      contentDetails: { duration: string }
    }>
  }

  const item = data.items?.[0]
  if (!item) throw new Error('動画が見つかりません')

  // ISO 8601 duration to seconds
  const dur = item.contentDetails.duration
  const durationSec = parseDuration(dur)

  return {
    videoId,
    title: item.snippet.title,
    channelTitle: item.snippet.channelTitle,
    thumbnailUrl:
      item.snippet.thumbnails.high?.url ??
      item.snippet.thumbnails.default?.url ??
      `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    durationSec,
    description: item.snippet.description,
  }
}

/** ISO 8601 duration (PT1H2M3S) → 秒数 */
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0
  return (
    parseInt(match[1] ?? '0') * 3600 +
    parseInt(match[2] ?? '0') * 60 +
    parseInt(match[3] ?? '0')
  )
}

/** YouTube の字幕トラック XML を取得してパースする */
export async function fetchCaptions(videoId: string): Promise<CaptionSegment[]> {
  const apiKey = process.env.YOUTUBE_DATA_API_KEY
  if (!apiKey) throw new Error('YOUTUBE_DATA_API_KEY が設定されていません')

  // 字幕一覧取得
  const listRes = await fetch(
    `https://www.googleapis.com/youtube/v3/captions?videoId=${videoId}&part=snippet&key=${apiKey}`,
    { signal: AbortSignal.timeout(10000) },
  )
  if (!listRes.ok) throw new Error(`字幕一覧取得エラー: ${listRes.status}`)

  const listData = (await listRes.json()) as {
    items?: Array<{ id: string; snippet: { language: string; trackKind: string } }>
  }

  // 言語優先順位: ja → ja-JP → en → 最初のトラック
  const items = listData.items ?? []
  if (items.length === 0) throw new Error('この動画には字幕がありません')

  const preferred = ['ja', 'ja-JP', 'en']
  let captionId: string | undefined
  for (const lang of preferred) {
    const found = items.find((i) => i.snippet.language === lang)
    if (found) { captionId = found.id; break }
  }
  if (!captionId) captionId = items[0]?.id

  // timedtext API で XML 取得
  const xmlRes = await fetch(
    `https://www.googleapis.com/youtube/v3/captions/${captionId}?key=${apiKey}`,
    {
      headers: { Accept: 'application/xml' },
      signal: AbortSignal.timeout(15000),
    },
  )
  if (!xmlRes.ok) throw new Error(`字幕XML取得エラー: ${xmlRes.status}`)

  const xml = await xmlRes.text()
  return parseCaptionXml(xml)
}

/** 字幕 XML をパースして CaptionSegment[] に変換する */
function parseCaptionXml(xml: string): CaptionSegment[] {
  const segments: CaptionSegment[] = []
  const re = /<text start="([\d.]+)"(?:[^>]*dur="([\d.]+)")?[^>]*>([^<]*)<\/text>/g
  let match: RegExpExecArray | null

  while ((match = re.exec(xml)) !== null) {
    const startSec = parseFloat(match[1])
    const dur = parseFloat(match[2] ?? '2')
    const text = match[3]
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .trim()

    if (text) {
      segments.push({ startSec, endSec: startSec + dur, text })
    }
  }

  return segments
}
