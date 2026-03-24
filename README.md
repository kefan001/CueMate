# CueMate Monorepo

这个仓库现在按三端结构整理好了：

- `web/`：Web 端 H5 / 管理前台原型
- `app/`：Expo + React Native 原生 App
- `server/`：后端服务骨架
- `docs/`：迁移和架构文档

## 目录说明

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
npm run dev:web
npm run dev:app
npm run dev:server
```
