interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

const INTERVAL = 60_000;
const MAX_REQUESTS = 60;

export function checkRateLimit(key: string, maxRequests = MAX_REQUESTS, intervalMs = INTERVAL): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
} {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + intervalMs });
    return { allowed: true, remaining: maxRequests - 1, resetAt: now + intervalMs };
  }

  entry.count += 1;

  if (entry.count > maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt };
}

export function rateLimitMiddleware(
  key: string,
  maxRequests = 60,
  intervalMs = 60_000
): Response | null {
  const result = checkRateLimit(key, maxRequests, intervalMs);
  if (!result.allowed) {
    return new Response(
      JSON.stringify({ error: "Too many requests", resetAt: result.resetAt }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(Math.ceil((result.resetAt - Date.now()) / 1000)),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }
  return null;
}
