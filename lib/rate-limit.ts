// In-memory fixed-window rate limiter.
// Single-process only — counts are not shared across replicas.

type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()
let lastCleanup = Date.now()

export type RateLimitResult = {
  allowed:    boolean
  limit:      number
  remaining:  number
  resetAt:    number
  retryAfter: number
}

export function rateLimit(
  key:      string,
  limit:    number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now()

  if (now - lastCleanup > 60_000) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k)
    lastCleanup = now
  }

  let b = buckets.get(key)
  if (!b || b.resetAt <= now) {
    b = { count: 0, resetAt: now + windowMs }
    buckets.set(key, b)
  }
  b.count++

  return {
    allowed:    b.count <= limit,
    limit,
    remaining:  Math.max(0, limit - b.count),
    resetAt:    b.resetAt,
    retryAfter: Math.max(1, Math.ceil((b.resetAt - now) / 1000)),
  }
}

export function getClientIp(headers: Headers): string {
  const fwd = headers.get('x-forwarded-for')
  if (fwd) {
    const first = fwd.split(',')[0]?.trim()
    if (first) return first
  }
  return headers.get('x-real-ip')?.trim() || 'unknown'
}

export function rateLimitHeaders(r: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit':     String(r.limit),
    'X-RateLimit-Remaining': String(r.remaining),
    'X-RateLimit-Reset':     String(Math.ceil(r.resetAt / 1000)),
  }
}

export function tooManyRequestsResponse(r: RateLimitResult): Response {
  return new Response(
    JSON.stringify({ error: 'Too many requests. Please try again later.' }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After':  String(r.retryAfter),
        ...rateLimitHeaders(r),
      },
    },
  )
}
