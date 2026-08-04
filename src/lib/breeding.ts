// 核心计算逻辑：根据"我的帕鲁"集合，计算可繁育出的后代及其亲代组合。

import type { BreedingByFather, ParentPair } from "./types";

export type BreedableResult = Map<string, ParentPair[]>;

/**
 * 遍历 breedingByFather，对每个在 myPals 中的父本，取其母本列表；
 * 筛选母本也在 myPals 中的组合，按后代聚合。
 *
 * 由于 (A,B) 与 (B,A) 均会产生同一后代，结果中会重复，因此对每个后代的亲代对去重。
 */
export function computeBreedable(
  myPals: Set<string>,
  breedingByFather: BreedingByFather,
): BreedableResult {
  const results: BreedableResult = new Map();

  for (const fatherSlug of myPals) {
    const combos = breedingByFather[fatherSlug];
    if (!combos) continue;
    for (const [motherSlug, childSlug] of combos) {
      if (!myPals.has(motherSlug)) continue;
      let list = results.get(childSlug);
      if (!list) {
        list = [];
        results.set(childSlug, list);
      }
      list.push([fatherSlug, motherSlug]);
    }
  }

  // 每个后代的亲代对去重并排序
  for (const [child, pairs] of results) {
    const seen = new Set<string>();
    const unique: ParentPair[] = [];
    for (const [f, m] of pairs) {
      const key = f < m ? `${f}|${m}` : `${m}|${f}`;
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push([f, m]);
    }
    unique.sort(([fa, ma], [fb, mb]) => fa.localeCompare(fb) || ma.localeCompare(mb));
    results.set(child, unique);
  }

  return results;
}

/**
 * 配种闭包条目：后代 + 最小繁育代数 + 在当前可达集合内能配出它的所有亲代对。
 * generation = 1 表示一次配种即可获得；2 表示需要先配出中间代再配；以此类推。
 */
export interface ClosureEntry {
  generation: number;
  pairs: ParentPair[];
}

export type ClosureResult = Map<string, ClosureEntry>;

/**
 * 计算配种闭包：从 myPals 出发，迭代把可繁育出的后代加入集合，再继续繁育，
 * 直到不再产生新后代（或达到 maxIter）。
 *
 * 每个后代的 generation 是所有可行亲代对中 max(gen(父), gen(母)) + 1 的最小值。
 */
export function computeBreedableClosure(
  myPals: Set<string>,
  breedingByFather: BreedingByFather,
  maxIter = 30,
): ClosureResult {
  // slug -> 最小繁育代数（已拥有 = 0）
  const reachable = new Map<string, number>();
  for (const s of myPals) reachable.set(s, 0);

  // 不动点迭代：每轮用当前可达集合计算可繁育后代，更新代数
  for (let iter = 0; iter < maxIter; iter++) {
    const currentSet = new Set(reachable.keys());
    const result = computeBreedable(currentSet, breedingByFather);
    let changed = false;
    for (const [child, pairs] of result) {
      let minG = Infinity;
      for (const [f, m] of pairs) {
        const gf = reachable.get(f) ?? Infinity;
        const gm = reachable.get(m) ?? Infinity;
        const g = Math.max(gf, gm) + 1;
        if (g < minG) minG = g;
      }
      if (minG === Infinity) continue;
      const prev = reachable.get(child);
      if (prev === undefined || minG < prev) {
        reachable.set(child, minG);
        changed = true;
      }
    }
    if (!changed) break;
  }

  // 用最终可达集合重新计算所有亲代对
  const finalSet = new Set(reachable.keys());
  const allResult = computeBreedable(finalSet, breedingByFather);

  const closure: ClosureResult = new Map();
  for (const [child, pairs] of allResult) {
    if (myPals.has(child)) continue; // 排除已拥有
    const gen = reachable.get(child);
    if (!gen) continue;
    // 只保留能达到该代数的亲代组合：max(父代数, 母代数) + 1 == 该后代代数
    // 这样 1 代后代只显示"已有+已有"的组合，不会混入中间代组合
    const filtered = pairs.filter(([f, m]) => {
      const gf = reachable.get(f) ?? Infinity;
      const gm = reachable.get(m) ?? Infinity;
      return Math.max(gf, gm) + 1 === gen;
    });
    if (filtered.length === 0) continue;
    closure.set(child, { generation: gen, pairs: filtered });
  }
  return closure;
}
