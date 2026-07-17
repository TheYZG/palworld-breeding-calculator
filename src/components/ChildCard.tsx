// 后代卡片：头部展示后代信息与亲代对数量，点击图标弹详情，点击其他区域展开全部亲代组合。

import { ChevronDown } from "lucide-react";
import type { Pal, ParentPair } from "@/lib/types";
import { usePalStore } from "@/store/usePalStore";
import { cn } from "@/lib/utils";
import PalIcon from "./PalIcon";
import ElementBadge from "./ElementBadge";

interface Props {
  child: Pal;
  pairs: ParentPair[];
  bySlug: Map<string, Pal>;
}

export default function ChildCard({ child, pairs, bySlug }: Props) {
  const expandedChild = usePalStore((s) => s.expandedChild);
  const toggleExpand = usePalStore((s) => s.toggleExpand);
  const openDetail = usePalStore((s) => s.openDetail);
  const expanded = expandedChild === child.slug;

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
                  <button
                    type="button"
                    onClick={() => openDetail(fp.slug)}
                    className="shrink-0 rounded outline-none transition hover:ring-2 hover:ring-accent/40 focus:ring-2 focus:ring-accent/60"
                    title={`查看 ${fp.name} 详情`}
                    aria-label={`查看 ${fp.name} 详情`}
                  >
                    <PalIcon pal={fp} size={32} showName />
                  </button>
                  <span className="text-sm text-text-muted">+</span>
                  <button
                    type="button"
                    onClick={() => openDetail(mp.slug)}
                    className="shrink-0 rounded outline-none transition hover:ring-2 hover:ring-accent/40 focus:ring-2 focus:ring-accent/60"
                    title={`查看 ${mp.name} 详情`}
                    aria-label={`查看 ${mp.name} 详情`}
                  >
                    <PalIcon pal={mp} size={32} showName />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
