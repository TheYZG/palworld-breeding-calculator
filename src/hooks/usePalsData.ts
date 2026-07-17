// 加载帕鲁图鉴与配种表数据。

import { useEffect, useState } from "react";
import type { Pal, BreedingByFather } from "@/lib/types";

interface PalsDataState {
  pals: Pal[];
  bySlug: Map<string, Pal>;
  breedingByFather: BreedingByFather;
  loading: boolean;
  error: string | null;
}

const INITIAL: PalsDataState = {
  pals: [],
  bySlug: new Map(),
  breedingByFather: {},
  loading: true,
  error: null,
};

export function usePalsData(): PalsDataState {
  const [state, setState] = useState<PalsDataState>(INITIAL);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [palsRes, breedRes] = await Promise.all([
          fetch("/data/pals.json"),
          fetch("/data/breeding_by_father.json"),
        ]);
        if (!palsRes.ok || !breedRes.ok) {
          throw new Error("数据加载失败");
        }
        const raw: Pal[] = await palsRes.json();
        const breedingByFather: BreedingByFather = await breedRes.json();
        // 数据中 icon 字段为 "pal_icons/xxx.webp"，实际位于 /data/pal_icons/
        const pals = raw.map((p) => ({ ...p, icon: `/data/${p.icon}` }));
        const bySlug = new Map<string, Pal>();
        for (const p of pals) bySlug.set(p.slug, p);
        if (cancelled) return;
        setState({ pals, bySlug, breedingByFather, loading: false, error: null });
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
