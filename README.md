# 政企业务智慧运维管家（Frontend）

本项目是政企业务运维场景的前端系统，聚焦大屏总览、系统管理、配置管理、知识库、故障上报、自动报告与智能助手能力。

- 技术栈：`React 19` + `Vite 6` + `TypeScript` + `React Router (HashRouter)` + `ECharts`
- 当前默认开发地址：`http://localhost:3000`
- 当前主入口页面：`#/screen/sdwan`

---

## 1. 快速开始

### 1.1 环境要求

- Node.js：建议 `18+`（推荐 `20+`）
- npm：建议 `9+`

### 1.2 安装与启动

```bash
npm install
npm run dev
```

启动后访问：`http://localhost:3000/#/screen/sdwan`

### 1.3 构建与预览

```bash
npm run build
npm run preview
```

---

## 2. 项目结构（2026-04-22 重构后）

> 原则：业务源码统一收敛到 `src/`，根目录仅保留工程配置、文档与静态资源。

```text
service/
├─ src/                                # 全部业务源码
│  ├─ index.tsx                        # 应用入口（挂载 HashRouter）
│  ├─ App.tsx                          # 应用壳、导航、路由注册
│  ├─ GlobalContext.tsx                # 全局上下文
│  ├─ constants.ts                     # 常量与 mock 数据
│  ├─ types.ts                         # 全局类型
│  ├─ pages/                           # 页面级模块（系统管理/配置管理/大屏）
│  ├─ components/                      # 通用 UI、图表封装、编辑器、预览组件
│  ├─ Assistant/                       # 智能助手模块
│  ├─ KnowledgeBase/                   # 知识库模块
│  ├─ FaultReporting/                  # 故障上报模块
│  └─ AutoReporting/                   # 自动报告模块
├─ public/                             # 静态资源目录（构建时原样拷贝）
│  └─ screens/
├─ docs/                               # 产品方案/运维方案文档
├─ archives/                           # 归档文件（历史备份包、旧资源）
├─ index.html                          # Vite HTML 模板（入口 -> /src/index.tsx）
├─ vite.config.ts                      # Vite 配置（含 @ 别名与 API key 注入）
├─ tsconfig.json                       # TS 配置（@/* -> ./src/*）
├─ package.json
└─ package-lock.json
```

---

## 3. 架构与关键设计

### 3.1 路由模式

- 使用 `HashRouter`
- URL 形式：`http://localhost:3000/#/path`
- 目的：避免静态托管环境刷新深层路由导致 404

### 3.2 入口与路由壳

- 应用入口：`src/index.tsx`
- 主路由与导航：`src/App.tsx`
- 默认路由：`/` -> `/screen/sdwan`
- 未匹配路由：`*` -> `/screen/sdwan`

### 3.3 别名规范

- TS 路径别名：`@/*` -> `src/*`
- Vite 别名：`@` -> `./src`

建议新增代码优先使用 `@/` 形式导入，减少相对路径层级复杂度。

### 3.4 数据组织现状

- 当前大量页面仍使用 `constants.ts` 中的 mock 数据。
- `AutoReporting`、`KnowledgeBase`、`Assistant` 存在基于 Gemini 的 AI 调用逻辑。
- 后续如接后端，建议先将 mock 与服务层解耦（`src/services` + `src/api`）。

---

## 4. 环境变量与 AI 能力

### 4.1 已使用变量

项目通过 `vite.config.ts` 将 `GEMINI_API_KEY` 注入为以下运行时变量：

- `process.env.API_KEY`
- `process.env.GEMINI_API_KEY`

代码中主要通过 `process.env.API_KEY` 初始化 `GoogleGenAI`。

### 4.2 本地配置方式

在项目根目录创建 `.env.local`：

```bash
GEMINI_API_KEY=your_key_here
```

重启 `npm run dev` 后生效。

### 4.3 安全说明

当前为前端直连模式，API Key 会进入前端构建产物，不适合生产环境。生产建议改为：

1. 前端调用后端中转接口
2. 后端持有密钥并做鉴权与限流
3. 前端不再直接暴露第三方密钥

---

## 5. 功能模块说明

### 5.1 大屏与可视化

- `#/screen/sdwan`：量子+SD-WAN 管家
- `#/overview/home`：专线管家
- `#/screen/5g`：5G 专网管家
- `#/screen/idc`：IDC 管家
- `#/screen/cloud-network`：算网管家
- `#/visual/performance`：性能可视（占位页）
- `#/visual/resource`：资源可视（占位页）
- `#/visual/process`：流程可视（占位页）
- `#/customer/network`：客户内网（占位页）
- `#/alarm/visual`：告警可视（占位页）
- `#/video/monitor`：视频监控（占位页）
- `#/service/desk`：服务台（占位页）
- `#/message/notify`：消息通知

### 5.2 系统管理

- `#/system/domain/*`：域管理
- `#/system/menu/*`：菜单管理
- `#/system/dept/*`：部门管理
- `#/system/post/*`：岗位管理
- `#/system/role/*`：角色管理
- `#/system/user/*`：用户管理
- `#/system/dict`：字典管理
- `#/system/log`：日志管理

### 5.3 配置管理

- `#/config/component/*`：组件管理
- `#/config/template`：模板管理

### 5.4 智能能力模块

- `src/Assistant`：会话与诊断
- `src/KnowledgeBase`：知识管理与 AI 辅助
- `src/FaultReporting`：故障提报流程
- `src/AutoReporting`：自动报告与建议

---

## 6. 开发规范（建议执行）

### 6.1 目录规范

1. 所有业务源码只放 `src/`
2. 静态资源优先放 `public/`
3. 备份与历史文件放 `archives/`
4. 根目录禁止新增业务 TS/TSX 文件

### 6.2 代码组织建议

1. 页面级逻辑放 `src/pages`
2. 复用组件放 `src/components`
3. 模块内部类型优先就近放置（`types.ts`）
4. 跨模块公共类型再进入 `src/types.ts`

### 6.3 路由新增规范

1. 在 `src/App.tsx` 同步维护 `NAV_ITEMS` 与 `<Routes>`
2. 保持“菜单可达路径 = 路由可访问路径”
3. 占位模块明确标注，避免误判为已完成功能

---

## 7. 常见问题（FAQ）

### Q1：为什么构建时提示 `/index.css doesn't exist at build time`？

`index.html` 里有 `<link rel="stylesheet" href="/index.css">`，但仓库中暂无该文件。

- 影响：通常不阻塞构建，仅提示运行时再解析
- 处理建议（二选一）：
  1. 新建 `index.css` 并放置全局样式
  2. 若不需要该文件，移除 `index.html` 对应 `<link>`

### Q2：为什么使用 HashRouter 而不是 BrowserRouter？

因为当前更偏静态部署场景。Hash 模式不依赖服务端重写规则，部署更稳。

### Q3：AI 功能报 key 相关错误怎么办？

1. 检查 `.env.local` 是否存在 `GEMINI_API_KEY`
2. 重启 dev server
3. 检查 `vite.config.ts` 是否正确注入

---

## 8. 当前状态与后续建议

### 当前状态

- 目录重构已完成：源码统一迁移到 `src/`
- 路由与导航运行正常
- 构建可通过（存在大包体积告警与 `index.css` 提示）

### 后续建议

1. 建立 `src/services` 与 `src/api`，逐步替换 mock 数据。
2. 将 `App.tsx` 拆分为 `layout`、`router`、`nav` 三层，降低单文件复杂度。
3. 增加 ESLint/Prettier 与基础单测，固化开发质量。
4. 为生产环境引入后端代理，移除前端明文 API key。

---

## 9. 常用命令速查

```bash
# 开发
npm run dev

# 打包
npm run build

# 本地预览产物
npm run preview
```

