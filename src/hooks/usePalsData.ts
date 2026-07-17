// 加载帕鲁图鉴、配种表、工作技能数据。

import { useEffect, useState } from "react";
import type { Pal, BreedingByFather, PalStats, WorkType } from "@/lib/types";

interface PalsDataState {
  pals: Pal[];
  bySlug: Map<string, Pal>;
  breedingByFather: BreedingByFather;
  palStats: PalStats;
  workTypes: WorkType[];
  loading: boolean;
  error: string | null;
}

const INITIAL: PalsDataState = {
  pals: [],
  bySlug: new Map(),
  breedingByFather: {},
  palStats: {},
  workTypes: [],
  loading: true,
  error: null,
};

export function usePalsData(): PalsDataState {
  const [state, setState] = useState<PalsDataState>(INITIAL);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // base 路径前缀（开发环境为 "/"，部署到 GitHub Pages 子路径时为 "/repo-name/"）
        const base = import.meta.env.BASE_URL;
        const [palsRes, breedRes, statsRes, workTypesRes] = await Promise.all([
          fetch(`${base}data/pals.json`),
          fetch(`${base}data/breeding_by_father.json`),
          fetch(`${base}data/pal_stats.json`),
          fetch(`${base}data/work_types.json`),
        ]);
        if (!palsRes.ok || !breedRes.ok) {
          throw new Error("数据加载失败");
        }
        const raw: Pal[] = await palsRes.json();
        const breedingByFather: BreedingByFather = await breedRes.json();
        // pal_stats / work_types 可能不存在（爬虫未运行时），缺失时给空值
        const palStats: PalStats = statsRes.ok ? await statsRes.json() : {};
        const workTypes: WorkType[] = workTypesRes.ok ? await workTypesRes.json() : [];
        // 数据中 icon 字段为 "pal_icons/xxx.webp"，实际位于 /data/pal_icons/
        const pals = raw.map((p) => ({ ...p, icon: `${base}data/${p.icon}` }));
        const bySlug = new Map<string, Pal>();
        for (const p of pals) bySlug.set(p.slug, p);
        if (cancelled) return;
        setState({ pals, bySlug, breedingByFather, palStats, workTypes, loading: false, error: null });
      } catch (e) {
        if (cancelled) return;
        setState((s) => ({ ...s, loading: false, error: (e as Error).message }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
