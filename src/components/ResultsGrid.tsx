// 结果区：可繁育后代卡片网格 + 统计 + 空状态。
// 已排除"我的帕鲁"中已有的后代。
// 支持按编号 / 配对数 / 各工作技能等级排序。
// 支持反向查询搜索（按后代名称/编号筛选）和元素筛选。

import { useMemo } from "react";
import { Egg, Search, X } from "lucide-react";
import type { Pal, ParentPair, PalStats, WorkType, PalDetailsMap } from "@/lib/types";
import type { BreedableResult } from "@/lib/breeding";
import { usePalStore, type SortBy } from "@/store/usePalStore";
import ChildCard from "./ChildCard";
import EmptyState from "./EmptyState";
import ElementFilter from "./ElementFilter";

interface Props {
  result: BreedableResult;
  bySlug: Map<string, Pal>;
  palStats: PalStats;
  workTypes: WorkType[];
  palDetails: PalDetailsMap;
  hasMyPals: boolean;
}

interface Entry {
  pal: Pal;
  pairs: ParentPair[];
}

export default function ResultsGrid({
  result,
  bySlug,
  palStats,
  workTypes,
  palDetails,
  hasMyPals,
}: Props) {
  const myPals = usePalStore((s) => s.myPals);
  const sortBy = usePalStore((s) => s.sortBy);
  const setSortBy = usePalStore((s) => s.setSortBy);
  const resultSearch = usePalStore((s) => s.resultSearch);
  const setResultSearch = usePalStore((s) => s.setResultSearch);
  const resultElementFilter = usePalStore((s) => s.resultElementFilter);

  const entries = useMemo<Entry[]>(() => {
    const arr: Entry[] = [];
    const q = resultSearch.trim();
    for (const [slug, pairs] of result) {
      // 排除已拥有的帕鲁：只显示"新可获得的"后代
      if (myPals.has(slug)) continue;
      const pal = bySlug.get(slug);
      if (!pal) continue;
      // 反向查询搜索：按名称/编号/slug 筛选
      if (q) {
        const numMatch = String(pal.index) === q;
        const nameMatch = pal.name.includes(q);
        const slugMatch = pal.slug.includes(q.toLowerCase());
        if (!numMatch && !nameMatch && !slugMatch) continue;
      }
      // 元素筛选
      if (resultElementFilter.size > 0) {
        const has = pal.elements.some((e) => resultElementFilter.has(e.id));
        if (!has) continue;
      }
      arr.push({ pal, pairs });
    }
    arr.sort((a, b) => compareEntries(a, b, sortBy, palStats));
    return arr;
  }, [result, bySlug, myPals, sortBy, palStats, resultSearch, resultElementFilter]);

  if (!hasMyPals) {
    return (
      <EmptyState
        title="还没有添加帕鲁"
        desc="在左侧选择器中点击你拥有的帕鲁，这里会实时显示你能繁育出的全部后代及其亲代组合。"
      />
    );
  }
  if (entries.length === 0) {
    return (
      <EmptyState
        title="暂无新的可繁育后代"
        desc="当前可繁育的后代你都已拥有，尝试再添加几只帕鲁以解锁更多组合。"
        icon={Egg}
      />
    );
  }

  return (
    <div className="p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-serif text-base font-bold text-text">可繁育后代</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-muted">{entries.length} 种</span>
          <SortSelect value={sortBy} onChange={setSortBy} workTypes={workTypes} />
        </div>
      </div>

      {/* 反向查询搜索 + 元素筛选 */}
      <div className="mb-3 space-y-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            value={resultSearch}
            onChange={(e) => setResultSearch(e.target.value)}
            placeholder="搜索目标帕鲁名称或编号"
            className="w-full rounded border border-border bg-surface py-1.5 pl-9 pr-9 text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none"
          />
          {resultSearch && (
            <button
              type="button"
              onClick={() => setResultSearch("")}
              aria-label="清除搜索"
              className="absolute right-2 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded text-text-muted hover:bg-surface-2 hover:text-text"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <ElementFilter target="result" />
      </div>

      <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
        {entries.map(({ pal, pairs }) => (
          <ChildCard
            key={pal.slug}
            child={pal}
            pairs={pairs}
            bySlug={bySlug}
          />
        ))}
      </div>
    </div>
  );
}

function compareEntries(
  a: Entry,
  b: Entry,
  sortBy: SortBy,
  palStats: PalStats,
): number {
  if (sortBy === "index") {
    const ai = a.pal.index > 0 ? a.pal.index : 9999;
    const bi = b.pal.index > 0 ? b.pal.index : 9999;
    if (ai !== bi) return ai - bi;
    return b.pairs.length - a.pairs.length;
  }
  if (sortBy === "pairs") {
    if (a.pairs.length !== b.pairs.length) {
      return b.pairs.length - a.pairs.length;
    }
    const ai = a.pal.index > 0 ? a.pal.index : 9999;
    const bi = b.pal.index > 0 ? b.pal.index : 9999;
    return ai - bi;
  }
  // work_<id>：按对应工作等级降序，没该工作的排后面
  if (sortBy.startsWith("work_")) {
    const wid = sortBy.slice(5);
    const al = palStats[a.pal.slug]?.[wid] ?? 0;
    const bl = palStats[b.pal.slug]?.[wid] ?? 0;
    if (al !== bl) return bl - al;
    const ai = a.pal.index > 0 ? a.pal.index : 9999;
    const bi = b.pal.index > 0 ? b.pal.index : 9999;
    return ai - bi;
  }
  return 0;
}

interface SortSelectProps {
  value: SortBy;
  onChange: (s: SortBy) => void;
  workTypes: WorkType[];
}

function SortSelect({ value, onChange, workTypes }: SortSelectProps) {
  return (
    <label className="flex items-center gap-1.5 text-xs text-text-muted">
      <span>排序</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortBy)}
        className="rounded-md border border-border bg-surface px-2 py-1 text-xs text-text outline-none transition focus:border-accent"
      >
        <option value="index">按编号</option>
        <option value="pairs">按配对数</option>
        {workTypes.map((wt) => (
          <option key={wt.id} value={`work_${wt.id}`}>
            按{wt.name}等级
          </option>
        ))}
      </select>
    </label>
  );
}
