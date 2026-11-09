import type { DmgTag, Scaling } from "./types";

/** Which DMG-bonus tag a hit row belongs to, from its skill type and label. */
export function inferTag(skillType: string, label: string): DmgTag {
  const lab = label.toLowerCase();
  if (skillType === "Basic Attack") return lab.includes("heavy") || lab.includes("charged") || lab.includes("aimed") ? "heavy" : "basic";
  if (skillType === "Resonance Skill") return "skill";
  if (skillType === "Resonance Liberation") return "lib";
  if (skillType === "Intro Skill") return "intro";
  if (skillType === "Outro Skill") return "outro";
  if (lab.includes("heavy")) return "heavy";
  if (lab.includes("basic")) return "basic";
  if (lab.includes("liberation")) return "lib";
  if (lab.includes("intro")) return "intro";
  if (lab.includes("outro")) return "outro";
  if (lab.includes("echo")) return "echoSkill";
  return "skill";
}

/** Which base stat a row scales with. Detected from the label ("%HP", "DEF" ...); defaults to ATK. */
export function inferScaling(label: string): Scaling {
  if (/atk/i.test(label)) return "atk";
  if (/\bhp\b/i.test(label)) return "hp";
  if (/\bdef\b/i.test(label)) return "def";
  return "atk";
}
