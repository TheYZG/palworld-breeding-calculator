// 我的帕鲁条带：横向滚动展示已勾选帕鲁，可单独移除或清空。

import { Trash2, X } from "lucide-react";
import type { Pal } from "@/lib/types";
import { usePalStore } from "@/store/usePalStore";
import PalIcon from "./PalIcon";

interface Props {
  bySlug: Map<string, Pal>;
}

export default function MyPalsStrip({ bySlug }: Props) {
  const myPals = usePalStore((s) => s.myPals);
  const togglePal = usePalStore((s) => s.togglePal);
  const clearMyPals = usePalStore((s) => s.clearMyPals);

  const list = Array.from(myPals)
    .map((s) => bySlug.get(s))
    .filter((p): p is Pal => Boolean(p));
  list.sort((a, b) => {
    const ai = a.index > 0 ? a.index : 9999;
    const bi = b.index > 0 ? b.index : 9999;
    return ai - bi;
  });

  if (list.length === 0) return null;

  return (
    <div className="flex items-center gap-3 border-b border-border bg-surface px-4 py-2">
      <div className="flex shrink-0 flex-col leading-tight">
        <span className="font-serif text-sm font-bold text-text">我的帕鲁</span>
        <span className="text-xs text-text-muted">{list.length} 只</span>
      </div>
      <div className="flex flex-1 gap-1.5 overflow-x-auto py-1">
        {list.map((p) => (
          <div key={p.slug} className="group relative shrink-0">
            <PalIcon pal={p} size={40} />
            <button
              type="button"
              onClick={() => togglePal(p.slug)}
              aria-label={`移除 ${p.name}`}
              className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-border text-text opacity-0 transition hover:bg-accent hover:text-white group-hover:opacity-100"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={clearMyPals}
        className="flex shrink-0 items-center gap-1 rounded px-2 py-1 text-xs text-text-muted transition hover:bg-surface-2 hover:text-accent"
      >
        <Trash2 className="h-3.5 w-3.5" />
        清空
      </button>
    </div>
  );
}
