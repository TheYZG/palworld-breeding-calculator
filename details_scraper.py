"""
爬取每只帕鲁的详细属性数据，输出 public/data/pal_details.json。

数据源：https://palworld.gg/zh-Hans/pal/<中文名>

爬取字段：
  - stats: 统计数据（生命值/近战攻击/射击攻击/防御/支援/耐力/速度等）
  - partnerSkill: 伙伴技能 { name, desc }
  - passiveSkills: 被动技能列表 [{ name, rank, desc }]

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
DETAILS_PATH = "public/data/pal_details.json"


def parse_stats(section):
    """解析统计数据区域。"""
    stats = {}
    # <div class="name">XX</div>...<div class="value">YY</div>
    for m in re.finditer(
        r'<div class="name">([^<]+)</div>.*?<div class="value">(\d+)</div>',
        section, re.DOTALL
    ):
        name = m.group(1).strip()
        val = int(m.group(2))
        stats[name] = val
    return stats


def parse_partner_skill(section):
    """解析伙伴技能区域。"""
    m = re.search(
        r'<div class="name">([^<]+)</div>.*?<div class="content"><p>(.*?)</p>',
        section, re.DOTALL
    )
    if not m:
        return None
    name = m.group(1).strip()
    # 去掉内嵌的 <img> 标签，保留纯文本
    desc = re.sub(r'<[^>]+>', '', m.group(2)).strip()
    return {"name": name, "desc": desc}


def parse_passive_skills(section):
    """解析被动技能区域。"""
    skills = []
    # 每个 item: <div class="name">XX</div><div class="rank"><img src="...rank_XX.png"...></div>...<div class="content"><p>YY</p>
    for m in re.finditer(
        r'<div class="name">([^<]+)</div>\s*<div class="rank"><img src="[^"]*rank_(\d+)\.png"[^>]*>.*?<div class="content"><p>(.*?)</p>',
        section, re.DOTALL
    ):
        name = m.group(1).strip()
        rank = int(m.group(2))
        desc = re.sub(r'<[^>]+>', '', m.group(3)).strip()
        skills.append({"name": name, "rank": rank, "desc": desc})
    return skills


def fetch_details(name):
    """返回详情字典或 None（失败时）。"""
    name = name.strip()
    url = BASE + quote(name)
    r = requests.get(url, headers=HEADERS, timeout=20)
    if r.status_code != 200:
        return None
    t = r.content.decode("utf-8", errors="replace")

    result = {"stats": {}, "partnerSkill": None, "passiveSkills": []}

    # 统计数据
    i = t.find('<div class="stats">')
    if i >= 0:
        j = t.find('</div></div></div>', i)
        if j < 0:
            j = i + 3000
        result["stats"] = parse_stats(t[i:j])

    # 伙伴技能
    i = t.find('伙伴技能</h2>')
    if i >= 0:
        j = t.find('被动技能</h2>', i)
        if j < 0:
            j = i + 2000
        result["partnerSkill"] = parse_partner_skill(t[i:j])

    # 被动技能
    i = t.find('被动技能</h2>')
    if i >= 0:
        j = t.find('主动技能</h2>', i)
        if j < 0:
            j = i + 3000
        result["passiveSkills"] = parse_passive_skills(t[i:j])

    return result


def main():
    pals = json.load(open(PALS_PATH, encoding="utf-8"))

    existing = {}
    if os.path.exists(DETAILS_PATH):
        existing = json.load(open(DETAILS_PATH, encoding="utf-8"))

    details = dict(existing)
    todo = [p for p in pals if p["slug"] not in details]
    print(f"共 {len(pals)} 只，已爬 {len(details)}，待爬 {len(todo)}")

    failed = []
    for idx, p in enumerate(todo, 1):
        name = p["name"]
        slug = p["slug"]
        data = None
        for attempt in range(3):
            try:
                data = fetch_details(name)
                if data is not None:
                    break
            except requests.RequestException:
                pass
            time.sleep(1 + attempt)
        if data is None:
            print(f"[{idx}/{len(todo)}] FAIL {name} ({slug})")
            failed.append(slug)
            time.sleep(0.5)
            continue
        details[slug] = data
        if idx % 20 == 0 or idx == len(todo):
            print(f"[{idx}/{len(todo)}] {name} -> stats={len(data['stats'])} passive={len(data['passiveSkills'])}")
            json.dump(details, open(DETAILS_PATH, "w", encoding="utf-8"),
                      ensure_ascii=False, indent=2)
        time.sleep(0.3)

    json.dump(details, open(DETAILS_PATH, "w", encoding="utf-8"),
              ensure_ascii=False, indent=2)
    print(f"\n完成：{len(details)} 只帕鲁")
    if failed:
        print(f"失败 {len(failed)} 只：{failed}")


if __name__ == "__main__":
    main()
