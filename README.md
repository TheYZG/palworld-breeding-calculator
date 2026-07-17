# 幻兽帕鲁配种计算器

一个实时同步的配种计算器：勾选你拥有的帕鲁，立刻看到能繁育出的全部后代及其所有亲代组合。

数据来源：[op.gg/zh-cn/palworld/breeding](https://op.gg/zh-cn/palworld/breeding)（共 299 只帕鲁 / 89,401 种组合）。

## 功能

- 勾选拥有的帕鲁，右侧实时显示所有可繁育后代
- 后代卡片可展开，查看每一对该后代的亲代组合
- 帕鲁搜索 + 9 种元素筛选 + 可繁育/不可繁育筛选
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
├── scraper.py                # 数据爬虫：从 op.gg 抓取 299 只帕鲁 + 89401 种配种组合
├── verify_output.py          # 数据校验脚本
├── public/data/
│   ├── pals.json             # 帕鲁基础信息（299 只）
│   ├── breeding_by_father.json  # 紧凑配种表 {父: [[母, 子代], ...]}
│   ├── breeding_combos.json  # 完整配种组合（89401 条）
│   └── pal_icons/            # 帕鲁图标（webp）
└── src/
    ├── lib/breeding.ts       # 配种核心算法：根据我的帕鲁集合计算可繁育后代
    ├── store/usePalStore.ts  # 全局状态：我的帕鲁 / 筛选 / 展开状态
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
python scraper.py            # 重新爬取全部数据（含图标）
python verify_output.py      # 校验数据完整性
```

依赖：`requests`。

## License

MIT
