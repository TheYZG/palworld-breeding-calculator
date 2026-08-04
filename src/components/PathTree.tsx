// 配种路径树：纵向嵌套展示从"已有帕鲁"到目标的繁育路径。
// 目标节点（root）用品牌色边框；中间代 breed 节点用琥珀色左边框；已有叶子用绿色标签。
// 父代横排两列，各自向下递归展开子树，形成清晰二叉树结构。
// 中间代头像点击：由调用方决定（如跳转到该帕鲁的配种路径卡片）。

import type { Pal } from "@/lib/types";
import type { PathNode } from "@/lib/breedingPath";
import { cn } from "@/lib/utils";
import PalIcon from "./PalIcon";

interface Props {
  node: PathNode;
  bySlug: Map<string, Pal>;
  onPalClick?: (slug: string) => void;
  isRoot?: boolean;
}

export default function PathTree({ node, bySlug, onPalClick, isRoot = true }: Props) {
  const pal = bySlug.get(node.pal);
  if (!pal) return null;

  if (node.type === "owned") {
    return <OwnedTag pal={pal} />;
  }

  // breed 节点：目标（root）品牌色，中间代琥珀色
  const isTarget = isRoot;
  return (
    <div
      className={cn(
        "rounded-lg border bg-surface p-2.5",
        isTarget
          ? "border-accent/50 bg-accent-soft/20"
          : "border-amber-500/30 border-l-2 border-l-amber-500/60",
      )}
    >
      {/* 头部：结果帕鲁 + 角标 */}
      <div className="flex items-center gap-2">
        {onPalClick ? (
          <button
            type="button"
            onClick={() => onPalClick(node.pal)}
            className="shrink-0 rounded outline-none transition hover:ring-2 hover:ring-accent/40 focus:ring-2 focus:ring-accent/60"
            title={isTarget ? pal.name : `${pal.name}（中间代，点击查看其配种路径）`}
          >
            <PalIcon pal={pal} size={36} showName />
          </button>
        ) : (
          <PalIcon pal={pal} size={36} showName />
        )}
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-medium",
            isTarget
              ? "bg-accent-soft text-accent"
              : "bg-amber-500/15 text-amber-500",
          )}
        >
          {isTarget ? "目标" : "中间代"}
        </span>
      </div>

      {/* 亲代区：父 + 母，横排两列，各自向下递归 */}
      {node.children && node.children.length > 0 && (
        <div className="mt-2 flex items-stretch gap-2">
          {node.children.map((child, i) => (
            <div key={i} className="flex min-w-0 flex-1 flex-col">
              <div className="mb-1 flex items-center gap-1 text-[10px] text-text-muted">
                <span className="h-px w-3 bg-border" />
                {i === 0 ? "父" : "母"}
              </div>
              <PathTreeChild node={child} bySlug={bySlug} onPalClick={onPalClick} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PathTreeChild({ node, bySlug, onPalClick }: Props) {
  if (node.type === "owned") {
    return <OwnedTag pal={bySlug.get(node.pal)!} />;
  }
  // 中间代子节点：递归为嵌套卡片
  return <PathTree node={node} bySlug={bySlug} onPalClick={onPalClick} isRoot={false} />;
}

// 已有帕鲁标签：绿色背景 + 图标 + 名字
function OwnedTag({ pal }: { pal: Pal }) {
  return (
    <div
      className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/15 px-2 py-1 ring-1 ring-emerald-500/30"
      title="已拥有"
    >
      <PalIcon pal={pal} size={28} showName />
      <span className="text-[10px] font-medium text-emerald-500">已有</span>
    </div>
  );
}
