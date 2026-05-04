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
│  ├─ mock/
│  │  ├─ bootstrap.defaults.ts             # 全局默认 mock 数据（唯一源）
│  │  ├─ assistant/                        # 智能体(ai-dock)专属 mock 数据
│  │  └─ index.ts                          # mock 统一导出入口
│  ├─ context/
│  │  └─ AppDataContext.tsx                # 全局数据上下文（统一更新/防抖持久化）
│  ├─ services/
│  │  └─ data-gateway/
│  │     ├─ index.ts                       # 统一数据网关（load/save）
│  │     └─ mockDataSource.ts              # mock 数据装配层
│  ├─ pages/                               # 系统管理、配置管理、大屏页面
│  ├─ components/                          # 通用组件、编辑器、预览组件
│  ├─ Assistant/
│  ├─ KnowledgeBase/
│  ├─ FaultReporting/
│  └─ AutoReporting/
├─ mock/
│  └─ mock-db.json                         # 本地持久化 JSON（运行后自动生成/更新）
├─ docs/
│  ├─ system-architecture.drawio           # 系统架构图（可编辑源文件）
│  └─ system-architecture.drawio.png       # 系统架构图（导出图）
├─ public/
├─ vite.config.ts                          # 含 /mock-api/bootstrap 本地读写接口
└─ package.json
```

## 4. 数据架构与持久化设计

### 4.1 统一数据入口

页面不再直接使用写死常量，统一从 `AppDataContext` 读取：

- 启动时 `loadBootstrapData()` 拉取一份完整数据集
- 页面增删改通过 `update*` 方法回写上下文
- 上下文通过统一的 `updateSlice` 管理更新模式（各模块一致）
- 持久化采用防抖写入（250ms）降低频繁 IO 和重渲染带来的性能影响

### 4.1.1 Mock 目录统一规范

- 全局默认 mock 仅维护在 `src/mock/`
- 运行态持久化数据仅维护在 `mock/mock-db.json`
- 业务页面禁止再直接定义全局 mock 常量，避免耦合

### 4.2 本地 JSON 持久化机制

开发态通过 Vite 中间件提供本地 mock API：

- `GET /mock-api/bootstrap`：读取 `mock/mock-db.json`
- `PUT /mock-api/bootstrap`：覆盖写入 `mock/mock-db.json`
- `GET /mock-api/ai-dock-sessions`：读取 `mock/ai-dock-sessions.json`
- `PUT /mock-api/ai-dock-sessions`：覆盖写入 `mock/ai-dock-sessions.json`

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

## 9. 一致性与低耦合原则（当前已执行）

1. **单一 mock 源**：`src/mock/`  
2. **单一持久化出口**：`saveBootstrapData`  
3. **单一更新模式**：`updateSlice -> update*`  
4. **防抖落盘**：减少高频编辑时的写盘压力  
5. **页面只关心本模块数据**：通过 context 方法更新，避免模块间直接依赖

## 10. 近期更新（2026-04）

### 10.1 智能体模块优化（`src/Assistant`）

- `ChatInterface.tsx`
  - 增加发送失败消息态（不再静默吞错）
  - 增加 API key 缺失防御提示
  - “发起新咨询”按钮已实现（新建并切换会话）
  - 修复 `setTimeout(handleSend, 100)` 状态竞态
  - 清理未使用图标导入
  - 增加对 `mock/assistant` 的知识/报告/工单快速命中回复
- `DiagnosisAgent.tsx`
  - 输入框 `userInput` 参与上下文构建
  - `status: any` 收窄为 `DiagnosisStep['status']`
  - `jump` 阶段增加超时后续动作（不再仅 loading）
- `AssistantView.tsx`
  - 清理未使用的 `activeTab` 相关死代码
- `NotificationMatrix.tsx`
  - 通道开关状态增加 `localStorage` 持久化
- `types.ts`
  - `DiagnosisStep.evidence` 从 `any` 改为结构化类型

### 10.2 智能体 mock 数据统一

- 原 `src/pages/agent/ai-dock/mocks/*` 已迁移至 `src/mock/assistant/*`
- 统一从 `src/mock/assistant/index.ts` 导出，减少组件对具体文件路径的耦合
- 新增 `src/mock/assistant/chatSessions.ts`，用于会话默认数据管理

### 10.3 全局 Select 组件样式修正

- 调整 `src/components/UI.tsx` 中全局 `Select`：
  - 统一按钮盒模型与箭头占位，修复窄宽度场景布局变形
  - 全局缩小一档尺寸（高度/字号/内边距）以匹配大屏按钮视觉比例

### 10.4 智能体业务诊断结果链路增强（`src/pages/agent/ai-dock`）

- 诊断结果卡样式强化（重点摘要 + 风险分布 + 优先建议）：
  - 在 `BusinessDiagnosisReportCard.tsx` 中新增“异常/关注/健康”数量徽标
  - 增加重点风险业务提示与建议分级展示，突出可直接执行项
- “生成汇报说明”改为真实实现：
  - 新增 `generateBusinessDiagnosisBrief(report)`，不再只发送问答文本
  - 生成过程通过系统通知流展示进度，完成后输出可直接对客沟通的话术说明
- “发起报障”支持多业务多选：
  - 诊断结果卡支持勾选多个业务后统一发起报障
  - 报障表单 `FaultFormCard.tsx` 改为可多选业务（批量提交）
  - `submitFaultTicket` 支持批量创建工单并统一展示状态流转
- 状态管理统一：
  - 会话态新增 `faultContexts` 批量上下文
  - `setFaultContext / setFaultContexts` 统一维护单业务与多业务场景

### 10.5 智能体会话持久化一致性修复（跨浏览器）

- `useAiDock` 会话存储已从“仅 localStorage”升级为“`mock/ai-dock-sessions.json` + localStorage 降级”。
- 启动时优先读取 `/mock-api/ai-dock-sessions`，不可用时回退浏览器本地缓存。
- 会话变更后会同时写入 JSON 与 localStorage，保证同一项目在不同浏览器刷新后看到一致会话数据。

### 10.6 智能体语义配色一致性与健康度策略修正

- 新增 `src/pages/agent/ai-dock/store/metricSemantics.ts`，统一指标语义判级（normal/warning/danger）：
  - 可用率：`>=99.8 normal`，`>=99.5 warning`，其余 `danger`
  - 时延：`<=25 normal`，`<=45 warning`，其余 `danger`
  - 丢包：`<=0.1 normal`，`<=0.3 warning`，其余 `danger`
  - 健康评分：`>=88 normal`，`>=78 warning`，其余 `danger`
- `BusinessDiagnosisReport` 与 `ReportCard` 均改为基于统一规则计算颜色状态，避免“语义与配色不一致”。
- 历史会话中的诊断报告在加载时会自动做一次状态归一化，修正旧数据错色。
- 业务诊断数据分布调整为“健康为主、关注少量、异常极少”，更贴近真实生产运营观感。

### 10.7 ai-dock Store 解耦（持久化与意图入口拆分）

- 将会话持久化 I/O 从 `useAiDock.ts` 拆分到：
  - `src/pages/agent/ai-dock/store/sessionPersistence.ts`
  - 统一管理 localStorage 与 `/mock-api/ai-dock-sessions` 的读写与时间戳比较
- 将意图入口判定从 `useAiDock.ts` 拆分到：
  - `src/pages/agent/ai-dock/store/intentRouter.ts`
  - `resolveIntent` 统一处理 `detectIntent` 与“业务查询强制命中”规则
- `useAiDock.ts` 仅保留流程编排与状态更新，降低后续替换真实 API 与策略扩展的改动范围。

### 10.8 ai-dock 知识问答流程解耦

- 新增 `src/pages/agent/ai-dock/store/knowledgeFlow.ts`：
  - 统一管理 FAQ 命中、知识检索、知识问答摘要构建
  - 对外提供 `findFaq / searchKnowledge / matchKnowledge / buildKnowledgeQaPayload`
- `useAiDock.ts` 不再内联知识检索和文案拼装细节，仅负责在意图命中后调度消息流。

### 10.9 ai-dock 诊断领域模型解耦

- 新增 `src/pages/agent/ai-dock/store/aiDockTypes.ts`：
  - 抽离 `BusinessDiagnosis*` 与 `FaultContext` 类型定义，避免 UI 组件直接耦合 `useAiDock` 内部实现。
- 新增 `src/pages/agent/ai-dock/store/businessDiagnosis.ts`：
  - 抽离业务诊断报告生成与历史报告状态归一化逻辑。
- `useAiDock.ts` 仅保留流程调度与状态编排，诊断数据计算职责下沉到独立模块。

### 10.10 ai-dock 诊断/报障流程 Runner 解耦

- 新增 `src/pages/agent/ai-dock/store/aiDockFlows.ts`：
  - `runDiagnosisFlow`
  - `runBusinessDiagnosisFlow`
  - `submitFaultTicketFlow`
- `useAiDock.ts` 改为依赖注入方式调用 flow runner（消息追加/状态更新由外部注入），流程逻辑与 store 状态拆分，便于后续单测与替换真实后端流程编排。

### 10.11 ai-dock 业务清单数据装配解耦

- 新增 `src/pages/agent/ai-dock/store/businessQueryData.ts`：
  - 抽离业务清单 mock 生成与详情字段装配逻辑（专线/5G/IDC/SD-WAN/智算）。
- `useAiDock.ts` 中删除大段装配实现，仅保留 `buildBusinessQueryData(activeCustomer)` 调用。
- 进一步降低 `useAiDock` 单文件复杂度，后续替换真实业务查询 API 时可直接替换该模块实现。

### 10.12 ai-dock 会话摘要计算解耦

- 新增 `src/pages/agent/ai-dock/store/sessionMeta.ts`：
  - 抽离会话预览文案计算 `extractMessagePreview`
  - 抽离历史卡片标签计算 `buildSessionSnapshotTags`
- `useAiDock.ts` 仅在 `sessionMetas` 处组合调用，减少与展示策略的耦合。

### 10.13 ai-dock 服务回执卡与运营指标补齐

- 新增 `src/pages/agent/ai-dock/messageStream/cards/ReceiptCard.tsx`：
  - 将“报障回执 / 催办回执 / 客户经理联络回执”统一为标准回执卡片（字段区 + 后续动作 + 快捷操作）。
- `MessageList.tsx` 新增 `receiptCard` 渲染分支，统一进入渐进卡片容器。
- 新增 `src/pages/agent/ai-dock/store/opsMetrics.ts`：
  - 本地记录最小运营指标：请求总量、意图命中、fallback 次数、知识反馈（有用/没用/过时）。
  - 后续接运营看板时可直接复用，不需改业务流程。
- `KnowledgeDrawer.tsx` 的内容反馈已接入 `useAiDock.submitKnowledgeFeedback`，反馈会计入运营指标。
- `sendUserText` 增加兜底异常处理：
  - 失败时展示可见 fallback 消息 + toast，不再静默失败。

## 11. 系统架构图（docs）

已提供完整系统架构图：

- 可编辑源文件：`docs/system-architecture.drawio`
- 导出预览图：`docs/system-architecture.drawio.png`

架构图覆盖：

1. 浏览器接入层与路由入口
2. 应用层（大屏/系统管理/配置管理/服务台/智能体）
3. 状态与数据访问层（`AppDataContext` / `useAiDock` / `data-gateway`）
4. 开发态持久化层（Vite middleware + `mock/*.json`）
5. 未来替换真实后端 API 的演进路径

## 12. 运维与演示建议

1. 做演示前建议先确认这两个文件存在且可读：
   - `mock/mock-db.json`
   - `mock/ai-dock-sessions.json`
2. 若你改了 `vite.config.ts`（mock API 路由），请重启 dev server。
3. 若要重置演示数据，可备份后删除上述 JSON，重启后会按默认 mock 重建。

## 13. 当前运行说明

- 常用开发地址：
  - `http://localhost:3000/`
  - `http://localhost:3001/`（并行调试端口）
- 常用业务入口：
  - `#/screen/sdwan`
  - `#/service/desk/knowledge`
