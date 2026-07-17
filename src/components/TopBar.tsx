// 顶部栏：标题、数据来源链接、暗色切换。

import { ExternalLink, Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

export default function TopBar() {
  const { isDark, toggleTheme } = useTheme();
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1280px] items-center justify-between px-4">
        <div className="flex items-baseline gap-2">
          <h1 className="font-serif text-lg font-bold text-text">
            幻兽帕鲁配种计算器
          </h1>
          <span className="hidden text-xs text-text-muted sm:inline">
            勾选你的帕鲁，实时计算可繁育后代
          </span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="https://op.gg/zh-cn/palworld/breeding"
            target="_blank"
            rel="noreferrer"
            className="hidden items-center gap-1 rounded px-2 py-1 text-xs text-text-muted transition hover:bg-surface-2 hover:text-accent sm:flex"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            数据来源
          </a>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="切换明暗主题"
            className="flex h-9 w-9 items-center justify-center rounded border border-border text-text-muted transition hover:bg-surface-2 hover:text-accent"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}
