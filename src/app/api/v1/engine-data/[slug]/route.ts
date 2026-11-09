import { getCharacter, listCharacters, toEngineChar } from "@/server/repos";
import { apiError } from "@/server/http";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return listCharacters().map((c) => ({ slug: c.slug }));
}

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const c = getCharacter(slug);
  if (!c) return apiError("not_found", "Unknown Resonator.", 404);
  return Response.json(
    { char: toEngineChar(c), chain: c.chain, issues: c.issues, provenance: c.provenance },
    { headers: { "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400" } },
  );
}
