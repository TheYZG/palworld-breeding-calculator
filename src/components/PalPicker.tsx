// 帕鲁选择器：搜索 + 繁殖筛选 + 属性筛选 + 网格。

import { useMemo } from "react";
import { Search, X, Info } from "lucide-react";
import type { Pal } from "@/lib/types";
import { usePalStore, type BreedFilter } from "@/store/usePalStore";
import { cn } from "@/lib/utils";
import PalIcon from "./PalIcon";
import ElementFilter from "./ElementFilter";

interface Props {
  pals: Pal[];
}

const BREED_OPTIONS: { value: BreedFilter; label: string }[] = [
  { value: "all", label: "全部" },
  { value: "breedable", label: "可繁殖" },
  { value: "non-breedable", label: "不可繁殖" },
];

export default function PalPicker({ pals }: Props) {
  const searchQuery = usePalStore((s) => s.searchQuery);
  const setSearchQuery = usePalStore((s) => s.setSearchQuery);
  const breedFilter = usePalStore((s) => s.breedFilter);
  const setBreedFilter = usePalStore((s) => s.setBreedFilter);
  const elementFilter = usePalStore((s) => s.elementFilter);
  const myPals = usePalStore((s) => s.myPals);
  const togglePal = usePalStore((s) => s.togglePal);
  const openDetail = usePalStore((s) => s.openDetail);

  const filtered = useMemo(() => {
    const q = searchQuery.trim();
    const list = pals.filter((p) => {
      if (q) {
        const numMatch = String(p.index) === q;
        const nameMatch = p.name.includes(q);
        const slugMatch = p.slug.includes(q.toLowerCase());
        if (!numMatch && !nameMatch && !slugMatch) return false;
      }
      if (breedFilter === "breedable" && !p.isBreed) return false;
      if (breedFilter === "non-breedable" && p.isBreed) return false;
      if (elementFilter.size > 0) {
        const has = p.elements.some((e) => elementFilter.has(e.id));
        if (!has) return false;
      }
      return true;
    });
    list.sort((a, b) => {
      const ai = a.index > 0 ? a.index : 9999;
      const bi = b.index > 0 ? b.index : 9999;
      return ai - bi;
    });
    return list;
  }, [pals, searchQuery, breedFilter, elementFilter]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="relative shrink-0">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜索名称或编号"
          className="w-full rounded border border-border bg-surface py-2 pl-9 pr-9 text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            aria-label="清除搜索"
            className="absolute right-2 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded text-text-muted hover:bg-surface-2 hover:text-text"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="mt-3 shrink-0 space-y-2">
        <div className="flex gap-1">
          {BREED_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setBreedFilter(opt.value)}
              className={cn(
                "rounded px-2 py-0.5 text-xs transition",
                breedFilter === opt.value
                  ? "bg-accent text-white"
                  : "bg-surface-2 text-text-muted hover:text-text",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <ElementFilter />
      </div>

      <div className="mt-2 shrink-0 text-xs text-text-muted">
        共 {filtered.length} 只
        {myPals.size > 0 && <span className="ml-2 text-accent">已选 {myPals.size}</span>}
      </div>

      <div className="mt-2 min-h-0 flex-1 overflow-y-auto">
        <div className="grid grid-cols-4 gap-1 sm:grid-cols-5">
          {filtered.map((p) => (
            <div key={p.slug} className="group relative">
              <button
                type="button"
                onClick={() => togglePal(p.slug)}
                className="w-full rounded transition hover:bg-surface-2"
              >
                <PalIcon
                  pal={p}
                  size={52}
                  showName
                  showIndex
                  selected={myPals.has(p.slug)}
                />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openDetail(p.slug);
                }}
                className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-surface/80 text-text-muted opacity-0 transition hover:bg-accent hover:text-white group-hover:opacity-100"
                aria-label={`查看 ${p.name} 详情`}
                title="查看详情"
              >
                <Info className="h-2.5 w-2.5" />
              </button>
            </div>
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="py-10 text-center text-sm text-text-muted">
            无匹配帕鲁
          </div>
        )}
      </div>
    </div>
  );
}
