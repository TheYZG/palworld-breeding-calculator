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
