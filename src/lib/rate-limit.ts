// File: src/lib/rate-limit.ts
// ============================================================
// Notesby — In-memory fixed-window rate limiter
// Per-instance by design (no Redis). Bounded memory; expired
// buckets are swept lazily.
// ============================================================

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

function sweep(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
  if (buckets.size >= MAX_BUCKETS) buckets.clear();
}

export interface RateLimitResult {
  ok: boolean;
  retryAfterSeconds: number;
}

/** Count one hit against `key`. Returns ok=false once `limit` hits occur within `windowMs`. */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  if (buckets.size > 1000) sweep(now);

  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }
  bucket.count++;

  return {
    ok: bucket.count <= limit,
    retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
  };
}

export function resetRateLimit(key: string) {
  buckets.delete(key);
}

export function tooManyRequests(retryAfterSeconds: number, message = 'Too many requests.') {
  return new Response(JSON.stringify({ error: message }), {
    status: 429,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'Retry-After': String(retryAfterSeconds),
    },
  });
}

/** Best-effort client identifier; Astro throws when the address is unavailable. */
export function clientKey(getAddress: () => string): string {
  try {
    return getAddress() || 'unknown';
  } catch {
    return 'unknown';
  }
}
