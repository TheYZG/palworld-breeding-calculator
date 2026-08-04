// 配种链查找算法：给定目标帕鲁和"我的帕鲁"集合，找出所有可达的配种路径。
// 支持 1~3 代繁育路径：A+B→C, C+D→E, E+F→G = 目标

import type { BreedingByFather, ParentPair } from "./types";

/**
 * 反向索引：child slug → 所有能配出它的亲代对 [father, mother]
 */
export type ReverseIndex = Map<string, ParentPair[]>;

/**
 * 构建 child → parent pairs 的反向索引。
 */
export function buildReverseIndex(
  breedingByFather: BreedingByFather,
): ReverseIndex {
  const index: ReverseIndex = new Map();
  for (const [father, combos] of Object.entries(breedingByFather)) {
    for (const [mother, child] of combos) {
      let list = index.get(child);
      if (!list) {
        list = [];
        index.set(child, list);
      }
      list.push([father, mother]);
    }
  }
  // 去重
  for (const [child, pairs] of index) {
    const seen = new Set<string>();
    const unique: ParentPair[] = [];
    for (const [f, m] of pairs) {
      const key = f < m ? `${f}|${m}` : `${m}|${f}`;
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push([f, m]);
    }
    index.set(child, unique);
  }
  return index;
}

/**
 * 配种链中的一个节点：要么是"已有"的帕鲁（叶子），要么是一个配种步骤。
 */
export interface PathNode {
  type: "owned" | "breed";
  pal: string;
  // breed 节点的两个亲代
  parents?: ParentPair;
  // breed 节点的子步骤（递归）
  children?: PathNode[];
}

/**
 * 配种路径
 */
export interface BreedPath {
  target: string;
  depth: number; // 繁育代数
  root: PathNode;
}

/**
 * 查找目标帕鲁的配种路径（最短代数优先）。
 *
 * 使用迭代加深 DFS：从 1 代开始逐层尝试，找到的第一条路径即为最短繁育代数路径。
 * 这样若目标可 1 代配出，就不会返回 2 代及以上的路径。
 *
 * @param target 目标帕鲁 slug
 * @param owned 我拥有的帕鲁集合
 * @param reverseIndex 反向索引
 * @param maxDepth 最大繁育代数（默认 3）
 * @returns 至多一条最短路径（已按代数升序选定）
 */
export function findBreedPaths(
  target: string,
  owned: Set<string>,
  reverseIndex: ReverseIndex,
  maxDepth = 3,
): BreedPath[] {
  if (owned.has(target)) return [];

  const visited = new Set<string>();
  for (let limit = 1; limit <= maxDepth; limit++) {
    visited.clear();
    const root = dfs(target, 0, limit);
    if (root && root.type === "breed") {
      return [{ target, depth: countDepth(root), root }];
    }
  }
  return [];

  function dfs(pal: string, depth: number, limit: number): PathNode | null {
    if (owned.has(pal)) return { type: "owned", pal };
    if (depth >= limit) return null;
    if (visited.has(pal)) return null;
    visited.add(pal);

    const parentPairs = reverseIndex.get(pal);
    if (!parentPairs || parentPairs.length === 0) return null;

    for (const [f, m] of parentPairs) {
      const fNode = dfs(f, depth + 1, limit);
      if (!fNode) continue;
      const mNode = dfs(m, depth + 1, limit);
      if (!mNode) continue;
      return {
        type: "breed",
        pal,
        parents: [f, m],
        children: [fNode, mNode],
      };
    }
    return null;
  }
}

function countDepth(node: PathNode): number {
  if (node.type === "owned") return 0;
  if (!node.children) return 0;
  return 1 + Math.max(countDepth(node.children[0]), countDepth(node.children[1]));
}
