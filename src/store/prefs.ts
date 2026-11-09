"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type Prefs = {
  roster: string[]; // owned Resonator slugs (local-first, no account needed)
  motion: "full" | "reduced";
  toggleOwned: (slug: string) => void;
  setMotion: (m: "full" | "reduced") => void;
};

export const usePrefs = create<Prefs>()(
  persist(
    (set, get) => ({
      roster: [],
      motion: "full",
      toggleOwned: (slug) => set({ roster: get().roster.includes(slug) ? get().roster.filter((s) => s !== slug) : [...get().roster, slug] }),
      setMotion: (motion) => set({ motion }),
    }),
    { name: "tideforge-prefs-v1", skipHydration: false },
  ),
);
