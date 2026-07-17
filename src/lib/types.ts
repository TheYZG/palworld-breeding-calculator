// 帕鲁与配种数据的类型定义

export interface PalElement {
  id: string;
  name: string;
}

export interface Pal {
  id: string;
  slug: string;
  name: string;
  index: number;
  indexSuffix: string;
  rank: number;
  isBreed: boolean;
  uniqueBreed?: { p1: string; p2: string }[];
  elements: PalElement[];
  isNewIn10: boolean;
  partnerSkillName: string;
  icon: string;
  iconUrl: string;
}

// breeding_by_father.json: { [fatherSlug]: [motherSlug, childSlug][] }
export type BreedingByFather = Record<string, [string, string][]>;

// 亲代对 [fatherSlug, motherSlug]
export type ParentPair = [string, string];
