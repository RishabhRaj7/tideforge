import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { builds } from "@/db/schema";
import { apiError } from "@/server/http";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  if (!/^[A-Za-z0-9]{6,12}$/.test(code)) return apiError("bad_code", "Invalid share code.", 400);
  try {
    const rows = await db.select().from(builds).where(eq(builds.code, code)).limit(1);
    if (!rows.length) return apiError("not_found", "Build not found.", 404);
    await db.update(builds).set({ views: sql`${builds.views} + 1` }).where(eq(builds.code, code));
    const b = rows[0];
    return Response.json({ code: b.code, name: b.name, characterSlug: b.characterSlug, data: b.data, createdAt: b.createdAt });
  } catch {
    return apiError("db_error", "Could not load build.", 500);
  }
}
