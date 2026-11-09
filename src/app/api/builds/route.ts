import { db } from "@/db";
import { builds } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

function makeCode() {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 8; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = String(body?.name || "Untitled build").slice(0, 80);
    const characterSlug = String(body?.characterSlug || "");
    if (!characterSlug || typeof body?.data !== "object") {
      return Response.json({ error: "Invalid build" }, { status: 400 });
    }
    const raw = JSON.stringify(body.data);
    if (raw.length > 60000) return Response.json({ error: "Build too large" }, { status: 413 });
    const code = makeCode();
    await db.insert(builds).values({ code, name, characterSlug, data: body.data });
    return Response.json({ code });
  } catch {
    return Response.json({ error: "Could not save build" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    if (code) {
      const rows = await db.select().from(builds).where(eq(builds.code, code)).limit(1);
      if (!rows.length) return Response.json({ error: "Not found" }, { status: 404 });
      return Response.json(rows[0]);
    }
    const rows = await db
      .select({ code: builds.code, name: builds.name, characterSlug: builds.characterSlug, createdAt: builds.createdAt })
      .from(builds)
      .orderBy(desc(builds.createdAt))
      .limit(24);
    return Response.json({ builds: rows });
  } catch {
    return Response.json({ builds: [] });
  }
}
