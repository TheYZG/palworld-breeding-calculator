"""验证生成的配种数据与页面可见组合一致。"""
import json

with open("data/pals.json", "r", encoding="utf-8") as f:
    pals = json.load(f)
with open("data/breeding_combos.json", "r", encoding="utf-8") as f:
    combos = json.load(f)

by_slug = {p["slug"]: p for p in pals}
combo_lookup = {(c["father"], c["mother"]): c["child"] for c in combos}

# 页面可见的 20 条组合 (lamball 作为父本)
visible = [
    ("lamball", "lamball", "lamball"),
    ("lamball", "cattiva", "daedream"),
    ("lamball", "chikipi", "teafant"),
    ("lamball", "lifmunk", "mau"),
    ("lamball", "fuack", "lifmunk"),
    ("lamball", "fuack-ignis", "direhowl"),
    ("lamball", "vixy", "vixy"),
    ("lamball", "celaray", "tanzee"),
    ("lamball", "celaray-lux", "melpaca"),
    ("lamball", "cremis", "clovee"),
    ("lamball", "croajiro", "woolipop"),
    ("lamball", "croajiro-noct", "finsider"),
    ("lamball", "herbil", "swee"),
    ("lamball", "teafant", "vixy"),
    ("lamball", "gumoss", "depresso"),
    ("lamball", "pupperai", "foxparks"),
    ("lamball", "clovee", "sparkit"),
    ("lamball", "jolthog", "mau"),
    ("lamball", "jolthog-cryst", "gumoss"),
    ("lamball", "depresso", "jolthog"),
]

print("=== 验证页面可见组合 ===")
ok = 0
for fa, mo, exp in visible:
    got = combo_lookup.get((fa, mo), "???")
    status = "OK" if got == exp else f"FAIL (got {got})"
    if got == exp:
        ok += 1
    print(f"  {by_slug[fa]['name']} + {by_slug[mo]['name']} = {by_slug[exp]['name']}  [{status}]")
print(f"\n可见组合验证: {ok}/{len(visible)} 通过")

# 验证对称性: (A,B) 和 (B,A) 后代应相同
print("\n=== 验证对称性 (抽样 1000 对) ===")
import random
random.seed(42)
slugs = [p["slug"] for p in pals]
sym_ok = 0
sym_fail = 0
samples = 1000
for _ in range(samples):
    a, b = random.sample(slugs, 2)
    c1 = combo_lookup.get((a, b))
    c2 = combo_lookup.get((b, a))
    if c1 == c2:
        sym_ok += 1
    else:
        sym_fail += 1
        if sym_fail <= 3:
            print(f"  对称性失败: {a}+{b}={c1} vs {b}+{a}={c2}")
print(f"对称性: {sym_ok}/{samples} 通过")

# 验证 uniqueBreed: 不可繁殖帕鲁只能由 uniqueBreed 产生
print("\n=== 验证不可繁殖帕鲁的产出途径 ===")
non_breed = [p for p in pals if not p["isBreed"]]
# 统计每个不可繁殖帕鲁作为后代出现的次数
child_counts = {}
for c in combos:
    child_counts[c["child"]] = child_counts.get(c["child"], 0) + 1
print(f"不可繁殖帕鲁: {len(non_breed)} 个")
for p in non_breed[:10]:
    cnt = child_counts.get(p["slug"], 0)
    print(f"  {p['name']} ({p['slug']}): 作为后代出现 {cnt} 次")

# 统计: 作为后代出现的总分布
print("\n=== 后代分布统计 ===")
from collections import Counter
top_children = Counter(c["child"] for c in combos).most_common(10)
for slug, cnt in top_children:
    print(f"  {by_slug[slug]['name']} ({slug}): {cnt} 次")

# 数据完整性
print("\n=== 数据完整性 ===")
print(f"帕鲁总数: {len(pals)}")
print(f"组合总数: {len(combos)} (期望 {len(pals)**2})")
print(f"所有 child slug 合法: {all(c['child'] in by_slug for c in combos)}")
print(f"所有 father/mother slug 合法: {all(c['father'] in by_slug and c['mother'] in by_slug for c in combos)}")
