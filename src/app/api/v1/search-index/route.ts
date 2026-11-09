import { searchIndex } from "@/server/repos";

export const dynamic = "force-static";

export function GET() {
  return Response.json(searchIndex(), { headers: { "Cache-Control": "public, max-age=300, s-maxage=3600" } });
}
