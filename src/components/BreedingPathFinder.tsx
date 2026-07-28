// 配种链查找器：输入目标帕鲁，展示从"我的帕鲁"到目标的繁育路径。

import { useMemo, useState } from "react";
import { Search, Route, X } from "lucide-react";
import type { Pal, BreedingByFather, PalDetailsMap, PalStats, WorkType } from "@/lib/types";
import { usePalStore } from "@/store/usePalStore";
import { buildReverseIndex, findBreedPaths, type BreedPath, type PathNode } from "@/lib/breedingPath";
import PalIcon from "./PalIcon";

interface Props {
  myPals: Set<string>;
  bySlug: Map<string, Pal>;
  breedingByFather: BreedingByFather;
  palDetails?: PalDetailsMap;
  palStats?: PalStats;
  workTypes?: WorkType[];
}

export default function BreedingPathFinder({ myPals, bySlug, breedingByFather }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [targetSlug, setTargetSlug] = useState<string | null>(null);
  const openDetail = usePalStore((s) => s.openDetail);

  const reverseIndex = useMemo(
    () => buildReverseIndex(breedingByFather),
    [breedingByFather],
  );

  const paths = useMemo<BreedPath[]>(() => {
    if (!targetSlug) return [];
    return findBreedPaths(targetSlug, myPals, reverseIndex, 3);
  }, [targetSlug, myPals, reverseIndex]);

  // 搜索候选帕鲁（排除已有的，因为已有就不需要"配出来"了）
  const candidates = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.trim();
    const arr: Pal[] = [];
    for (const p of bySlug.values()) {
      if (myPals.has(p.slug)) continue;
      if (!p.isBreed) continue;
      const numMatch = String(p.index) === q;
      const nameMatch = p.name.includes(q);
      const slugMatch = p.slug.includes(q.toLowerCase());
      if (numMatch || nameMatch || slugMatch) arr.push(p);
    }
    arr.sort((a, b) => {
      const ai = a.index > 0 ? a.index : 9999;
      const bi = b.index > 0 ? b.index : 9999;
      return ai - bi;
    });
    return arr.slice(0, 8);
  }, [query, bySlug, myPals]);

  if (myPals.size === 0) return null;

  return (
    <div className="border-b border-border bg-surface-2/30">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-text-muted transition hover:text-text"
      >
        <Route className="h-4 w-4" />
        <span>配种链查找器</span>
        <span className="text-xs">输入目标帕鲁，查看多代繁育路径</span>
      </button>

      {open && (
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索想要配出的帕鲁"
              className="w-full rounded border border-border bg-surface py-1.5 pl-9 pr-9 text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => { setQuery(""); setTargetSlug(null); }}
                aria-label="清除"
                className="absolute right-2 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded text-text-muted hover:bg-surface-2 hover:text-text"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* 搜索候选 */}
          {query && !targetSlug && (
            <div className="mt-2 space-y-1">
              {candidates.length === 0 ? (
                <div className="py-2 text-center text-xs text-text-muted">无匹配帕鲁</div>
              ) : (
                candidates.map((p) => (
                  <button
                    key={p.slug}
                    type="button"
                    onClick={() => setTargetSlug(p.slug)}
                    className="flex w-full items-center gap-2 rounded p-1.5 text-left transition hover:bg-surface"
                  >
                    <PalIcon pal={p} size={28} />
                    <div className="flex-1">
                      <span className="text-sm text-text">{p.name}</span>
                      {p.index > 0 && (
                        <span className="ml-2 font-mono text-xs text-text-muted">
                          #{p.index}
                        </span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {/* 路径结果 */}
          {targetSlug && (
            <div className="mt-3">
              {paths.length === 0 ? (
                <div className="rounded-lg bg-surface p-3 text-center text-xs text-text-muted">
                  无法从当前拥有的帕鲁配出 {bySlug.get(targetSlug)?.name ?? targetSlug}
                  <br />
                  尝试添加更多帕鲁，或检查目标是否为可繁育帕鲁。
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-xs text-text-muted">
                    找到 {paths.length} 条路径（最多 3 代繁育）
                  </div>
                  {paths.map((path, i) => (
                    <PathTree
                      key={i}
                      node={path.root}
                      bySlug={bySlug}
                      onPalClick={openDetail}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PathTree({
  node,
  bySlug,
  onPalClick,
  depth = 0,
}: {
  node: PathNode;
  bySlug: Map<string, Pal>;
  onPalClick: (slug: string) => void;
  depth?: number;
}) {
  const pal = bySlug.get(node.pal);
  if (!pal) return null;

  if (node.type === "owned") {
    return (
      <div
        className="flex items-center gap-1.5 rounded bg-accent-soft/60 p-1.5"
        style={{ marginLeft: depth * 24 }}
      >
        <span className="text-xs text-accent">已有</span>
        <button
          type="button"
          onClick={() => onPalClick(node.pal)}
          className="rounded outline-none hover:ring-2 hover:ring-accent/40"
        >
          <PalIcon pal={pal} size={28} showName />
        </button>
      </div>
    );
  }

  // breed 节点：展示 [子代] = [父] + [母]
  return (
    <div style={{ marginLeft: depth * 24 }}>
      <div className="flex flex-wrap items-center gap-2 rounded border border-border bg-surface p-2">
        <button
          type="button"
          onClick={() => onPalClick(node.pal)}
          className="rounded outline-none hover:ring-2 hover:ring-accent/40"
          title={`查看 ${pal.name} 详情`}
        >
          <PalIcon pal={pal} size={36} showName />
        </button>
        <span className="text-text-muted">=</span>
        {node.children?.map((child, i) => (
          <div key={i} className="flex items-center gap-2">
            {i > 0 && <span className="text-text-muted">+</span>}
            <ChildNode
              node={child}
              bySlug={bySlug}
              onPalClick={onPalClick}
              depth={depth + 1}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function ChildNode({
  node,
  bySlug,
  onPalClick,
  depth,
}: {
  node: PathNode;
  bySlug: Map<string, Pal>;
  onPalClick: (slug: string) => void;
  depth: number;
}) {
  const pal = bySlug.get(node.pal);
  if (!pal) return null;

  if (node.type === "owned") {
    return (
      <button
        type="button"
        onClick={() => onPalClick(node.pal)}
        className="flex items-center gap-1.5 rounded bg-accent-soft/60 px-1.5 py-1 outline-none hover:ring-2 hover:ring-accent/40"
        title="已有"
      >
        <PalIcon pal={pal} size={28} showName />
      </button>
    );
  }

  // breed 子节点：递归展示
  return (
    <PathTree node={node} bySlug={bySlug} onPalClick={onPalClick} depth={depth} />
  );
}
