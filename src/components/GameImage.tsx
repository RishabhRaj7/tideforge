"use client";
import { useState } from "react";
import { ELEMENT_COLOR, ELEMENT_GLYPH } from "@/lib/game";

/**
 * Game art with a graceful fallback (glyph/monogram on an element-tinted tile).
 * Art is mirrored into /img by `npm run data:images` (see docs/ARCHITECTURE.md); it is never hot-linked.
 *
 * - `portrait`: tall transparent character art, anchored to the top so faces are never cropped,
 *   drawn over an element-tinted gradient.
 * - `icon`: square item art (weapons, echoes, sonatas) shown whole on a subtle tile.
 */
export function GameImage({
  src, alt, element, className = "", rounded = "4px", variant = "portrait",
}: { src?: string | null; alt: string; element?: string; className?: string; rounded?: string; variant?: "portrait" | "icon" }) {
  const [failed, setFailed] = useState(false);
  const color = (element && ELEMENT_COLOR[element]) || "#6fd3e0";
  const bg = `radial-gradient(circle at 50% 18%, ${color}55, ${color}12 45%, #0b0f13 85%)`;
  if (!src || failed) {
    return (
      <div role="img" aria-label={alt} className={`grid place-items-center overflow-hidden ${className}`} style={{ borderRadius: rounded, background: bg, color }}>
        <span className="font-display text-2xl font-semibold opacity-80" aria-hidden>
          {element ? ELEMENT_GLYPH[element] : alt.slice(0, 1)}
        </span>
      </div>
    );
  }
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ borderRadius: rounded, background: bg }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        className={`absolute inset-0 h-full w-full ${variant === "portrait" ? "object-cover object-top" : "object-contain p-[8%]"}`}
      />
    </div>
  );
}

/** Real element icon (mirrored from the game) with the shape glyph as a text/alt fallback. */
export function ElementIcon({ element, size = 16, className = "" }: { element: string; size?: number; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <span aria-hidden className={`font-mono ${className}`} style={{ color: ELEMENT_COLOR[element] }}>{ELEMENT_GLYPH[element]}</span>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`/img/elements/${element.toLowerCase()}.webp`} alt="" aria-hidden width={size} height={size} onError={() => setFailed(true)} className={`inline-block shrink-0 ${className}`} style={{ width: size, height: size }} />;
}
