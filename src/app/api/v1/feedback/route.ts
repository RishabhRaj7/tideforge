import { z } from "zod";
import { db } from "@/db";
import { feedback } from "@/db/schema";
import { apiError, rateLimit } from "@/server/http";

export const dynamic = "force-dynamic";

const Body = z.object({
  kind: z.enum(["data-error", "calc-mismatch", "suggestion"]),
  page: z.string().max(200),
  message: z.string().trim().min(5).max(1500),
});

export async function POST(req: Request) {
  if (!rateLimit(req, "feedback", 5)) return apiError("rate_limited", "Too many reports, please wait a minute.", 429);
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return apiError("invalid", "Please describe the problem in at least 5 characters.", 400, parsed.error.flatten());
  try {
    await db.insert(feedback).values(parsed.data);
    return Response.json({ ok: true });
  } catch {
    return apiError("db_error", "Could not save your report.", 500);
  }
}
