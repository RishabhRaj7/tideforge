import { desc } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { builds } from "@/db/schema";
import { getCharacter } from "@/server/repos";
import { apiError, makeCode, rateLimit } from "@/server/http";

export const dynamic = "force-dynamic";

const BuildBody = z.object({
  name: z.string().trim().min(1).max(80).default("Untitled build"),
  characterSlug: z.string().min(1).max(60),
  data: z.record(z.string(), z.unknown()),
});

export async function POST(req: Request) {
  if (!rateLimit(req, "builds:post", 20)) return apiError("rate_limited", "Too many saves, try again in a minute.", 429);
  const text = await req.text();
  if (text.length > 60_000) return apiError("too_large", "Build is too large (max 60 KB).", 413);
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return apiError("bad_json", "Body must be JSON.");
  }
  const parsed = BuildBody.safeParse(json);
  if (!parsed.success) return apiError("invalid_build", "Build failed validation.", 400, parsed.error.flatten());
  if (!getCharacter(parsed.data.characterSlug)) return apiError("unknown_character", "Unknown Resonator.", 400);

  // collision-safe code: retry on unique violation
  for (let attempt = 0; attempt < 6; attempt++) {
    const code = makeCode(attempt < 3 ? 8 : 10);
    try {
      await db.insert(builds).values({ code, name: parsed.data.name, characterSlug: parsed.data.characterSlug, data: parsed.data.data });
      return Response.json({ code });
    } catch (e) {
      const msg = String((e as { code?: string; cause?: { code?: string } })?.code ?? (e as { cause?: { code?: string } })?.cause?.code ?? "");
      if (msg !== "23505") return apiError("db_error", "Could not save build.", 500);
    }
  }
  return apiError("code_collision", "Could not allocate a share code, please retry.", 503);
}

export async function GET() {
  try {
    const rows = await db
      .select({ code: builds.code, name: builds.name, characterSlug: builds.characterSlug, createdAt: builds.createdAt })
      .from(builds)
      .orderBy(desc(builds.createdAt))
      .limit(30);
    return Response.json({ builds: rows });
  } catch {
    return apiError("db_error", "Could not load builds.", 500);
  }
}
