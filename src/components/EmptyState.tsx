// 空状态提示。

import type { LucideIcon } from "lucide-react";
import { MousePointerClick } from "lucide-react";

interface Props {
  title: string;
  desc: string;
  icon?: LucideIcon;
}

export default function EmptyState({ title, desc, icon: Icon = MousePointerClick }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center animate-fade-in">
      <Icon className="h-10 w-10 text-accent/50" strokeWidth={1.5} />
      <div className="font-serif text-lg text-text">{title}</div>
      <div className="max-w-sm text-sm leading-relaxed text-text-muted">
        {desc}
      </div>
    </div>
  );
}
