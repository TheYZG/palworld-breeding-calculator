// 属性配置：id -> 名称/配色。覆盖数据中可能为 $undefined 的属性名。

export interface ElementConfig {
  id: string;
  name: string;
  color: string; // 属性主色（圆点/徽章底色）
  ring: string;  // 描边色（浅色模式下）
}

export const ELEMENTS: Record<string, ElementConfig> = {
  Normal: { id: "Normal", name: "无属性", color: "#9CA3AF", ring: "#D1D5DB" },
  Fire: { id: "Fire", name: "火属性", color: "#F08030", ring: "#FCD9B6" },
  Water: { id: "Water", name: "水属性", color: "#6890F0", ring: "#C5D6F8" },
  Electricity: { id: "Electricity", name: "雷属性", color: "#F8D030", ring: "#FBEEB0" },
  Leaf: { id: "Leaf", name: "草属性", color: "#78C850", ring: "#C7E6B0" },
  Earth: { id: "Earth", name: "地属性", color: "#E0C068", ring: "#F0E0B0" },
  Ice: { id: "Ice", name: "冰属性", color: "#98D8D8", ring: "#D0ECEC" },
  Dragon: { id: "Dragon", name: "龙属性", color: "#7038F8", ring: "#C9B6FB" },
  Dark: { id: "Dark", name: "暗属性", color: "#5C5C68", ring: "#B0B0BC" },
};

export const ELEMENT_LIST = Object.values(ELEMENTS);

export function getElement(id: string): ElementConfig {
  return (
    ELEMENTS[id] ?? { id, name: id, color: "#9CA3AF", ring: "#D1D5DB" }
  );
}
