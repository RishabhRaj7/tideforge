/**
 * Polite HTTP helpers shared by every fetcher (see docs/PERMISSIONS.md for the rate limits).
 * - descriptive User-Agent
 * - bounded concurrency + per-request delay
 * - retry with backoff
 */
export const UA = "TideforgeBot/1.0 (+https://github.com/RishabhRaj7/tideforge; personal fan project)";

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function request(url: string, tries = 4): Promise<Response> {
  let lastErr: unknown;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { "user-agent": UA } });
      if (res.ok) return res;
      if (res.status === 404) throw Object.assign(new Error(`404 ${url}`), { fatal: true });
      lastErr = new Error(`${res.status} ${url}`);
    } catch (e) {
      if ((e as { fatal?: boolean }).fatal) throw e;
      lastErr = e;
    }
    await sleep(500 * 2 ** i);
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

export const getJson = async <T = unknown>(url: string): Promise<T> => (await request(url)).json() as Promise<T>;

/** Run `fn` over `items` with at most `limit` in flight and `delayMs` between task starts per worker. */
export async function pool<T, R>(items: T[], limit: number, delayMs: number, fn: (item: T, i: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      out[i] = await fn(items[i], i);
      if (delayMs) await sleep(delayMs);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}
