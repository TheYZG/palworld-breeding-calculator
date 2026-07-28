// 帕鲁详情弹窗：展示选中帕鲁的工作技能等级、统计数据、伙伴技能、被动技能。

import { useEffect } from "react";
import { X, Info } from "lucide-react";
import type { Pal, PalStats, WorkType, PalDetailsMap } from "@/lib/types";
import { usePalStore } from "@/store/usePalStore";
import { cn } from "@/lib/utils";
import PalIcon from "./PalIcon";
import ElementBadge from "./ElementBadge";

interface Props {
  bySlug: Map<string, Pal>;
  palStats: PalStats;
  workTypes: WorkType[];
  palDetails: PalDetailsMap;
}

export default function PalDetailModal({ bySlug, palStats, workTypes, palDetails }: Props) {
  const detailPalSlug = usePalStore((s) => s.detailPalSlug);
  const closeDetail = usePalStore((s) => s.closeDetail);
  const pal: Pal | undefined = detailPalSlug ? bySlug.get(detailPalSlug) : undefined;

  // ESC 关闭
  useEffect(() => {
    if (!pal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDetail();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [pal, closeDetail]);

  if (!pal) return null;

  const works = palStats[pal.slug] ?? {};
  const details = palDetails[pal.slug];
  const stats = details?.stats ?? {};
  const partnerSkill = details?.partnerSkill ?? null;
  const passiveSkills = details?.passiveSkills ?? [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in"
      onClick={closeDetail}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-border bg-surface shadow-2xl animate-pop"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 顶部 */}
        <div className="sticky top-0 z-10 flex items-start gap-3 border-b border-border bg-surface-2/95 p-4 backdrop-blur">
          <PalIcon pal={pal} size={56} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="truncate font-serif text-lg font-bold text-text">
                {pal.name}
              </h2>
              {pal.index > 0 && (
                <span className="shrink-0 font-mono text-xs text-text-muted">
                  #{pal.index}
                  {pal.indexSuffix}
                </span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              {pal.elements.map((e) => (
                <ElementBadge key={e.id} elementId={e.id} size="xs" />
              ))}
              {!pal.isBreed && (
                <span className="rounded bg-accent-soft px-1.5 text-[10px] text-accent">
                  特殊配种
                </span>
              )}
            </div>
            {pal.partnerSkillName && (
              <div className="mt-1.5 text-xs text-text-muted">
                伙伴技能 · {pal.partnerSkillName}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={closeDetail}
            className="shrink-0 rounded-md p-1 text-text-muted transition hover:bg-surface-2 hover:text-text"
            aria-label="关闭"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-4">
          {/* 统计数据 */}
          {Object.keys(stats).length > 0 && (
            <section>
              <h3 className="mb-2 font-serif text-sm font-bold text-text">统计数据</h3>
              <div className="grid grid-cols-2 gap-1.5">
                {Object.entries(stats).map(([name, val]) => (
                  <div
                    key={name}
                    className="flex items-center justify-between rounded border border-border bg-surface-2/40 px-2.5 py-1.5"
                  >
                    <span className="text-xs text-text">{name}</span>
                    <span className="font-mono text-xs font-medium text-text">
                      {val}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 工作适用性 */}
          <section>
            <h3 className="mb-2 font-serif text-sm font-bold text-text">工作适用性</h3>
            {workTypes.length === 0 ? (
              <div className="flex items-center gap-2 rounded-lg bg-surface-2/60 p-3 text-xs text-text-muted">
                <Info className="h-3.5 w-3.5 shrink-0" />
                工作技能数据未加载。
              </div>
            ) : Object.keys(works).length === 0 ? (
              <div className="rounded-lg bg-surface-2/60 p-3 text-xs text-text-muted">
                该帕鲁暂无工作技能。
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {workTypes.map((wt) => {
                  const lvl = works[wt.id];
                  if (!lvl) return null;
                  return (
                    <div
                      key={wt.id}
                      className="flex items-center justify-between rounded-lg border border-border bg-surface-2/40 px-2.5 py-2"
                    >
                      <span className="text-xs text-text">{wt.name}</span>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span
                            key={i}
                            className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              i < lvl ? "bg-accent" : "bg-border",
                            )}
                          />
                        ))}
                        <span className="ml-1 font-mono text-[10px] text-accent">
                          Lv{lvl}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* 伙伴技能 */}
          {partnerSkill && (
            <section>
              <h3 className="mb-2 font-serif text-sm font-bold text-text">伙伴技能</h3>
              <div className="rounded-lg border border-border bg-surface-2/40 p-3">
                <div className="font-medium text-sm text-text">{partnerSkill.name}</div>
                <p className="mt-1 text-xs leading-relaxed text-text-muted">
                  {partnerSkill.desc}
                </p>
              </div>
            </section>
          )}

          {/* 被动技能 */}
          {passiveSkills.length > 0 && (
            <section>
              <h3 className="mb-2 font-serif text-sm font-bold text-text">被动技能</h3>
              <div className="space-y-1.5">
                {passiveSkills.map((ps, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-border bg-surface-2/40 p-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-text">{ps.name}</span>
                      <span className="flex items-center gap-0.5">
                        {Array.from({ length: 4 }).map((_, j) => (
                          <span
                            key={j}
                            className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              j < ps.rank ? "bg-accent" : "bg-border",
                            )}
                          />
                        ))}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-text-muted">
                      {ps.desc}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
