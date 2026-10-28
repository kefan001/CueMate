# CueMate 微信小程序端（`miniapp/`）开发完成情况说明

> 更新时间：2026-10-29  
> 当前版本：`v1.2.0`（完整商业版 · 支持本地 SQLite 持久化与微信云开发双模切换）

---

## 1. 总体完成度概览

CueMate 微信小程序端（位于 [`miniapp/`](../miniapp)）已完成与 Web 端（[`web/`](../web)）100% 核心业务对齐，并在此基础上补齐了**微信小程序商业化上线所需的全部 6 大模块**：

| 模块维度 | 完成状态 | 核心能力说明 |
| :--- | :---: | :--- |
| **1. 跨端核心逻辑复用** | ✅ 已完成 | 抽离 [`shared/cuemate-core.js`](../shared/cuemate-core.js)，Web 与小程序共用同一套数据模型、筛选排序、订单状态机、评价聚合、定位反解与合规过滤函数 |
| **2. 用户端 + 陪玩端全页面闭环** | ✅ 已完成 | 覆盖登录/注册、发现筛选、陪玩详情预约、订单核销/售后/评价、实时聊天（文字/图片/语音）、陪玩接单台、接单管理、排班日程、个人中心共 **9 个核心页面** |
| **3. 扁平化极简 UI 与审美守卫** | ✅ 已完成 | 全面移除拟物化系统 Emoji，内置 32 个 `24x24` `2px` 描边 Lucide 风格扁平矢量图标组件 [`<ui-icon />`](../miniapp/components/ui-icon/index.js)，配套自动化审美巡检脚本 |
| **4. 服务端持久化与文件上传** | ✅ 已完成 | 提供零依赖本地 SQLite 服务端 [`server/local_server.py`](../server/local_server.py)（`http://127.0.0.1:4000`）与微信云函数 [`cuemate-api`](../miniapp/cloudfunctions/cuemate-api/index.js) |
| **5. 微信原生登录、支付与分账提现** | ✅ 已完成 | 接入 `wx.login` + `getPhoneNumber` 手机号快捷登录、头像昵称填写组件、微信支付 JSAPI 预付单收银台、陪玩收益提现到零钱 |
| **6. 达人入驻、排班锁单与提审合规** | ✅ 已完成 | 支持达人实名认证入驻申请、7 日分时段排班开关、并发锁单防重、`wx.openLocation` 球房导航、`msgSecCheck` 敏感词拦截、订阅消息与隐私协议弹窗 |

---

## 2. 目录结构与文件映射

```text
CueMate/
├── shared/
│   ├── cuemate-core.js               # 跨端共享业务核心（ES Module 源）
│   └── cuemate-core.d.ts             # TypeScript 类型声明
├── scripts/
│   └── sync-shared.mjs               # 将 shared/ 同步转换为小程序 CommonJS 模块
├── .agents/skills/cuemate-ui-design/
│   ├── SKILL.md                      # Dark Athletic Minimalist 审美与图标规范 Skill
│   └── scripts/check-ui-style.py     # UI 拟物 Emoji 与图标注册自动化校验脚本
├── server/
│   ├── local_server.py               # 本地 SQLite 持久化商业版后端（http://127.0.0.1:4000）
│   ├── src/main.ts                   # Node.js + Express 服务端入口
│   ├── data/cuemate.sqlite           # 本地 SQLite 数据库文件（自动生成）
│   └── uploads/                      # 聊天图片、语音、头像本地上传存储目录
└── miniapp/
    ├── app.js / app.json / app.wxss  # 小程序全局入口、路由配置与暗黑运动极简风全局样式
    ├── project.config.json           # 微信开发者工具项目配置（AppID: wxe138bd0afb001d35）
    ├── shared/cuemate-core.js        # 自动同步生成的 CommonJS 共享核心
    ├── cloudfunctions/cuemate-api/   # 微信云开发（CloudBase）云函数模板
    ├── utils/
    │   ├── api.js                    # 网络请求、文件上传、订阅消息、地图导航、云开发双模适配器
    │   ├── store.js                  # 响应式全局状态仓库（本地缓存 + 服务端 SQLite 自动同步）
    │   └── storage.js                # wx.getStorageSync / wx.setStorageSync 封装
    ├── components/
    │   ├── ui-icon/                  # 扁平化 Lucide SVG 矢量图标组件（支持动态 size 与 color）
    │   ├── bottom-nav/               # 双角色自适应底部导航栏（用户端 4 Tab / 陪玩端 5 Tab）
    │   └── modal-sheet/              # 底部滑出半屏弹窗组件
    └── pages/
        ├── auth/                     # 登录 / 注册 / 找回密码 / 微信手机号一键登录 / 协议弹窗
        ├── discovery/                # 用户端首页：定位获取、球类分类 Tab、关键词搜索、价格与智能排序
        ├── companion-detail/         # 陪玩详情页：口碑星级分布、球房地图导航、7日档期锁单、微信支付预约
        ├── orders/                   # 用户端订单：去支付、出示6位核销码、取消退款、陪玩爽约、申诉、评价与追评
        ├── messages/                 # 会话列表：未读角标、预约时段标签、实时连接状态提示
        ├── chat-thread/              # 聊天详情：服务沟通卡、快捷话术、发文字/上传图片/录制语音、已读回执
        ├── companion-dashboard/      # 陪玩接单台：在线/休息状态切换、可提现收益与零钱提现、今日待服务订单
        ├── companion-orders/         # 陪玩端接单管理：开始服务、标记用户爽约、提交完成、陪玩申诉、回评用户
        ├── companion-schedule/       # 陪玩端日程与排班：未来7天分时段可约/休息开关、待履约订单与球房导航
        └── profile/                  # 个人中心：钱包充值、定位刷新、口碑沉淀、达人认证入驻、微信头像昵称修改、双端身份切换
```

---

## 3. 各模块详细完成情况

### 3.1 页面与交互功能（对标 Web 端 + 微信原生增强）
1. **认证与合规（`pages/auth`）**
   - 支持手机号 + 密码登录、手机号 + 6 位验证码登录、新用户注册、找回重置密码。
   - 支持**微信手机号一键快捷登录**（`wx.login` + `open-type="getPhoneNumber"`）。
   - 内置《用户服务协议》《隐私保护指引》《绿色健康约球安全须知》勾选校验与全文阅读弹窗。
2. **发现与筛选（`pages/discovery`）**
   - 顶部支持 `wx.getLocation` 获取真实经纬度并反解城市区域（未授权时平滑降级至北京市朝阳区演示坐标）。
   - 支持 `推荐 / 附近 / 斯诺克 / 中式八球 / 高颜值 / 助教` 分类切换、关键词实时搜索、价格上限滑块过滤及三种排序策略（智能综合、价格从低到高、评分从高到低）。
3. **陪玩详情与锁单预约（`pages/companion-detail`）**
   - 展示陪玩大图、段位认证、时薪、距离、技能标签及真实订单聚合口碑（5 星比例条形图、高频标签、全部/最新/好评/待改进筛选）。
   - **球房地图导航**：点击常驻球房卡片可直接调起微信原生地图 `wx.openLocation` 导航。
   - **并发锁单防重**：未来 7 天时段网格自动置灰已被其他订单锁定的时段（显示 `已约满`）或被陪玩关闭的时段（显示 `休息`）。
   - 点击「立即预约」直接生成订单并拉起**微信支付收银台（JSAPI 预付单）**。
4. **全生命周期订单与双向评价（`pages/orders` & `pages/companion-orders`）**
   - 完整支持 10 种订单状态流转：`待支付 (pending_payment)` -> `待服务 (paid)` -> `服务中 (in_progress)` -> `待确认 (awaiting_confirmation)` -> `已完成 (completed)`，以及异常分支 `已取消 (cancelled)`、`已退款 (refunded)`、`申诉中 (disputed)`、`用户爽约 (no_show_user)`、`陪玩爽约 (no_show_companion)`。
   - 支持到店出示 **6 位数字核销码**开始服务。
   - 支持用户与陪玩**双向星级评价、快捷标签、匿名评价及后续追评**。
5. **多媒体聊天与文件上传（`pages/messages` & `pages/chat-thread`）**
   - 顶部展示本次预约球房（可点击导航）与预约时段沟通卡。
   - 支持文字消息、角色定制快捷回复话术、`wx.chooseMedia` 发送相册/拍照图片（自动通过 `wx.uploadFile` 上传至后端 `/uploads/`）、`wx.getRecorderManager` 录制与播放语音消息、消息已读/已送达回执。
6. **陪玩工作台、收益提现与自主排班（`pages/companion-dashboard` & `pages/companion-schedule` & `pages/profile`）**
   - **达人认证入驻**：在「我的 -> 成为陪玩 / 达人认证」填写称呼、段位、时薪、常驻球房与简介提交后，立即写入数据库并可一键切换至新入驻的陪玩工作台。
   - **收益分账与提现**：接单台实时计算已完成订单的可提现收益，支持一键「提现到零钱」。
   - **排班管理**：支持一键切换「在线接单中 / 休息中」，并在「我的日程」中按日期与小时开启/关闭可预约时段。

---

### 3.2 审美风格与扁平化图标系统（Dark Athletic Minimalist）
- **视觉规范**：全站遵循 `#09090b` 碳黑底色、`rgba(24,24,27,0.65)` 毛玻璃卡片、`#27272a` 细微描边、`#10b981` 台球桌翡翠绿主色与 `#facc15` 赛事金点缀。
- **扁平矢量图标库**：[`miniapp/components/ui-icon/icons.js`](../miniapp/components/ui-icon/icons.js) 封装了 32 个标准 Lucide 2px 线性 SVG 图标，彻底清除了界面中的彩色立体 Emoji。
- **自动化校验**：可通过以下命令运行审美与图标合规检查：
  ```bash
  /Users/zhongjindou/miniconda3/bin/python3 .agents/skills/cuemate-ui-design/scripts/check-ui-style.py
  ```

---

### 3.3 微信内容安全（`msgSecCheck`）与提审合规
- 在发聊天消息、填写预约备注、提交订单评价、修改个人资料、提交达人入驻申请时，前后端双重调用敏感词与 `msgSecCheck` 安全检测（自动拦截如「赌球」「赌博」「外围」「刷单」等违规词）。
- 在支付成功、开始服务等节点自动调用 `wx.requestSubscribeMessage` 记录订阅通知授权。

---

## 4. 本地运行与上线切换指南

### 4.1 本地开发联调（当前默认模式，0 成本）
1. **启动本地 SQLite 商业版后端**：
   ```bash
   /Users/zhongjindou/miniconda3/bin/python3 server/local_server.py
   ```
   - 浏览器打开 `http://127.0.0.1:4000/` 可查看可视化的 **CueMate 后端服务控制台**与实时数据库统计。
   - 健康检查：`http://127.0.0.1:4000/health`
   - 数据库存储位置：`server/data/cuemate.sqlite`
2. **微信开发者工具预览**：
   - 使用微信开发者工具打开 [`miniapp/`](../miniapp) 目录；
   - 在开发者工具右上角「详情 -> 本地设置」中勾选 **「不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书」**，即可直接与本地 `127.0.0.1:4000` 实时联调。

### 4.2 正式发布上线（切换微信云开发或微信云托管）
当个体工商户执照与微信认证完成后：
- **方式 A（推荐 · 微信云开发 CloudBase）**：
  1. 在微信开发者工具顶部点击「云开发」开通环境；
  2. 右键 [`miniapp/cloudfunctions/cuemate-api`](../miniapp/cloudfunctions/cuemate-api/index.js) 上传并部署云函数；
  3. 将 [`miniapp/utils/api.js`](../miniapp/utils/api.js) 中的 `mode` 从 `'local-server'` 改为 `'wx-cloud'`，无需购买服务器或备案域名即可直接上传提审。
- **方式 B（微信云托管 / 独立云服务器）**：
  1. 将 [`server/`](../server) 部署至微信云托管或已备案的 HTTPS 域名服务器；
  2. 将 [`miniapp/utils/api.js`](../miniapp/utils/api.js) 中的 `baseUrl` 替换为线上 `https://` 域名即可。
