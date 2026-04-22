# AI 统一入口（P1）

## 本批次范围
- 新增悬浮球 + DockPanel（6 Tab）
- 新增对话富消息渲染与回流机制
- 新增自助排障到工单创建链路
- 新增左下角演示控制台基础开关

## 演示主线（P1可跑）
1. 打开任意页面，点击右下角 AI 悬浮球。
2. 在对话里点“给我看看所有业务状态”，返回业务卡片。
3. 触发“立即体检”或切到“自助排障”，生成诊断报告。
4. 点“一键报障”，提交后看到工单卡片。
5. 左下角“工单推进”后，对话收到主动消息。

## Mock 数据
- `pages/agent/mock/`
- 已包含客户、业务卡片、报告、FAQ、工单等基础数据。

## 回流机制说明
- 通过 `store/aidock.tsx` 的动作总线实现。
- Tab 动作（体检、报障、工单推进、知识问答）统一写入 `messages`。
- 对话 Tab 按消息类型渲染富卡片。

## 现有项目依赖探查结果
- React 19 + TypeScript
- 路由：`react-router-dom` HashRouter
- 样式：Tailwind class（CDN）
- 图表：ECharts（含 `components/BaseChart.tsx`）
- 状态管理：组件内 `useState/useEffect` 为主，无 Redux/Zustand
- 通用 UI：`components/UI.tsx`

## 待确认项
- P2 是否需要直接复用现有 `KnowledgeBaseView/FaultReportingView/AutoReportingView` 的部分内容到统一入口。
- P2 业务详情抽屉是否要求图表全部改为 ECharts 封装组件。
- P3 是否需要补自动化测试（当前以构建 + 手工验收为主）。
