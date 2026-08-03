// 配种路径树渲染：递归展示从"已有帕鲁"到目标的繁育路径。
// breed 节点显示 [子代] = [父] + [母]；owned 节点高亮"已有"。

import type { Pal } from "@/lib/types";
import type { PathNode } from "@/lib/breedingPath";
import PalIcon from "./PalIcon";

interface Props {
  node: PathNode;
  bySlug: Map<string, Pal>;
  onPalClick: (slug: string) => void;
  depth?: number;
}

export default function PathTree({ node, bySlug, onPalClick, depth = 0 }: Props) {
  const pal = bySlug.get(node.pal);
  if (!pal) return null;

  if (node.type === "owned") {
    return (
      <div
        className="flex items-center gap-1.5 rounded bg-accent-soft/60 p-1.5"
        style={{ marginLeft: depth * 24 }}
      >
        <span className="text-xs text-accent">已有</span>
        <button
          type="button"
          onClick={() => onPalClick(node.pal)}
          className="rounded outline-none hover:ring-2 hover:ring-accent/40"
        >
          <PalIcon pal={pal} size={28} showName />
        </button>
      </div>
    );
  }

  // breed 节点：展示 [子代] = [父] + [母]
  return (
    <div style={{ marginLeft: depth * 24 }}>
      <div className="flex flex-wrap items-center gap-2 rounded border border-border bg-surface p-2">
        <button
          type="button"
          onClick={() => onPalClick(node.pal)}
          className="rounded outline-none hover:ring-2 hover:ring-accent/40"
          title={`查看 ${pal.name} 详情`}
        >
          <PalIcon pal={pal} size={36} showName />
        </button>
        <span className="text-text-muted">=</span>
        {node.children?.map((child, i) => (
          <div key={i} className="flex items-center gap-2">
            {i > 0 && <span className="text-text-muted">+</span>}
            <PathTreeChild node={child} bySlug={bySlug} onPalClick={onPalClick} depth={depth + 1} />
          </div>
        ))}
      </div>
    </div>
  );
}

function PathTreeChild({ node, bySlug, onPalClick, depth }: Props) {
  const pal = bySlug.get(node.pal);
  if (!pal) return null;

  if (node.type === "owned") {
    return (
      <button
        type="button"
        onClick={() => onPalClick(node.pal)}
        className="flex items-center gap-1.5 rounded bg-accent-soft/60 px-1.5 py-1 outline-none hover:ring-2 hover:ring-accent/40"
        title="已有"
      >
        <PalIcon pal={pal} size={28} showName />
      </button>
    );
  }

  // breed 子节点：递归展示
  return <PathTree node={node} bySlug={bySlug} onPalClick={onPalClick} depth={depth} />;
}
