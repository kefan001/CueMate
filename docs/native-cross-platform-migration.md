# CueMate 原生跨端迁移说明

## 方向

当前 Web 版本最适合迁移到 `Expo + React Native + Expo Router`。

这样做的原因：

- 现有项目已经是 React 组件化结构，业务状态和页面拆分都能继续复用思路。
- Expo 官方当前推荐在新项目里使用 Expo Router 做导航。
- 后续定位、录音、相册、推送、原生权限等能力，Expo 生态接得更顺。

参考资料：

- Expo 新项目与模板：<https://docs.expo.dev/more/create-expo/>
- Expo Router 安装与结构：<https://docs.expo.dev/router/installation/>
- Expo 导航建议：<https://docs.expo.dev/develop/app-navigation/>

## 当前仓库里已经准备好的内容

仓库新增了一个 `native/` 目录，里面放了一套原生 App 迁移骨架：

- `native/app/_layout.tsx`
- `native/app/(tabs)/_layout.tsx`
- `native/app/(tabs)/index.tsx`
- `native/app/(tabs)/orders.tsx`
- `native/app/(tabs)/messages.tsx`
- `native/app/(tabs)/profile.tsx`
- `native/app/messages/[threadId].tsx`
- `native/app/companion/[id].tsx`
- `native/src/mock.ts`
- `native/src/theme.ts`

这套骨架做了几件事：

- 按你现在的用户端信息架构，先映射出发现、订单、消息、我的四个 Tab
- 预留了陪玩详情页和聊天详情页
- 保留了目前 App 的视觉方向和核心数据结构思路

## 建议迁移顺序

1. 先把订单、消息、个人页迁到原生
2. 再迁陪玩详情和预约流程
3. 然后替换浏览器能力为原生能力

## 需要替换的 Web 能力

- `react-router-dom` -> `expo-router`
- 浏览器 `localStorage` -> `@react-native-async-storage/async-storage`
- 浏览器定位 -> `expo-location`
- 浏览器录音/文件 input -> `expo-av` / `expo-image-picker`
- WebSocket 保留，但生命周期改为原生页面与 AppState 语义

## Web 到原生的文件映射建议

- `src/pages/Discovery.tsx` -> `native/app/(tabs)/index.tsx`
- `src/pages/Orders.tsx` -> `native/app/(tabs)/orders.tsx`
- `src/pages/Messages.tsx` -> `native/app/(tabs)/messages.tsx`
- `src/pages/Profile.tsx` -> `native/app/(tabs)/profile.tsx`
- `src/pages/CompanionDetail.tsx` -> `native/app/companion/[id].tsx`
- `src/pages/ChatThread.tsx` -> `native/app/messages/[threadId].tsx`

## 下一步最值得做的

1. 用 `npx create-expo-app@latest` 正式初始化原生项目
2. 把当前 `mock` 数据和纯业务函数抽到共享层
3. 先接原生导航、列表、详情和 Tab
4. 再接登录、定位、聊天输入和媒体能力
