# 幻兽帕鲁配种计算器

一个实时同步的配种计算器：勾选你拥有的帕鲁，立刻看到能繁育出的全部后代及其所有亲代组合。

数据来源：
- 帕鲁基础信息与配种表：[op.gg/zh-cn/palworld/breeding](https://op.gg/zh-cn/palworld/breeding)（共 299 只帕鲁 / 89,401 种组合）
- 工作技能等级：[palworld.gg/zh-Hans/pals](https://palworld.gg/zh-Hans/pals)（浇水/手工/采矿等 12 种工作适用性）

## 功能

- 勾选拥有的帕鲁，右侧实时显示所有可繁育后代
- 后代列表自动排除你已拥有的帕鲁，只显示新可获得的
- **反向查询**：搜索目标帕鲁，快速定位可繁育出它的组合
- **后代筛选**：按元素筛选可繁育后代
- **配种链查找**：输入目标帕鲁，自动规划 1~3 代繁育路径
- **存档导出/导入**：导出 JSON 文件备份，或导入恢复
- **分享链接**：把当前选择编码到 URL，发给别人打开就是相同选择
- **详情弹窗**：点击任意帕鲁图标查看统计数据 / 工作技能 / 伙伴技能 / 被动技能
- 后代卡片可展开，查看每一对该后代的亲代组合
- 按编号 / 配对数 / 12 种工作技能等级排序
- 帕鲁搜索 + 9 种元素筛选 + 可繁育/不可繁育筛选
- 已选帕鲁自动保存到浏览器，刷新不丢失
- 明暗主题切换（自动跟随系统）
- 全部计算在浏览器本地完成，无后端，无网络请求
- 数据已内置打包，离线可用

## 在线使用

访问 GitHub Pages 部署的地址即可直接使用：

> `https://theyzg.github.io/palworld-breeding-calculator/`

（首次推送代码后由 GitHub Action 自动部署，1~2 分钟生效）

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器（默认 http://localhost:5173/）
npm run dev

# 类型检查
npm run check

# 打包构建（输出到 dist/）
npm run build

# 本地预览构建产物
npm run preview
```

## 技术栈

- **框架**：React 18 + Vite 6 + TypeScript
- **样式**：Tailwind CSS 3 + CSS 变量（明暗主题）
- **状态**：Zustand
- **图标**：lucide-react
- **字体**：Noto Serif SC / Noto Sans SC / JetBrains Mono

## 项目结构

```
.
├── scraper.py                # 数据爬虫：从 op.gg 抓取 299 只帕鲁 + 89401 种配种组合 + 图标
├── stats_scraper.py          # 工作技能爬虫：从 palworld.gg 抓取每只帕鲁的工作适用性等级
├── details_scraper.py        # 详细属性爬虫：统计数据 / 伙伴技能 / 被动技能
├── verify_output.py          # 数据校验脚本
├── public/data/
│   ├── pals.json             # 帕鲁基础信息（299 只）
│   ├── breeding_by_father.json  # 紧凑配种表 {父: [[母, 子代], ...]}
│   ├── breeding_combos.json  # 完整配种组合（89401 条）
│   ├── pal_stats.json        # 工作技能等级 {slug: {workId: level}}
│   ├── work_types.json       # 工作类型列表（12 种）
│   ├── pal_details.json      # 详细属性 {slug: {stats, partnerSkill, passiveSkills}}
│   └── pal_icons/            # 帕鲁图标（webp）
└── src/
    ├── lib/breeding.ts       # 配种核心算法：根据我的帕鲁集合计算可繁育后代
    ├── lib/breedingPath.ts   # 配种链查找：多代繁育路径搜索
    ├── lib/share.ts          # 分享链接编解码
    ├── store/usePalStore.ts  # 全局状态：我的帕鲁 / 筛选 / 排序 / 展开状态
    ├── hooks/usePalsData.ts  # 异步加载并解析数据
    ├── components/           # UI 组件
    └── pages/Home.tsx        # 主页面布局
```

## 配种算法

- 普通帕鲁：`子代 = 繁育表中 rank 最接近 (rank_a + rank_b) / 2 的可繁育帕鲁`；若存在并列，取 rank 较高者
- 不可繁育帕鲁（如神兽）：使用 `uniqueBreed` 字段指定的特定亲代组合

爬虫中已用页面上 20 组可见组合做对照验证，20/20 通过。

## 部署

推送到 `main` 分支后，[GitHub Pages Action](.github/workflows/deploy.yml) 会自动构建并发布。

如需自己部署（Vercel / Netlify / Cloudflare Pages 等），直接导入仓库即可，无需额外配置。

## 数据更新

如需重新爬取最新数据（游戏更新后）：

```bash
python scraper.py            # 重新爬取配种数据（含图标）
python stats_scraper.py      # 重新爬取工作技能等级（支持断点续传）
python details_scraper.py    # 重新爬取统计数据/伙伴技能/被动技能（支持断点续传）
python verify_output.py      # 校验配种数据完整性
```

依赖：`requests`。

## License

MIT
