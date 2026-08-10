import { create } from "zustand";
import { persist } from "zustand/middleware";

type CompareStore = {
  slugs: string[];
  add: (slug: string) => void;
  remove: (slug: string) => void;
  clear: () => void;
  has: (slug: string) => boolean;
};

const MAX_COMPARE = 3;

export const useCompare = create<CompareStore>()(
  persist(
    (set, get) => ({
      slugs: [],
      add: (slug: string) => {
        const { slugs } = get();
        if (slugs.length >= MAX_COMPARE || slugs.includes(slug)) return;
        set({ slugs: [...slugs, slug] });
      },
      remove: (slug: string) => set({ slugs: get().slugs.filter((s: string) => s !== slug) }),
      clear: () => set({ slugs: [] }),
      has: (slug: string) => get().slugs.includes(slug),
    }),
    { name: "at-compare" },
  ),
);

export { MAX_COMPARE };
