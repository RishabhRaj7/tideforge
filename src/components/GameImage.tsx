"use client";
import { useState } from "react";
import { ELEMENT_COLOR, ELEMENT_GLYPH } from "@/lib/game";

/** Image with a graceful fallback (monogram on an element-tinted tile). Game art is served from /img when present. */
export function GameImage({ src, alt, element, className = "", rounded = "4px" }: { src?: string | null; alt: string; element?: string; className?: string; rounded?: string }) {
  const [failed, setFailed] = useState(false);
  const color = (element && ELEMENT_COLOR[element]) || "#6fd3e0";
  if (!src || failed) {
    return (
      <div role="img" aria-label={alt} className={`grid place-items-center overflow-hidden ${className}`} style={{ borderRadius: rounded, background: `radial-gradient(circle at 30% 20%, ${color}44, #0d1115 70%)`, color }}>
        <span className="font-display text-2xl font-semibold opacity-80" aria-hidden>
          {element ? ELEMENT_GLYPH[element] : alt.slice(0, 1)}
        </span>
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading="lazy" decoding="async" onError={() => setFailed(true)} className={`object-cover ${className}`} style={{ borderRadius: rounded }} />;
}
