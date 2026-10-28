# CueMate Monorepo

这个仓库按多端共享结构组织：

- `shared/`：Web 端与微信小程序端共享的核心业务逻辑、状态规则与 Mock 数据层
- `web/`：Web 端 H5 原型（React + Vite + TypeScript + Tailwind）
- `miniapp/`：微信小程序端（与 `web/` 100% 功能对齐，可直接用微信开发者工具导入运行）
- `app/`：Expo + React Native 原生 App 骨架
- `server/`：后端服务骨架
- `docs/`：迁移和架构文档

## 目录说明

### `miniapp/`（微信小程序端）

直接打开 **微信开发者工具 -> 导入项目**，选择 `miniapp/` 目录即可运行。  
详细功能完成清单与本地/云开发切换说明见：[`docs/wechat-miniapp-status.md`](./docs/wechat-miniapp-status.md)。

若修改了 `shared/cuemate-core.js`，可运行：

```bash
npm run sync:shared
```

### `web/`

当前用户端 / 陪玩端 Web 原型，技术栈是：

- React
- Vite
- TypeScript
- Tailwind

常用命令：

```bash
cd web
npm install
npm run dev
```

### `app/`

当前原生端目录，技术栈是：

- Expo
- React Native
- Expo Router
- TypeScript

常用命令：

```bash
cd app
npm install
npm run start
```

### `server/`

后端服务骨架，当前先按 TypeScript + Express 组织，后续建议逐步升级到 NestJS。

常用命令：

```bash
cd server
npm install
npm run dev
```

## 根目录快捷命令

你也可以直接在根目录运行：

```bash
npm run sync:shared
npm run dev:web
npm run dev:app
npm run dev:server
```
