// 属性多选筛选：彩色圆点标签组。
// target="picker" 筛选左侧选择器（默认），target="result" 筛选右侧结果区。

import { ELEMENT_LIST } from "@/lib/elements";
import { usePalStore } from "@/store/usePalStore";
import { cn } from "@/lib/utils";

interface Props {
  target?: "picker" | "result";
}

export default function ElementFilter({ target = "picker" }: Props) {
  const elementFilter = usePalStore((s) =>
    target === "result" ? s.resultElementFilter : s.elementFilter,
  );
  const toggleElement =
    target === "result"
      ? usePalStore((s) => s.toggleResultElement)
      : usePalStore((s) => s.toggleElement);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {ELEMENT_LIST.map((el) => {
        const active = elementFilter.has(el.id);
        return (
          <button
            key={el.id}
            type="button"
            onClick={() => toggleElement(el.id)}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] transition",
              active
                ? "border-transparent text-white"
                : "border-border text-text-muted hover:text-text",
            )}
            style={active ? { backgroundColor: el.color } : undefined}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: active ? "#fff" : el.color }}
            />
            {el.name}
          </button>
        );
      })}
    </div>
  );
}
