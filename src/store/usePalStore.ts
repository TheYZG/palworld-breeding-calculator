// 全局状态：我的帕鲁集合、筛选条件、展开状态等。

import { create } from "zustand";

export type BreedFilter = "all" | "breedable" | "non-breedable";
export type SortBy = "index" | "name" | "pairs";

interface PalStore {
  myPals: Set<string>;
  searchQuery: string;
  elementFilter: Set<string>;
  breedFilter: BreedFilter;
  expandedChild: string | null;
  togglePal: (slug: string) => void;
  hasPal: (slug: string) => boolean;
  clearMyPals: () => void;
  setSearchQuery: (q: string) => void;
  toggleElement: (id: string) => void;
  clearElementFilter: () => void;
  setBreedFilter: (f: BreedFilter) => void;
  toggleExpand: (slug: string) => void;
}

export const usePalStore = create<PalStore>((set, get) => ({
  myPals: new Set(),
  searchQuery: "",
  elementFilter: new Set(),
  breedFilter: "all",
  expandedChild: null,
  togglePal: (slug) =>
    set((state) => {
      const next = new Set(state.myPals);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return { myPals: next };
    }),
  hasPal: (slug) => get().myPals.has(slug),
  clearMyPals: () => set({ myPals: new Set(), expandedChild: null }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  toggleElement: (id) =>
    set((state) => {
      const next = new Set(state.elementFilter);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { elementFilter: next };
    }),
  clearElementFilter: () => set({ elementFilter: new Set() }),
  setBreedFilter: (f) => set({ breedFilter: f }),
  toggleExpand: (slug) =>
    set((state) => ({
      expandedChild: state.expandedChild === slug ? null : slug,
    })),
}));
