import { listCharacterCards } from "@/server/repos";

export const dynamic = "force-static";

export function GET() {
  return Response.json({ data: listCharacterCards() }, { headers: { "Cache-Control": "public, s-maxage=3600" } });
}
