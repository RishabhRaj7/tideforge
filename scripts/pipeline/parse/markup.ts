/**
 * In-game rich text -> small AST / plain text.
 *
 * Handles the tags seen in the datamine:
 *   <color=Highlight>..</color>   -> { t: "hl" }
 *   <size=40>..</size>            -> size is dropped, text kept
 *   <te href=850076>..</te>       -> { t: "term", id } (glossary anchor)
 *   {0} {1} ...                   -> substituted from `params` when provided
 */
export type Node =
  | { t: "text"; v: string }
  | { t: "hl"; v: string; color: string }
  | { t: "term"; v: string; id: string };

export function fillParams(s: string, params?: (string | number)[]): string {
  if (!params) return s;
  return s.replace(/\{(\d+)\}/g, (m, i) => (params[Number(i)] !== undefined ? String(params[Number(i)]) : m));
}

const TAG = /<(color|te|size)(?:=|\s+href=)?([^>]*)>([\s\S]*?)<\/\1>/;

export function parseMarkup(input: string, params?: (string | number)[]): Node[] {
  const out: Node[] = [];
  let rest = fillParams(input, params);
  while (rest.length) {
    const m = TAG.exec(rest);
    if (!m) { out.push({ t: "text", v: rest }); break; }
    if (m.index > 0) out.push({ t: "text", v: rest.slice(0, m.index) });
    const [, tag, attr, inner] = m;
    if (tag === "color") out.push({ t: "hl", v: stripMarkup(inner), color: attr.replace(/["']/g, "") });
    else if (tag === "te") out.push({ t: "term", v: stripMarkup(inner), id: attr.replace(/["']/g, "").replace(/^href=/, "") });
    else out.push(...parseMarkup(inner));
    rest = rest.slice(m.index + m[0].length);
  }
  return out;
}

/** Plain text with all tags removed (and params substituted). */
export function stripMarkup(input: string, params?: (string | number)[]): string {
  let s = fillParams(input, params);
  let prev = "";
  while (prev !== s) { prev = s; s = s.replace(TAG, (_m, _t, _a, inner) => inner); }
  return s.replace(/<\/?[a-z]+[^>]*>/gi, "");
}

/** True when a rendered string still contains unparsed markup or placeholders. */
export const hasMarkup = (s: string) => /<\/?(color|size|te)\b|\{\d+\}/.test(s);
