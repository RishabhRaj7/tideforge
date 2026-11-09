// Client-safe presentation constants (no data imports).
export const ELEMENT_COLOR: Record<string, string> = {
  Glacio: "#78bdd9", Fusion: "#e2704a", Electro: "#a583e0", Aero: "#55c9a0", Spectro: "#dcc660", Havoc: "#c9487f",
};
// Shape glyphs so element identity never relies on colour alone.
export const ELEMENT_GLYPH: Record<string, string> = {
  Glacio: "❄", Fusion: "▲", Electro: "ϟ", Aero: "≋", Spectro: "✦", Havoc: "◈",
};
export const WEAPON_GLYPH: Record<string, string> = {
  Broadblade: "⚔", Sword: "†", Pistols: "⌖", Gauntlets: "✊", Rectifier: "◎",
};
export const fmt = (n: number, d = 0) => n.toLocaleString("en-US", { maximumFractionDigits: d, minimumFractionDigits: d });
export const pct = (n: number, d = 1) => `${n.toFixed(d)}%`;
export const formatDate = (iso: string) => {
  if (!iso || iso === "indefinite") return iso === "indefinite" ? "Ongoing" : "TBA";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d || 1)).toLocaleDateString("en-GB", { day: iso.length > 7 ? "numeric" : undefined, month: "short", year: "numeric", timeZone: "UTC" });
};
