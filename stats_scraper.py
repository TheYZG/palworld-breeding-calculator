"""
爬取每只帕鲁的工作技能等级数据，输出 public/data/pal_stats.json。

数据源：https://palworld.gg/zh-Hans/pal/<中文名>
解析：详情页 HTML 的 <div class="work-suit"> 区域，每个 <div class="item active">
      含 T_icon_palwork_XX.png 图标和 <span class="value">N</span> 等级。

输出：
  - public/data/pal_stats.json: { slug: { workId: level, ... } }
  - public/data/work_types.json: [{ id, name, icon }, ...]

支持断点续传：已爬的 slug 跳过。
"""

import json
import os
import re
import time
from urllib.parse import quote

import requests

HEADERS = {"User-Agent": "Mozilla/5.0"}
BASE = "https://palworld.gg/zh-Hans/pal/"

PALS_PATH = "public/data/pals.json"
STATS_PATH = "public/data/pal_stats.json"
WORK_TYPES_PATH = "public/data/work_types.json"

# 工作 ID → 名称（兜底映射，实际以页面 alt 为准）
WORK_NAMES_FALLBACK = {
    "00": "引火", "01": "浇水", "02": "种植", "03": "发电", "04": "手工",
    "05": "采集", "06": "除林", "07": "挖矿", "08": "制药", "09": "牧场",
    "10": "冷却", "11": "运输", "12": "耕作",
}


def fetch_works(name):
    """返回 (works_dict, work_types_seen) 或 (None, None) 表示失败。"""
    # 去除 name 首尾空格（部分帕鲁 name 带尾空格，如"黑月女王 "）
    name = name.strip()
    url = BASE + quote(name)
    r = requests.get(url, headers=HEADERS, timeout=20)
    if r.status_code != 200:
        return None, None
    t = r.content.decode("utf-8", errors="replace")
    i = t.find("work-suit")
    if i < 0:
        return {}, {}
    j = t.find("abilities", i)
    if j < 0:
        j = len(t)
    section = t[i:j]
    works = {}
    types_seen = {}
    # 每个 item active 块：icon 编号 + alt 名称 + level value
    for m in re.finditer(r"T_icon_palwork_(\d+)\.png", section):
        wid = m.group(1)
        after = section[m.end():m.end() + 400]
        alt_m = re.search(r'alt="([^"]+)"', after)
        lvl_m = re.search(r'<span class="value">(\d+)</span>', after)
        if lvl_m:
            works[wid] = int(lvl_m.group(1))
        if alt_m:
            types_seen[wid] = alt_m.group(1)
    return works, types_seen


def main():
    pals = json.load(open(PALS_PATH, encoding="utf-8"))

    # 断点续传
    existing = {}
    if os.path.exists(STATS_PATH):
        existing = json.load(open(STATS_PATH, encoding="utf-8"))

    stats = dict(existing)
    all_types = {}

    # 先把已有数据里的 work types 合进来
    for s in stats.values():
        for wid in s.keys():
            if wid not in all_types:
                all_types[wid] = WORK_NAMES_FALLBACK.get(wid, f"work_{wid}")

    todo = [p for p in pals if p["slug"] not in stats]
    print(f"共 {len(pals)} 只，已爬 {len(stats)}，待爬 {len(todo)}")

    failed = []
    for idx, p in enumerate(todo, 1):
        name = p["name"]
        slug = p["slug"]
        works = None
        for attempt in range(3):
            try:
                works, types_seen = fetch_works(name)
                if works is not None:
                    break
            except requests.RequestException:
                pass
            time.sleep(1 + attempt)
        if works is None:
            print(f"[{idx}/{len(todo)}] FAIL {name} ({slug})")
            failed.append(slug)
            time.sleep(0.5)
            continue
        stats[slug] = works
        for wid, wname in types_seen.items():
            all_types[wid] = wname
        if idx % 20 == 0 or idx == len(todo):
            print(f"[{idx}/{len(todo)}] {name} -> {works}")
            # 定期保存
            json.dump(stats, open(STATS_PATH, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
            json.dump(
                [{"id": wid, "name": all_types[wid], "icon": f"/images/icons/T_icon_palwork_{wid}.png"}
                 for wid in sorted(all_types.keys())],
                open(WORK_TYPES_PATH, "w", encoding="utf-8"),
                ensure_ascii=False,
                indent=2,
            )
        time.sleep(0.3)

    # 最终保存
    json.dump(stats, open(STATS_PATH, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    json.dump(
        [{"id": wid, "name": all_types[wid], "icon": f"/images/icons/T_icon_palwork_{wid}.png"}
         for wid in sorted(all_types.keys())],
        open(WORK_TYPES_PATH, "w", encoding="utf-8"),
        ensure_ascii=False,
        indent=2,
    )

    print(f"\n完成：{len(stats)} 只帕鲁，{len(all_types)} 种工作类型")
    print(f"工作类型：{all_types}")
    if failed:
        print(f"失败 {len(failed)} 只：{failed}")


if __name__ == "__main__":
    main()
