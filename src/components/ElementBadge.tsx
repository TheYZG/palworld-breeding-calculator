// 属性彩色小圆点徽章。

import { getElement } from "@/lib/elements";
import { cn } from "@/lib/utils";

interface Props {
  elementId: string;
  size?: "xs" | "sm" | "md";
  showName?: boolean;
  className?: string;
}

const DOT_SIZE: Record<NonNullable<Props["size"]>, string> = {
  xs: "h-1.5 w-1.5",
  sm: "h-2 w-2",
  md: "h-2.5 w-2.5",
};

export default function ElementBadge({
  elementId,
  size = "sm",
  showName = false,
  className,
}: Props) {
  const el = getElement(elementId);
  return (
    <span
      className={cn("inline-flex items-center gap-1", className)}
      title={el.name}
    >
      <span
        className={cn("rounded-full", DOT_SIZE[size])}
        style={{ backgroundColor: el.color }}
      />
      {showName && (
        <span className="text-[11px] text-text-muted">{el.name}</span>
      )}
    </span>
  );
}
