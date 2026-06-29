export const dynamic = 'force-dynamic'
export const maxDuration = 600

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()

      const send = (event: string, data: unknown) => {
        const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
        controller.enqueue(encoder.encode(msg))
      }

      send('connected', { message: 'SSE connected' })

      const interval = setInterval(() => {
        send('ping', { time: Date.now() })
      }, 30000)

      request.signal.addEventListener('abort', () => {
        clearInterval(interval)
        controller.close()
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
