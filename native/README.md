# CueMate Native Skeleton

这个目录是给 `Expo + React Native + Expo Router` 迁移准备的原生骨架，不影响当前 Web 版本。

## 推荐初始化方式

根据 Expo 官方文档，建议新建 Expo Router 项目后，把这里的 `app/` 和 `src/` 迁进去。

参考命令：

```bash
npx create-expo-app@latest cuemate-native --template default@sdk-55
```

然后把本目录下的这些内容复制进去：

- `app/`
- `src/`

再安装你需要的能力包，例如：

- `expo-location`
- `expo-image-picker`
- `expo-av`
- `@react-native-async-storage/async-storage`

## 当前骨架包含

- 底部四 Tab
- 陪玩详情页
- 聊天详情页
- 原生主题变量
- 一组演示数据

## 为什么这里不直接接完整依赖

当前仓库仍以 Web 为主，先把原生页面结构和信息架构落下来更稳。等你确认走 Expo 方案后，再正式初始化独立原生项目接运行时依赖。
