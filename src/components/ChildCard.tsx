// 后代卡片：头部展示后代信息与亲代对数量，点击图标弹详情，点击其他区域展开全部亲代组合。
// 2 代+ 后代展开时额外显示完整繁育路径，说明中间代如何获得。

import { useMemo } from "react";
import { ChevronDown } from "lucide-react";
import type { Pal, ParentPair } from "@/lib/types";
import { findBreedPaths, type ReverseIndex } from "@/lib/breedingPath";
import { usePalStore } from "@/store/usePalStore";
import { cn } from "@/lib/utils";
import PalIcon from "./PalIcon";
import ElementBadge from "./ElementBadge";
import PathTree from "./PathTree";

interface Props {
  child: Pal;
  pairs: ParentPair[];
  bySlug: Map<string, Pal>;
  generation?: number;
  reverseIndex: ReverseIndex;
}

export default function ChildCard({ child, pairs, bySlug, generation, reverseIndex }: Props) {
  const expandedChild = usePalStore((s) => s.expandedChild);
  const toggleExpand = usePalStore((s) => s.toggleExpand);
  const openDetail = usePalStore((s) => s.openDetail);
  const myPals = usePalStore((s) => s.myPals);
  const expanded = expandedChild === child.slug;

  // 对 2 代+ 后代，查找一条完整繁育路径（从已有帕鲁逐级配出）
  const path = useMemo(() => {
    if (!generation || generation <= 1) return null;
    const paths = findBreedPaths(child.slug, myPals, reverseIndex, Math.max(3, generation));
    return paths.length > 0 ? paths[0] : null;
  }, [generation, child.slug, myPals, reverseIndex]);

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface transition hover:border-accent/40">
      <div
        role="button"
        tabIndex={0}
        onClick={() => toggleExpand(child.slug)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggleExpand(child.slug);
          }
        }}
        className="flex w-full cursor-pointer items-center gap-3 p-3 text-left"
      >
        {/* 图标：点击弹详情（阻止冒泡到展开） */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            openDetail(child.slug);
          }}
          className="shrink-0 rounded-md outline-none transition hover:ring-2 hover:ring-accent/40 focus:ring-2 focus:ring-accent/60"
          aria-label={`查看 ${child.name} 详情`}
          title="点击查看详情"
        >
          <PalIcon pal={child} size={44} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium text-text">{child.name}</span>
            {child.index > 0 && (
              <span className="shrink-0 font-mono text-xs text-text-muted">
                #{child.index}
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-2">
            {child.elements.map((e) => (
              <ElementBadge key={e.id} elementId={e.id} size="xs" />
            ))}
            {!child.isBreed && (
              <span className="rounded bg-accent-soft px-1.5 text-[10px] text-accent">
                特殊配种
              </span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {generation && generation > 1 && (
            <span
              className="rounded-full border border-accent/30 bg-accent-soft/50 px-2 py-0.5 text-[10px] font-medium text-accent"
              title={`需要 ${generation} 步繁育才能获得`}
            >
              第{generation}代
            </span>
          )}
          <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">
            {pairs.length} 组
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-text-muted transition-transform",
              expanded && "rotate-180",
            )}
          />
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border bg-surface-2/40 p-3 animate-fade-in">
          {path && (
            <div className="mb-3">
              <div className="mb-2 text-xs text-text-muted">
                完整繁育路径（从已有帕鲁逐级配出）
              </div>
              <PathTree node={path.root} bySlug={bySlug} onPalClick={openDetail} />
            </div>
          )}
          <div className="mb-2 text-xs text-text-muted">
            可达成 {child.name} 的亲代组合（共 {pairs.length} 组）
          </div>
          <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
            {pairs.map(([f, m], i) => {
              const fp = bySlug.get(f);
              const mp = bySlug.get(m);
              if (!fp || !mp) return null;
              return (
                <div
                  key={`${f}-${m}-${i}`}
                  className="flex items-center gap-1.5 rounded bg-surface p-2"
                >
                  <ParentButton
                    pal={fp}
                    isMiddle={!myPals.has(f)}
                    onClick={() => openDetail(fp.slug)}
                  />
                  <span className="text-sm text-text-muted">+</span>
                  <ParentButton
                    pal={mp}
                    isMiddle={!myPals.has(m)}
                    onClick={() => openDetail(mp.slug)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// 亲代按钮：中间代（用户未拥有、需先配出）加角标"中"与琥珀色边框以示区分。
function ParentButton({
  pal,
  isMiddle,
  onClick,
}: {
  pal: Pal;
  isMiddle: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative shrink-0 rounded outline-none transition hover:ring-2 hover:ring-accent/40 focus:ring-2 focus:ring-accent/60",
        isMiddle && "ring-1 ring-amber-500/50",
      )}
      title={isMiddle ? `${pal.name}（中间代，需先配出）` : `查看 ${pal.name} 详情`}
      aria-label={`查看 ${pal.name} 详情`}
    >
      <PalIcon pal={pal} size={32} showName />
      {isMiddle && (
        <span className="absolute -right-1 -top-1 rounded-full bg-amber-500 px-1 text-[9px] font-medium leading-tight text-white">
          中
        </span>
      )}
    </button>
  );
}

