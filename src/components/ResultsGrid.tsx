// 结果区：可繁育后代卡片网格 + 统计 + 空状态。已排除"我的帕鲁"中已有的后代。
// 支持按编号 / 配对数 / 各工作技能等级排序。

import { useMemo } from "react";
import { Egg } from "lucide-react";
import type { Pal, ParentPair, PalStats, WorkType } from "@/lib/types";
import type { BreedableResult } from "@/lib/breeding";
import { usePalStore, type SortBy } from "@/store/usePalStore";
import ChildCard from "./ChildCard";
import EmptyState from "./EmptyState";

interface Props {
  result: BreedableResult;
  bySlug: Map<string, Pal>;
  palStats: PalStats;
  workTypes: WorkType[];
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
  hasMyPals,
}: Props) {
  const myPals = usePalStore((s) => s.myPals);
  const sortBy = usePalStore((s) => s.sortBy);
  const setSortBy = usePalStore((s) => s.setSortBy);

  const entries = useMemo<Entry[]>(() => {
    const arr: Entry[] = [];
    for (const [slug, pairs] of result) {
      // 排除已拥有的帕鲁：只显示"新可获得的"后代
      if (myPals.has(slug)) continue;
      const pal = bySlug.get(slug);
      if (pal) arr.push({ pal, pairs });
    }
    arr.sort((a, b) => compareEntries(a, b, sortBy, palStats));
    return arr;
  }, [result, bySlug, myPals, sortBy, palStats]);

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
          <SortSelect
            value={sortBy}
            onChange={setSortBy}
            workTypes={workTypes}
          />
        </div>
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
    // 同等级按编号
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
