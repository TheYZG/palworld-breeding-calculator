// 分享链接工具：把 myPals 编码到 URL hash，支持跨设备分享。

/**
 * 将 slug 集合编码为 URL hash 字符串。
 * 格式：#pals=slug1,slug2,slug3
 */
export function encodeMyPalsToHash(slugs: string[]): string {
  if (slugs.length === 0) return "";
  return `#pals=${slugs.join(",")}`;
}

/**
 * 从当前 URL hash 解析出 slug 列表。
 * 返回 null 表示无分享数据。
 */
export function decodeMyPalsFromHash(): string[] | null {
  const hash = window.location.hash;
  if (!hash.startsWith("#pals=")) return null;
  const raw = hash.slice(6);
  if (!raw) return [];
  return raw.split(",").filter(Boolean);
}

/**
 * 清除 URL hash 中的分享数据（不影响其他 hash）。
 */
export function clearShareHash(): void {
  if (window.location.hash.startsWith("#pals=")) {
    history.replaceState(null, "", window.location.pathname + window.location.search);
  }
}
