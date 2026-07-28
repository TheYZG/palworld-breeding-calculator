// 全局状态：我的帕鲁集合、筛选条件、展开状态等。
// myPals 通过 zustand persist 中间件自动持久化到 localStorage，刷新后自动恢复。

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type BreedFilter = "all" | "breedable" | "non-breedable";
// 排序键：编号 / 配对数 / 工作技能等级（work_<id>）
export type SortBy = "index" | "pairs" | `work_${string}`;

interface PalStore {
  myPals: Set<string>;
  searchQuery: string;
  elementFilter: Set<string>;
  breedFilter: BreedFilter;
  sortBy: SortBy;
  expandedChild: string | null;
  detailPalSlug: string | null;
  resultSearch: string;
  resultElementFilter: Set<string>;
  togglePal: (slug: string) => void;
  hasPal: (slug: string) => boolean;
  clearMyPals: () => void;
  importPals: (slugs: string[]) => void;
  setSearchQuery: (q: string) => void;
  toggleElement: (id: string) => void;
  clearElementFilter: () => void;
  setBreedFilter: (f: BreedFilter) => void;
  setSortBy: (s: SortBy) => void;
  toggleExpand: (slug: string) => void;
  openDetail: (slug: string) => void;
  closeDetail: () => void;
  setResultSearch: (q: string) => void;
  toggleResultElement: (id: string) => void;
  clearResultElementFilter: () => void;
}

// localStorage 中持久化的形态：myPals 存成数组（Set 不能直接 JSON 序列化）
interface PersistedShape {
  myPals: string[];
}

export const usePalStore = create<PalStore>()(
  persist(
    (set, get) => ({
      myPals: new Set(),
      searchQuery: "",
      elementFilter: new Set(),
      breedFilter: "all",
      sortBy: "index",
      expandedChild: null,
      detailPalSlug: null,
      resultSearch: "",
      resultElementFilter: new Set(),
      togglePal: (slug) =>
        set((state) => {
          const next = new Set(state.myPals);
          if (next.has(slug)) next.delete(slug);
          else next.add(slug);
          return { myPals: next };
        }),
      hasPal: (slug) => get().myPals.has(slug),
      clearMyPals: () => set({ myPals: new Set(), expandedChild: null }),
      importPals: (slugs) => set({ myPals: new Set(slugs), expandedChild: null }),
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
      setSortBy: (s) => set({ sortBy: s }),
      toggleExpand: (slug) =>
        set((state) => ({
          expandedChild: state.expandedChild === slug ? null : slug,
        })),
      openDetail: (slug) => set({ detailPalSlug: slug }),
      closeDetail: () => set({ detailPalSlug: null }),
      setResultSearch: (q) => set({ resultSearch: q }),
      toggleResultElement: (id) =>
        set((state) => {
          const next = new Set(state.resultElementFilter);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return { resultElementFilter: next };
        }),
      clearResultElementFilter: () => set({ resultElementFilter: new Set() }),
    }),
    {
      name: "palworld-breeding:my-pals",
      storage: createJSONStorage(() => localStorage),
      // 只持久化 myPals，其它（搜索/筛选/展开）每次刷新重置
      partialize: (state): PersistedShape => ({
        myPals: Array.from(state.myPals),
      }),
      // 从 localStorage 恢复时，把数组转回 Set
      merge: (persisted, current) => {
        const p = (persisted as Partial<PersistedShape> | undefined) ?? {};
        const arr = Array.isArray(p.myPals) ? p.myPals : [];
        return {
          ...current,
          myPals: new Set(arr),
        };
      },
    },
  ),
);
