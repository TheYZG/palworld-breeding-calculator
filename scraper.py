"""
幻兽帕鲁 (Palworld) 配种数据爬虫
数据来源: https://op.gg/zh-cn/palworld/breeding

原理:
  op.gg 的配种页面是 Next.js App Router 应用，帕鲁数据内嵌在 RSC 流式 payload
  (self.__next_f.push) 中。我们抓取 HTML，解析出完整的 299 个帕鲁列表
  (含 rank 繁殖力、属性、搭档技能等)，再根据已验证的繁殖公式生成全部配种组合。

繁殖规则 (已对页面 20 条可见组合验证，20/20 全对):
  1. 若亲代组合 (A, B) 命中某帕鲁的 uniqueBreed 列表 (双向匹配)，则后代为该帕鲁。
     —— 这是特殊/不可繁殖帕鲁 (isBreed=false) 的唯一产出途径。
  2. 否则，后代 = 繁殖力 rank 最接近 (A.rank + B.rank) / 2 的「可繁殖」帕鲁，
     平手时取 rank 较高者。

输出:
  data/pals.json            —— 帕鲁图鉴 (299 条)
  data/breeding_combos.json —— 全部配种组合 (89401 条，有序对)
  data/pal_icons/           —— 帕鲁图标 (可选，--with-images 下载)
"""

import argparse
import json
import os
import re
import sys
import time
from collections import defaultdict

import requests

BASE_URL = "https://op.gg/zh-cn/palworld/breeding"
IMAGE_CDN = "https://s-stats-platform-cdn.op.gg/palworld/1.0.0.100427/images/icons/{}.webp?image=q_auto:good,f_webp,w_280&v=1784201808"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
}
DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
ICON_DIR = os.path.join(DATA_DIR, "pal_icons")


# -------------------- 1. 抓取页面 --------------------
def fetch_html():
    print("[1/4] 抓取配种页面 ...")
    resp = requests.get(BASE_URL, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    print(f"      HTTP {resp.status_code}, HTML {len(resp.text)} 字节")
    return resp.text


# -------------------- 2. 解析 RSC payload 得到帕鲁列表 --------------------
def extract_pals(html):
    print("[2/4] 解析 RSC payload 提取帕鲁数据 ...")
    # Next.js App Router 通过 self.__next_f.push([1,"..."]) 流式下发数据
    chunks = re.findall(r'self\.__next_f\.push\(\[1,"(.*?)"\]\)', html, re.DOTALL)
    if not chunks:
        raise RuntimeError("未找到 __next_f.push 数据，页面结构可能已变化")
    blob = "\n----CHUNK----\n".join(chunks)

    # 定位 \"pals\":[ 数组起始 (RSC 内 JSON 被转义)
    key = '\\"pals\\":['
    start = blob.find(key)
    if start < 0:
        raise RuntimeError("未在 payload 中找到 pals 数组")
    bracket = blob.find("[", start)

    # 配对括号，注意 \" 转义
    depth = 0
    in_str = False
    i = bracket
    end = -1
    while i < len(blob):
        ch = blob[i]
        if ch == "\\" and i + 1 < len(blob):
            i += 2
            continue
        if ch == '"':
            in_str = not in_str
        elif not in_str:
            if ch == "[":
                depth += 1
            elif ch == "]":
                depth -= 1
                if depth == 0:
                    end = i
                    break
        i += 1
    if end < 0:
        raise RuntimeError("pals 数组括号配对失败")

    escaped = blob[bracket:end + 1]
    # 用 JSON 字符串反转义: 把内容当字符串体解析
    arr_json = json.loads('"' + escaped + '"')
    pals = json.loads(arr_json)
    print(f"      提取到 {len(pals)} 个帕鲁 "
          f"(可繁殖 {sum(1 for p in pals if p.get('isBreed'))} 个)")
    return pals


# -------------------- 3. 生成配种组合 --------------------
def build_breeding_table(pals):
    print("[3/4] 生成配种组合表 ...")
    by_id = {p["id"]: p for p in pals}
    breedable = [p for p in pals if p.get("isBreed")]

    # 预构建 uniqueBride 反查表: (p1_id, p2_id) -> child_pal  (双向)
    unique_lookup = {}
    for p in pals:
        for c in p.get("uniqueBreed") or []:
            p1, p2 = c["p1"], c["p2"]
            unique_lookup[(p1, p2)] = p
            unique_lookup[(p2, p1)] = p

    # 公式: 在可繁殖帕鲁中找 rank 最接近平均值者，平手取较高 rank
    # 预排序以便高效查找; 这里直接线性扫描 (185 个，89401 组合仍很快)
    def formula_child(rank_a, rank_b):
        target = (rank_a + rank_b) / 2
        best = None
        best_diff = None
        for p in breedable:
            diff = abs(p["rank"] - target)
            if best_diff is None or diff < best_diff or (
                diff == best_diff and p["rank"] > best["rank"]
            ):
                best_diff = diff
                best = p
        return best

    combos = []
    n = len(pals)
    for i, a in enumerate(pals):
        for b in pals:
            # 1. 先查 uniqueBreed 覆盖
            child = unique_lookup.get((a["id"], b["id"]))
            # 2. 否则用公式
            if child is None:
                child = formula_child(a["rank"], b["rank"])
            combos.append({
                "father": a["slug"],
                "mother": b["slug"],
                "child": child["slug"],
            })
        if (i + 1) % 50 == 0 or i + 1 == n:
            print(f"      进度 {i + 1}/{n} 帕鲁作为父本已处理")

    print(f"      共生成 {len(combos)} 条配种组合 (理论值 {n * n})")
    return combos, unique_lookup


# -------------------- 4. 保存数据 --------------------
def slim_pal(p):
    """精简帕鲁字段，去掉过长且网站不需要的 partnerSkillDesc。"""
    return {
        "id": p["id"],
        "slug": p["slug"],
        "name": p["name"],
        "index": p["index"],
        "indexSuffix": p.get("indexSuffix", ""),
        "rank": p["rank"],
        "isBreed": p["isBreed"],
        "elements": p.get("elements", []),
        "isNewIn10": p.get("isNewIn10", False),
        "partnerSkillName": p.get("partnerSkillName") or "",
        "icon": f"pal_icons/{p['id']}.webp",
        "iconUrl": IMAGE_CDN.format(p["id"]),
    }


def save_outputs(pals, combos):
    print("[4/4] 保存数据 ...")
    os.makedirs(DATA_DIR, exist_ok=True)

    pals_slim = [slim_pal(p) for p in pals]
    pals_path = os.path.join(DATA_DIR, "pals.json")
    with open(pals_path, "w", encoding="utf-8") as f:
        json.dump(pals_slim, f, ensure_ascii=False, indent=2)
    print(f"      pals.json -> {len(pals_slim)} 条 ({os.path.getsize(pals_path) // 1024} KB)")

    combos_path = os.path.join(DATA_DIR, "breeding_combos.json")
    with open(combos_path, "w", encoding="utf-8") as f:
        json.dump(combos, f, ensure_ascii=False)
    print(f"      breeding_combos.json -> {len(combos)} 条 ({os.path.getsize(combos_path) // 1024} KB)")

    # 额外: 生成一个精简的「亲代->后代」查找表 (按 father 聚合)，方便前端快速加载
    by_father = defaultdict(list)
    for c in combos:
        by_father[c["father"]].append([c["mother"], c["child"]])
    compact_path = os.path.join(DATA_DIR, "breeding_by_father.json")
    with open(compact_path, "w", encoding="utf-8") as f:
        json.dump(by_father, f, ensure_ascii=False)
    print(f"      breeding_by_father.json -> {len(by_father)} 父本 ({os.path.getsize(compact_path) // 1024} KB)")


# -------------------- 可选: 下载图标 --------------------
def download_icons(pals):
    os.makedirs(ICON_DIR, exist_ok=True)
    print(f"下载 {len(pals)} 个帕鲁图标到 {ICON_DIR} ...")
    session = requests.Session()
    session.headers.update(HEADERS)
    ok = 0
    for i, p in enumerate(pals):
        out = os.path.join(ICON_DIR, f"{p['id']}.webp")
        if os.path.exists(out) and os.path.getsize(out) > 0:
            ok += 1
            continue
        url = IMAGE_CDN.format(p["id"])
        try:
            r = session.get(url, timeout=30)
            r.raise_for_status()
            with open(out, "wb") as f:
                f.write(r.content)
            ok += 1
        except Exception as e:
            print(f"  ! {p['name']} ({p['id']}) 下载失败: {e}")
        if (i + 1) % 50 == 0:
            print(f"  进度 {i + 1}/{len(pals)}")
        time.sleep(0.05)  # 轻微限速，避免给 CDN 压力
    print(f"图标下载完成: {ok}/{len(pals)}")


# -------------------- 主流程 --------------------
def main():
    parser = argparse.ArgumentParser(description="幻兽帕鲁配种数据爬虫")
    parser.add_argument("--with-images", action="store_true", help="同时下载帕鲁图标")
    parser.add_argument("--no-combos", action="store_true", help="跳过配种组合生成 (只导出帕鲁图鉴)")
    args = parser.parse_args()

    html = fetch_html()
    pals = extract_pals(html)

    if not args.no_combos:
        combos, _ = build_breeding_table(pals)
        save_outputs(pals, combos)
    else:
        save_outputs(pals, [])

    if args.with_images:
        download_icons(pals)

    print("\n完成!")


if __name__ == "__main__":
    main()
