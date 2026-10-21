# CueMate 微信小程序端 (`miniapp/`)

本目录是 CueMate 的**原生微信小程序端**，与 `web/` 端共享同一套核心业务与数据层（[`/shared/cuemate-core.js`](../shared/cuemate-core.js)），具备与 `web/` 端完全一致的功能闭环。

## 如何在微信开发者工具中运行

1. 打开 **微信开发者工具**
2. 选择 **小程序 -> 导入项目**
3. **项目目录** 选择本仓库下的 `miniapp` 文件夹：`/Users/zhongjindou/Projects/CueMate/miniapp`
4. **AppID** 可直接选择 **测试号**（或使用默认的 `touristappid`）
5. 点击导入即可直接运行预览（无需额外编译步骤）

## 与 Web 端共享复用说明

- **共享业务与数据核心**：[`/shared/cuemate-core.js`](../shared/cuemate-core.js)（同步至 [`miniapp/shared/cuemate-core.js`](./shared/cuemate-core.js)）
  - 统一的数据模型与初始数据（`companions`、`mockOrders`、`mockUser`、`mockChatThreads`、7日排期生成）
  - 统一的发现页搜索、标签筛选、价格区间过滤与智能排序逻辑（`filterAndSortCompanions`）
  - 统一的订单状态机メタ数据、核销码算法、退款文案计算与多状态过滤（`ORDER_STATUS_TEXT`、`getOrderVerificationCode`、`filterUserOrders`、`filterCompanionOrders`）
  - 统一的双向评价聚合、星级分布、好评率与高频标签统计（`getCompanionReviews`、`getUserReviews`、`getReviewSummary`）
  - 统一的账号校验、地理位置反解与聊天智能自动回复话术（`inferLocationLabel`、`replyTextFor`）
- 如修改了根目录 `/shared/cuemate-core.js`，可在根目录运行 `npm run sync:shared` 同步到小程序端。
