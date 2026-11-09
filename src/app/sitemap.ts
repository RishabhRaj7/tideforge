import type { MetadataRoute } from "next";
import { listCharacters, listEchoes, listSonatas, listWeapons } from "@/server/repos";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const pages = ["", "/characters", "/weapons", "/echoes", "/sonatas", "/tier-list", "/calculator", "/convene", "/banners", "/events", "/patches", "/materials", "/glossary", "/methodology", "/data-status", "/about"];
  return [
    ...pages.map((p) => ({ url: `${base}${p}` })),
    ...listCharacters().map((c) => ({ url: `${base}/characters/${c.slug}` })),
    ...listWeapons().map((w) => ({ url: `${base}/weapons/${w.slug}` })),
    ...listEchoes().map((e) => ({ url: `${base}/echoes/${e.slug}` })),
    ...listSonatas().map((s) => ({ url: `${base}/sonatas/${s.slug}` })),
  ];
}
