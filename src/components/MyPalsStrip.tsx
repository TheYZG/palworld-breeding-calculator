// 我的帕鲁条带：横向滚动展示已勾选帕鲁，可单独移除、清空、查看详情、导出/导入存档。

import { useRef } from "react";
import { Trash2, X, Info, Download, Upload, Share2 } from "lucide-react";
import type { Pal } from "@/lib/types";
import { usePalStore } from "@/store/usePalStore";
import { encodeMyPalsToHash } from "@/lib/share";
import PalIcon from "./PalIcon";

interface Props {
  bySlug: Map<string, Pal>;
  palDetails?: import("@/lib/types").PalDetailsMap;
  palStats?: import("@/lib/types").PalStats;
  workTypes?: import("@/lib/types").WorkType[];
}

export default function MyPalsStrip({ bySlug }: Props) {
  const myPals = usePalStore((s) => s.myPals);
  const togglePal = usePalStore((s) => s.togglePal);
  const clearMyPals = usePalStore((s) => s.clearMyPals);
  const openDetail = usePalStore((s) => s.openDetail);
  const importPals = usePalStore((s) => s.importPals);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const list = Array.from(myPals)
    .map((s) => bySlug.get(s))
    .filter((p): p is Pal => Boolean(p));
  list.sort((a, b) => {
    const ai = a.index > 0 ? a.index : 9999;
    const bi = b.index > 0 ? b.index : 9999;
    return ai - bi;
  });

  if (list.length === 0) return null;

  // 导出：下载 JSON 文件
  const handleExport = () => {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      myPals: Array.from(myPals),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `palworld-breeding-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 导入：读取 JSON 文件
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        const slugs = Array.isArray(data.myPals) ? data.myPals : [];
        // 过滤掉不存在的 slug
        const valid = slugs.filter((s: unknown) =>
          typeof s === "string" && bySlug.has(s)
        );
        importPals(valid);
      } catch {
        alert("导入失败：文件格式不正确");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // 分享：复制链接到剪贴板
  const handleShare = async () => {
    const hash = encodeMyPalsToHash(Array.from(myPals));
    const url = window.location.origin + window.location.pathname + hash;
    try {
      await navigator.clipboard.writeText(url);
      alert("分享链接已复制到剪贴板！");
    } catch {
      // 降级：选中文本
      window.prompt("复制以下链接分享：", url);
    }
  };

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
              onClick={() => openDetail(p.slug)}
              className="absolute left-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-surface/80 text-text-muted opacity-0 transition hover:bg-accent hover:text-white group-hover:opacity-100"
              aria-label={`查看 ${p.name} 详情`}
              title="查看详情"
            >
              <Info className="h-2.5 w-2.5" />
            </button>
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
      <div className="flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          onClick={handleShare}
          className="flex items-center gap-1 rounded px-2 py-1 text-xs text-text-muted transition hover:bg-surface-2 hover:text-accent"
          title="复制分享链接"
        >
          <Share2 className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={handleExport}
          className="flex items-center gap-1 rounded px-2 py-1 text-xs text-text-muted transition hover:bg-surface-2 hover:text-accent"
          title="导出存档"
        >
          <Download className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1 rounded px-2 py-1 text-xs text-text-muted transition hover:bg-surface-2 hover:text-accent"
          title="导入存档"
        >
          <Upload className="h-3.5 w-3.5" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleImport}
          className="hidden"
        />
        <button
          type="button"
          onClick={clearMyPals}
          className="flex items-center gap-1 rounded px-2 py-1 text-xs text-text-muted transition hover:bg-surface-2 hover:text-accent"
          title="清空"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
