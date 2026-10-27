# CueMate Workspace Rules

## 1. 跨端代码复用规范
- 核心数据模型、Mock 数据、筛选排序、订单状态机、评价聚合、定位反解、聊天自动回复话术统一维护在 [`shared/cuemate-core.js`](./shared/cuemate-core.js) 及 [`shared/cuemate-core.d.ts`](./shared/cuemate-core.d.ts) 中。
- 修改 `shared/cuemate-core.js` 后，需同步更新 [`miniapp/shared/cuemate-core.js`](./miniapp/shared/cuemate-core.js)（可通过 `npm run sync:shared` 同步）。

## 2. 审美与图标规范（Dark Athletic Minimalist）
- **严禁使用拟物化/彩色系统 Emoji 作为 UI 图标**：禁止在 WXML / TSX 界面中使用 `📍`、`🔍`、`💬`、`📅`、`🖼️`、`🎙️`、`🔊`、`🔈`、`🕒`、`🏆`、`💳`、`🎟`、`🛡`、`📱`、`❓`、`⚙` 等 Emoji。
- **统一使用 2px 线性扁平矢量图标（Lucide 风格）**：
  - Web 端（`web/`）使用 `lucide-react`。
  - 微信小程序端（`miniapp/`）统一使用 `<ui-icon name="..." size="..." color="..." />` 组件（位于 `miniapp/components/ui-icon/`）。
- **色彩规范**：保持 `#09090b` 深色主背景、`rgba(24,24,27,0.65)` 卡片表面、`#27272a` 细边框、`#10b981` 台球绿主色与 `#facc15` 星级/段位金色点缀。
- 涉及 UI 或图标修改时，请参考并运行 `.agents/skills/cuemate-ui-design/SKILL.md` 中的校验脚本。
