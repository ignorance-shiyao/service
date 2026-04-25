# 政企业务智慧运维管家（Frontend）

本项目是政企业务运维场景的前端系统，覆盖大屏总览、系统管理、配置管理、服务台与智能助手能力。  
当前已完成 **Mock 数据本地 JSON 持久化**，支持演示过程中“改完即保存、刷新不丢失”。

## 1. 技术栈

- React 19 + TypeScript
- Vite 6
- React Router（HashRouter）
- ECharts

## 2. 快速开始

```bash
npm install
npm run dev
```

默认访问：

- `http://localhost:3000/#/screen/sdwan`
- 或你当前在用的 `http://127.0.0.1:5173/#/screen/sdwan`

构建：

```bash
npm run build
```

## 3. 目录结构（核心）

```text
service/
├─ src/
│  ├─ index.tsx
│  ├─ App.tsx
│  ├─ context/
│  │  └─ AppDataContext.tsx                # 全局数据上下文（含持久化更新方法）
│  ├─ services/
│  │  └─ data-gateway/
│  │     ├─ index.ts                       # 统一数据网关（load/save）
│  │     └─ mockDataSource.ts              # 默认 mock 数据模板
│  ├─ pages/                               # 系统管理、配置管理、大屏页面
│  ├─ components/                          # 通用组件、编辑器、预览组件
│  ├─ Assistant/
│  ├─ KnowledgeBase/
│  ├─ FaultReporting/
│  └─ AutoReporting/
├─ mock/
│  └─ mock-db.json                         # 本地持久化 JSON（运行后自动生成/更新）
├─ public/
├─ vite.config.ts                          # 含 /mock-api/bootstrap 本地读写接口
└─ package.json
```

## 4. 数据架构与持久化设计

### 4.1 统一数据入口

页面不再直接使用写死常量，统一从 `AppDataContext` 读取：

- 启动时 `loadBootstrapData()` 拉取一份完整数据集
- 页面增删改通过 `update*` 方法回写上下文
- 上下文自动调用 `saveBootstrapData()` 持久化

### 4.2 本地 JSON 持久化机制

开发态通过 Vite 中间件提供本地 mock API：

- `GET /mock-api/bootstrap`：读取 `mock/mock-db.json`
- `PUT /mock-api/bootstrap`：覆盖写入 `mock/mock-db.json`

首次运行若 JSON 不存在：

1. 使用 `mockDataSource.ts` 中的默认模板数据
2. 自动创建并写入 `mock/mock-db.json`

### 4.3 降级策略

若本地 JSON 接口不可用，会回退到浏览器 `localStorage`，保证演示不中断。

## 5. 当前已接入持久化的页面数据

- 域管理（Domain）
- 菜单管理（Menu）
- 部门管理（Dept）
- 岗位管理（Post）
- 角色管理（Role）
- 用户管理（User）
- 字典管理（DictType / DictData）
- 组件管理（Components + 业务分类）
- 模板管理（Templates）

这些页面的新增、编辑、删除、状态切换都会触发 JSON 写入。

## 6. 业务模块概览

### 6.1 可视化大屏

- `#/screen/sdwan` 量子+SD-WAN
- `#/overview/home` 专线总览
- `#/screen/5g` 5G 专网
- `#/screen/idc` IDC
- `#/screen/cloud-network` 算网

### 6.2 系统管理

- 域 / 菜单 / 部门 / 岗位 / 角色 / 用户 / 字典 / 日志

### 6.3 配置管理

- 组件管理
- 模板管理（含模板编辑器）

### 6.4 服务台与智能能力

- 知识库
- 自助报障
- 自动报告
- 智能助手（诊断与建议）

## 7. API Key 说明（Gemini）

本项目保留前端直连配置（仅适合内网演示/开发）：

- `.env.local` 中配置 `GEMINI_API_KEY`
- `vite.config.ts` 注入 `process.env.API_KEY`

生产环境建议改后端中转，不在前端暴露密钥。

## 8. 后续替换真实后端的建议路径

你后续接 API 时，优先改这两处即可：

1. `src/services/data-gateway/index.ts`  
   将 `loadBootstrapData/saveBootstrapData` 改为真实接口调用
2. `src/context/AppDataContext.tsx`  
   保持页面侧接口不变（`update*`），减少页面改动成本

这样可以做到“页面基本不动，仅替换网关实现”。

