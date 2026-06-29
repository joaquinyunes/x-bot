export const dynamic = 'force-dynamic'
export const maxDuration = 600

import { sseManager } from '@/lib/sse/manager'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const accountId = searchParams.get('accountId')
  const campaignId = searchParams.get('campaignId')

  const channel = accountId
    ? `account:${accountId}`
    : campaignId
      ? `campaign:${campaignId}`
      : null

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()
      const send = (event: string, data: unknown) => {
        try {
          const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
          controller.enqueue(encoder.encode(msg))
        } catch {}
      }

      send('connected', { message: 'SSE connected' })

      if (channel) {
        const unsubscribe = sseManager.subscribe(channel, (ev) => {
          send(ev.type, ev.data)
        })
        request.signal.addEventListener('abort', () => {
          unsubscribe()
          controller.close()
        })
      }

      const keepAlive = setInterval(() => {
        send('ping', { time: Date.now() })
      }, 30000)

      request.signal.addEventListener('abort', () => {
        clearInterval(keepAlive)
        try { controller.close() } catch {}
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
