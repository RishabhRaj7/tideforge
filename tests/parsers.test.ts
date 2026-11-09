import { describe, expect, it } from "vitest";
import { parseMultiplier, totalPct } from "../scripts/pipeline/parse/multipliers";
import { fillParams, hasMarkup, parseMarkup, stripMarkup } from "../scripts/pipeline/parse/markup";
import { iconUrl } from "../scripts/pipeline/fetch/nanoka";

describe("parseMultiplier", () => {
  it("parses a single hit", () => {
    expect(parseMultiplier("33.43%")).toEqual({ kind: "pct", hits: [[33.43, 1]] });
  });
  it("parses repeated hits", () => {
    const m = parseMultiplier("19.61%+9.81%*3");
    expect(m).toEqual({ kind: "pct", hits: [[19.61, 1], [9.81, 3]] });
    expect(totalPct(m)).toBeCloseTo(49.04, 4);
  });
  it("parses flat + percent rows (healing / shield)", () => {
    expect(parseMultiplier("600+24.00%")).toEqual({ kind: "flat+pct", flat: 600, pct: 24 });
  });
  it("keeps unknown shapes verbatim instead of guessing", () => {
    expect(parseMultiplier("12s")).toEqual({ kind: "raw", text: "12s" });
    expect(totalPct(parseMultiplier("12s"))).toBeNull();
  });
});

describe("markup", () => {
  it("substitutes params", () => {
    expect(fillParams("stacks up to {0} times for {1}s", [3, "14"])).toBe("stacks up to 3 times for 14s");
    expect(fillParams("keep {2}", [1])).toBe("keep {2}");
  });
  it("strips tags", () => {
    expect(stripMarkup('Gain <color=Highlight>Herald</color> <size=40>now</size>, see <te href=850076>Remnant</te>.')).toBe("Gain Herald now, see Remnant.");
  });
  it("builds an AST with glossary anchors", () => {
    const ast = parseMarkup('A <te href=850076>Remnant</te> and <color=Highlight>X</color>');
    expect(ast).toEqual([
      { t: "text", v: "A " },
      { t: "term", v: "Remnant", id: "850076" },
      { t: "text", v: " and " },
      { t: "hl", v: "X", color: "Highlight" },
    ]);
  });
  it("detects leftovers", () => {
    expect(hasMarkup("<color=Highlight>x</color>")).toBe(true);
    expect(hasMarkup("{0}% ATK")).toBe(true);
    expect(hasMarkup("plain text")).toBe(false);
  });
});

describe("nanoka icon recipe", () => {
  it("maps /Game/Aki/UI paths to CDN webp urls", () => {
    expect(iconUrl("/Game/Aki/UI/UIResources/Common/Image/IconRoleHead256/T_IconRoleHead256_24_UI.T_IconRoleHead256_24_UI")).toBe(
      "https://static.nanoka.cc/assets/ww/UIResources/Common/Image/IconRoleHead256/T_IconRoleHead256_24_UI.webp",
    );
  });
});
