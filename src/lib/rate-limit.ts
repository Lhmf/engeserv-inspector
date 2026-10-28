type RateLimitEntry = {
  failures: number;
  blockedUntil: number;
  windowStartedAt: number;
};

const entries = new Map<string, RateLimitEntry>();
const WINDOW_MS = 15 * 60 * 1000;
const BLOCK_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;

function prune(now: number) {
  for (const [key, entry] of entries) {
    if (entry.blockedUntil <= now && now - entry.windowStartedAt > WINDOW_MS) entries.delete(key);
  }
}

export function getRequestIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "unknown";
}

export function isRateLimited(key: string): boolean {
  const now = Date.now();
  prune(now);
  return Boolean(entries.get(key)?.blockedUntil && entries.get(key)!.blockedUntil > now);
}

export function registerFailure(key: string): boolean {
  const now = Date.now();
  prune(now);
  const current = entries.get(key);
  const entry = !current || now - current.windowStartedAt > WINDOW_MS
    ? { failures: 1, blockedUntil: 0, windowStartedAt: now }
    : { ...current, failures: current.failures + 1 };
  if (entry.failures >= MAX_FAILURES) entry.blockedUntil = now + BLOCK_MS;
  entries.set(key, entry);
  return entry.blockedUntil > now;
}

export function clearRateLimit(key: string) {
  entries.delete(key);
}
