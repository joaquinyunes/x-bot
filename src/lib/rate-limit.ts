interface RateLimitEntry {
  count: number
  resetTime: number
  lastAccess: number
}

const store = new Map<string, RateLimitEntry>()

setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) {
      store.delete(key)
    }
  }
}, 60_000)

export function rateLimit(
  key: string,
  { limit = 10, windowMs = 60_000 }: { limit?: number; windowMs?: number } = {}
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || entry.resetAt <= now) {
    const resetAt = now + windowMs
    store.set(key, { count: 1, resetAt })
    return { allowed: true, remaining: limit - 1, resetAt }
  }

  entry.count++
  const remaining = Math.max(0, limit - entry.count)

  return { allowed: entry.count <= limit, remaining, resetAt: entry.resetAt }
}

export function rateLimitMiddleware(
  request: Request,
  opts?: { limit?: number; windowMs?: number; keyPrefix?: string }
) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? request.headers.get('x-real-ip')
    ?? 'unknown'
  const url = new URL(request.url)
  const key = `${opts?.keyPrefix ?? ''}:${ip}:${url.pathname}`

  return rateLimit(key, { limit: opts?.limit, windowMs: opts?.windowMs })
}
