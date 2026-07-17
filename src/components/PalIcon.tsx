// 帕鲁图标纯展示组件：图标 + 可选编号/名称/属性点。交互与选中态由父组件控制。

import { useState } from "react";
import type { Pal } from "@/lib/types";
import { getElement } from "@/lib/elements";
import { cn } from "@/lib/utils";

interface Props {
  pal: Pal;
  size?: number;
  showName?: boolean;
  showIndex?: boolean;
  showElements?: boolean;
  selected?: boolean;
  className?: string;
}

export default function PalIcon({
  pal,
  size = 56,
  showName = false,
  showIndex = false,
  showElements = false,
  selected = false,
  className,
}: Props) {
  const [err, setErr] = useState(false);
  return (
    <div
      className={cn("relative flex flex-col items-center gap-1", className)}
      style={{ width: size + 12 }}
    >
      <div
        className={cn(
          "relative rounded-md p-0.5",
          selected && "ring-2 ring-accent",
        )}
        style={{ width: size, height: size }}
      >
        {err ? (
          <div className="flex h-full w-full items-center justify-center rounded bg-surface-2 font-serif text-sm text-text-muted">
            {pal.name.slice(0, 1)}
          </div>
        ) : (
          <img
            src={pal.icon}
            alt={pal.name}
            width={size}
            height={size}
            loading="lazy"
            onError={() => setErr(true)}
            className="h-full w-full object-contain"
          />
        )}
        {showIndex && (
          <span className="absolute left-0 top-0 rounded-br-sm bg-surface/70 px-1 font-mono text-[9px] leading-tight text-text-muted">
            {pal.index > 0 ? pal.index : "—"}
          </span>
        )}
        {selected && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
            ✓
          </span>
        )}
      </div>
      {showName && (
        <span className="line-clamp-1 w-full text-center text-[11px] leading-tight text-text">
          {pal.name}
        </span>
      )}
      {showElements && pal.elements.length > 0 && (
        <div className="flex gap-0.5">
          {pal.elements.map((e) => (
            <span
              key={e.id}
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: getElement(e.id).color }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
