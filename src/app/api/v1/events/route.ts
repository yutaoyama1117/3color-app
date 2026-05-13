/**
 * GET /api/v1/events
 * SSE（Server-Sent Events）エンドポイント。
 * 本番: Supabase Realtime を購読してジョブ完了イベントをストリーム。
 * 開発: クライアント側 jobStore の emit でイベントを受け取るため、
 *       ここでは接続維持のみ行い、実際のイベントはクライアント側で処理される。
 */
export async function GET() {
  const stream = new ReadableStream({
    start(controller) {
      // 接続維持用のコメントを定期送信（keep-alive）
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(': keep-alive\n\n')
        } catch {
          clearInterval(keepAlive)
        }
      }, 15000)

      // 接続時に connected イベントを送信
      controller.enqueue('event: connected\ndata: {}\n\n')
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
