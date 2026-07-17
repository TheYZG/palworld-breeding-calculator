// 结果区：可繁育后代卡片网格 + 统计 + 空状态。已排除"我的帕鲁"中已有的后代。

import { useMemo } from "react";
import { Egg } from "lucide-react";
import type { Pal, ParentPair } from "@/lib/types";
import type { BreedableResult } from "@/lib/breeding";
import { usePalStore } from "@/store/usePalStore";
import ChildCard from "./ChildCard";
import EmptyState from "./EmptyState";

interface Props {
  result: BreedableResult;
  bySlug: Map<string, Pal>;
  hasMyPals: boolean;
}

interface Entry {
  pal: Pal;
  pairs: ParentPair[];
}

export default function ResultsGrid({ result, bySlug, hasMyPals }: Props) {
  const myPals = usePalStore((s) => s.myPals);

  const entries = useMemo<Entry[]>(() => {
    const arr: Entry[] = [];
    for (const [slug, pairs] of result) {
      // 排除已拥有的帕鲁：只显示"新可获得的"后代
      if (myPals.has(slug)) continue;
      const pal = bySlug.get(slug);
      if (pal) arr.push({ pal, pairs });
    }
    arr.sort((a, b) => {
      const ai = a.pal.index > 0 ? a.pal.index : 9999;
      const bi = b.pal.index > 0 ? b.pal.index : 9999;
      if (ai !== bi) return ai - bi;
      return b.pairs.length - a.pairs.length;
    });
    return arr;
  }, [result, bySlug, myPals]);

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
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-serif text-base font-bold text-text">可繁育后代</h2>
        <span className="text-sm text-text-muted">
          {entries.length} 种（已排除已有）
        </span>
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
