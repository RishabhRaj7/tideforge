import "server-only";

export const apiError = (code: string, message: string, status = 400, details?: unknown) =>
  Response.json({ error: { code, message, details } }, { status });

const buckets = new Map<string, { n: number; reset: number }>();
/** Tiny in-memory fixed-window rate limiter (per instance). Swap for Redis/Upstash when scaling out. */
export function rateLimit(req: Request, key: string, limit: number, windowMs = 60_000) {
  const ip = (req.headers.get("x-forwarded-for") ?? "local").split(",")[0].trim();
  const k = `${key}:${ip}`;
  const now = Date.now();
  const b = buckets.get(k);
  if (!b || b.reset < now) {
    buckets.set(k, { n: 1, reset: now + windowMs });
    if (buckets.size > 5000) for (const [kk, v] of buckets) if (v.reset < now) buckets.delete(kk);
    return true;
  }
  b.n++;
  return b.n <= limit;
}

const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"; // base58
export function makeCode(len = 8) {
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}
