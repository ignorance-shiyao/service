# Design Token V2（暗黑主主题）

> 目标：在 `design/design_token.md` 基础上补齐 token 体系完整度。  
> 原则：**样式以你现有规范与页面为主**，参考 Semi 主要用于查漏补缺（分类与覆盖面），不替换你已定颜色与风格。

---

## 0. V2 相比 V1 的补全点

本版本新增了以下 V1 缺失项：

1. 全局功能色分组补齐：`text/icon/link/bg/fill/border/disabled/overlay`。
2. 新增 `shadow`、`z-index`、`stroke`、`opacity`、`gradient`、`focus ring` token。
3. 组件层扩展到更多高频组件：`Tabs / Tag / Badge / Pagination / Tooltip / Popover / Dropdown / Menu / Tree / Toast / Empty / Descriptions / SearchBar`。
4. 补齐状态维度：`default / hover / active / selected / disabled / loading`。
5. 增加“地图与拓扑”专项 token（你的页面重点）。
6. 增加命名约束与落地建议，方便后续自动化导出 JSON / CSS 变量。

---

## 1. Token 分层与命名

建议四层：

- `ref.*`：基础参考值（原子值，如色板、字号、间距）
- `sys.*`：语义系统值（文本、背景、边框、状态）
- `comp.*`：组件级变量（按钮、表格、弹窗等）
- `biz.*`：业务专项变量（SD-WAN 拓扑、量子链路）

命名约束：

1. 全小写，`.` 分层，不使用中文。
2. 先语义后状态：`comp.button.primary.bg.hover`。
3. 避免同义重复：有 `sys.text.primary` 就不要再建 `sys.font.mainColor`。

---

## 2. Reference Tokens（ref）

## 2.1 Color Ref

### 品牌与核心底色（保持你现有）

- `ref.color.blue.500 = #3080FF`
- `ref.color.bg.950 = #031130`
- `ref.color.bg.900 = #012753`
- `ref.color.bg.850 = #002147`
- `ref.color.bg.800 = #0C3058`
- `ref.color.bg.780 = #0D345F`
- `ref.color.bg.760 = #0A346D`
- `ref.color.bg.740 = #164C9B`
- `ref.color.border.700 = #0E2D6F`
- `ref.color.border.650 = rgba(30,73,128,0.8)`

### 状态色（保持你现有）

- `ref.color.success.500 = #00FF88`
- `ref.color.warning.500 = #F59E0B`
- `ref.color.danger.500 = #EF4444`
- `ref.color.info.500 = #00D4FF`
- `ref.color.quantum.500 = #A855F7`

### 文本中性色阶（保持你现有）

- `ref.color.text.100 = #BCCCE8`
- `ref.color.text.200 = #AFBED8`
- `ref.color.text.300 = rgba(210,218,231,0.85)`
- `ref.color.text.400 = #75819C`
- `ref.color.text.500 = #4E648A`
- `ref.color.text.inverse = #FFFFFF`

### 图表色盘（沿用规范）

- `ref.chart.palette.1 = #5B8FF9`
- `ref.chart.palette.2 = #5AD8A6`
- `ref.chart.palette.3 = #5D7092`
- `ref.chart.palette.4 = #F6BD16`
- `ref.chart.palette.5 = #E86452`
- `ref.chart.palette.6 = #6DC8EC`
- `ref.chart.palette.7 = #945FB9`
- `ref.chart.palette.8 = #FF9845`
- `ref.chart.palette.9 = #1E9493`
- `ref.chart.palette.10 = #FF99C3`

## 2.2 Typography Ref

- `ref.font.family.zh = "PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif`
- `ref.font.family.en = "Helvetica","Arial",sans-serif`
- `ref.font.size.12 = 12px`
- `ref.font.size.13 = 13px`
- `ref.font.size.14 = 14px`
- `ref.font.size.16 = 16px`
- `ref.font.size.18 = 18px`
- `ref.font.size.20 = 20px`
- `ref.font.weight.regular = 400`
- `ref.font.weight.medium = 500`
- `ref.lineHeight.base = 22px`

## 2.3 Spacing / Size / Radius Ref

- `ref.space.4 = 4px`
- `ref.space.8 = 8px`
- `ref.space.10 = 10px`
- `ref.space.12 = 12px`
- `ref.space.16 = 16px`（V2新增）
- `ref.space.20 = 20px`
- `ref.space.24 = 24px`
- `ref.space.32 = 32px`（V2新增）
- `ref.radius.3 = 3px`
- `ref.radius.6 = 6px`
- `ref.radius.8 = 8px`
- `ref.radius.12 = 12px`（V2新增）
- `ref.size.control.h = 32px`
- `ref.size.table.row = 40px`
- `ref.size.header.h = 50px`
- `ref.size.footer.h = 48px`
- `ref.size.sider.expanded = 220px`
- `ref.size.sider.collapsed = 48px`

## 2.4 Icon / Stroke / Opacity Ref（V2新增）

- `ref.icon.12 = 12px`
- `ref.icon.14 = 14px`
- `ref.icon.16 = 16px`
- `ref.icon.18 = 18px`
- `ref.icon.24 = 24px`
- `ref.icon.32 = 32px`
- `ref.stroke.1 = 1px`
- `ref.stroke.2 = 2px`
- `ref.opacity.disabled = 0.45`
- `ref.opacity.mask = 0.56`
- `ref.opacity.weak = 0.72`

## 2.5 Motion / Shadow / ZIndex Ref（V2新增）

- `ref.motion.fast = 160ms`
- `ref.motion.base = 240ms`
- `ref.motion.slow = 360ms`
- `ref.motion.ease.standard = cubic-bezier(0.2,0,0,1)`
- `ref.motion.ease.emphasis = cubic-bezier(0.2,0,0,0.95)`
- `ref.shadow.sm = 0 2px 8px rgba(3,17,48,0.28)`
- `ref.shadow.md = 0 6px 20px rgba(3,17,48,0.36)`
- `ref.shadow.lg = 0 10px 30px rgba(3,17,48,0.45)`
- `ref.z.base = 0`
- `ref.z.dropdown = 1000`
- `ref.z.sticky = 1010`
- `ref.z.overlay = 1020`
- `ref.z.modal = 1030`
- `ref.z.toast = 1040`

---

## 3. System Tokens（sys）

## 3.1 Text / Icon / Link

- `sys.text.primary = {ref.color.text.100}`
- `sys.text.secondary = {ref.color.text.200}`
- `sys.text.tertiary = {ref.color.text.300}`
- `sys.text.disabled = {ref.color.text.500}`
- `sys.text.inverse = {ref.color.text.inverse}`
- `sys.icon.primary = {sys.text.primary}`
- `sys.icon.secondary = {sys.text.secondary}`
- `sys.icon.disabled = {sys.text.disabled}`
- `sys.link.default = {ref.color.blue.500}`
- `sys.link.hover = #67B7FF`（来自现网）
- `sys.link.active = #2F81D9`（来自现网）

## 3.2 Background / Fill / Border

- `sys.bg.page = {ref.color.bg.950}`
- `sys.bg.header = {ref.color.bg.900}`
- `sys.bg.sider = {ref.color.bg.850}`
- `sys.bg.card = {ref.color.bg.850}`
- `sys.bg.card.hover = {ref.color.bg.800}`
- `sys.bg.container.raised = #082450`（现网兼容）
- `sys.bg.fill.strong = {ref.color.bg.800}`（V2新增 fill 分层）
- `sys.bg.fill.medium = rgba(12,48,88,0.72)`
- `sys.bg.fill.light = rgba(12,48,88,0.46)`
- `sys.border.primary = {ref.color.border.700}`
- `sys.border.secondary = {ref.color.border.650}`
- `sys.border.focus = {ref.color.blue.500}`

## 3.3 Functional Status

- `sys.state.info = {ref.color.info.500}`
- `sys.state.success = {ref.color.success.500}`
- `sys.state.warning = {ref.color.warning.500}`
- `sys.state.danger = {ref.color.danger.500}`
- `sys.state.quantum = {ref.color.quantum.500}`
- `sys.disabled.bg = rgba(78,100,138,0.22)`（V2新增）
- `sys.disabled.border = rgba(78,100,138,0.4)`（V2新增）
- `sys.disabled.text = rgba(75,90,115,0.8)`

## 3.4 Overlay / Mask / Focus Ring（V2新增）

- `sys.overlay.mask = rgba(3,17,48,0.56)`
- `sys.overlay.pop = #0D345F`
- `sys.focus.ring.color = rgba(48,128,255,0.48)`
- `sys.focus.ring.size = 2px`

---

## 4. Component Tokens（comp）

## 4.1 Layout

- `comp.layout.header.h = {ref.size.header.h}`
- `comp.layout.sider.w = {ref.size.sider.expanded}`
- `comp.layout.sider.wCollapsed = {ref.size.sider.collapsed}`
- `comp.layout.footer.h = {ref.size.footer.h}`
- `comp.layout.grid.gap = {ref.space.12}`

## 4.2 Button（补全状态）

- `comp.button.h = {ref.size.control.h}`
- `comp.button.radius = {ref.radius.3}`
- `comp.button.fontSize = {ref.font.size.14}`
- `comp.button.paddingX = 16px`
- `comp.button.gap = {ref.space.10}`
- `comp.button.primary.bg.default = {ref.color.blue.500}`
- `comp.button.primary.bg.hover = #4EA4FF`（现网）
- `comp.button.primary.bg.active = #2F81D9`（现网）
- `comp.button.primary.text = #FFFFFF`
- `comp.button.secondary.bg.default = #164C9B`
- `comp.button.secondary.bg.hover = #24598C`
- `comp.button.secondary.bg.active = #144279`
- `comp.button.ghost.border = rgba(48,128,255,0.25)`
- `comp.button.ghost.text = {ref.color.blue.500}`
- `comp.button.disabled.bg = {sys.disabled.bg}`
- `comp.button.disabled.text = {sys.disabled.text}`

## 4.3 Input / Select / Form

- `comp.input.h = {ref.size.control.h}`
- `comp.input.w.default = 200px`
- `comp.input.radius = {ref.radius.3}`
- `comp.input.bg = #002147`
- `comp.input.border.default = rgba(30,73,128,0.8)`
- `comp.input.border.hover = #2D6FB0`（现网）
- `comp.input.border.focus = {sys.border.focus}`
- `comp.input.placeholder = {sys.text.tertiary}`
- `comp.input.disabled.bg = {sys.disabled.bg}`
- `comp.form.item.gap = {ref.space.12}`
- `comp.form.group.gapY = {ref.space.24}`
- `comp.form.option.gap = {ref.space.20}`

## 4.4 Tabs / Nav / Menu（V2新增）

- `comp.tabs.h = 32px`
- `comp.tabs.text.default = {sys.text.secondary}`
- `comp.tabs.text.active = {ref.color.info.500}`
- `comp.tabs.bg.active = rgba(0,212,255,0.12)`
- `comp.menu.item.h = 40px`
- `comp.menu.item.bg.hover = rgba(17,65,135,0.45)`
- `comp.menu.item.bg.active = #114187`
- `comp.menu.item.text.default = #75819C`
- `comp.menu.item.text.active = #D7ECFF`
- `comp.menu.item.activeBar.w = 3px`（侧边选中竖线）

## 4.5 Card / Panel

- `comp.card.bg = {sys.bg.card}`
- `comp.card.border = {sys.border.primary}`
- `comp.card.radius = {ref.radius.8}`
- `comp.card.shadow = {ref.shadow.sm}`
- `comp.panel.bg = #082450`（现网大屏）
- `comp.panel.border = #2A67AA`

## 4.6 Table / Pagination

- `comp.table.row.h = {ref.size.table.row}`
- `comp.table.header.bg = #0D345F`
- `comp.table.header.text = #FFFFFF`
- `comp.table.row.bg.hover = #0A346D`
- `comp.table.border = #0E2D6F`
- `comp.table.text = {sys.text.primary}`
- `comp.table.link = {sys.link.default}`
- `comp.pagination.h = 32px`（V2新增）
- `comp.pagination.item.radius = {ref.radius.3}`
- `comp.pagination.item.bg.active = #114187`

## 4.7 Tag / Badge / Status Dot（V2新增）

- `comp.tag.h = 22px`
- `comp.tag.radius = 11px`
- `comp.tag.bg.info = rgba(0,212,255,0.14)`
- `comp.tag.bg.success = rgba(0,255,136,0.14)`
- `comp.tag.bg.warning = rgba(245,158,11,0.16)`
- `comp.tag.bg.danger = rgba(239,68,68,0.16)`
- `comp.badge.dot.size = 8px`
- `comp.badge.dot.success = {sys.state.success}`
- `comp.badge.dot.warning = {sys.state.warning}`
- `comp.badge.dot.danger = {sys.state.danger}`

## 4.8 Tooltip / Popover / Dropdown（V2新增）

- `comp.tooltip.bg = #0D345F`
- `comp.tooltip.text = #D7ECFF`
- `comp.tooltip.border = #2B6CB3`
- `comp.tooltip.radius = {ref.radius.6}`
- `comp.tooltip.shadow = {ref.shadow.md}`
- `comp.popover.bg = #082450`
- `comp.popover.border = #2B6CB3`
- `comp.dropdown.bg = #082450`
- `comp.dropdown.item.h = 32px`
- `comp.dropdown.item.bg.hover = rgba(17,79,142,0.6)`

## 4.9 Modal / Drawer / Toast / Empty

- `comp.modal.bg = #082450`
- `comp.modal.border = #2B6CB3`
- `comp.modal.radius = {ref.radius.8}`
- `comp.modal.minW = 362px`
- `comp.modal.mask = {sys.overlay.mask}`
- `comp.drawer.bg = #082450`
- `comp.drawer.border = #2B6CB3`
- `comp.toast.bg = #0D345F`（V2新增）
- `comp.toast.text = #E6F3FF`
- `comp.empty.text = {sys.text.tertiary}`（V2新增）

## 4.10 Tree / Descriptions / SearchBar（V2新增）

- `comp.tree.row.h = 32px`
- `comp.tree.row.bg.hover = rgba(17,79,142,0.55)`
- `comp.tree.row.bg.active = #0C3058`
- `comp.tree.indent = 16px`
- `comp.desc.label.text = {sys.text.secondary}`
- `comp.desc.value.text = {sys.text.primary}`
- `comp.desc.row.gapY = {ref.space.12}`
- `comp.searchbar.gap = {ref.space.12}`
- `comp.searchbar.control.h = {ref.size.control.h}`

## 4.11 Chart（保留 + 补全）

- `comp.chart.axis.text = #90C4E8`
- `comp.chart.legend.text = #9FC8F2`
- `comp.chart.grid.line = rgba(42,103,170,0.35)`（V2新增）
- `comp.chart.line.normal = #3B82F6`
- `comp.chart.line.quantum = #8B5CF6`
- `comp.chart.area.opacity = 0.14`（V2新增）
- `comp.chart.bar.radius = 2px`（V2新增）

## 4.12 Map / Topology（业务专项，V2细化）

- `biz.map.bg.gradient.start = #123F7F`
- `biz.map.bg.gradient.end = #061E40`
- `biz.map.city.fill.default = #2756B5`
- `biz.map.city.fill.hover = #4F83EA`
- `biz.map.city.stroke.default = #A9D7FF`
- `biz.map.city.stroke.hover = #ECF8FF`
- `biz.map.bubble.online = #22C55E`
- `biz.map.bubble.warning = #F59E0B`
- `biz.map.bubble.offline = #EF4444`
- `biz.map.bubble.quantum.ring = #A855F7`
- `biz.map.flyline.normal = #3B82F6`
- `biz.map.flyline.quantum = #8B5CF6`
- `biz.map.flyline.width.min = 0.9px`
- `biz.map.flyline.width.max = 11.5px`
- `biz.map.flyline.glow = rgba(139,92,246,0.3)`

---

## 5. 全局 CSS 变量建议（V2）

```css
:root[data-theme="dark-epsaas-v2"] {
  --ref-color-blue-500: #3080ff;
  --ref-color-bg-950: #031130;
  --ref-color-bg-900: #012753;
  --ref-color-bg-850: #002147;
  --ref-color-border-700: #0e2d6f;
  --ref-color-text-100: #bccce8;
  --ref-color-text-200: #afbed8;
  --ref-color-text-300: rgba(210, 218, 231, 0.85);
  --ref-color-success-500: #00ff88;
  --ref-color-warning-500: #f59e0b;
  --ref-color-danger-500: #ef4444;
  --ref-color-quantum-500: #a855f7;

  --sys-bg-page: var(--ref-color-bg-950);
  --sys-bg-header: var(--ref-color-bg-900);
  --sys-text-primary: var(--ref-color-text-100);
  --sys-text-secondary: var(--ref-color-text-200);
  --sys-border-primary: var(--ref-color-border-700);
  --sys-link-default: var(--ref-color-blue-500);
  --sys-state-success: var(--ref-color-success-500);
  --sys-state-warning: var(--ref-color-warning-500);
  --sys-state-danger: var(--ref-color-danger-500);
  --sys-state-quantum: var(--ref-color-quantum-500);

  --comp-button-h: 32px;
  --comp-button-radius: 3px;
  --comp-table-row-h: 40px;
  --comp-input-h: 32px;
  --comp-tabs-h: 32px;

  --biz-flyline-normal: #3b82f6;
  --biz-flyline-quantum: #8b5cf6;
}
```

---

## 6. 组件覆盖清单（V2）

已覆盖：
- 布局、导航、按钮、输入与表单、表格、弹窗、图表、地图拓扑。

V2 新增覆盖：
- Tabs、Tag、Badge、Pagination、Tooltip、Popover、Dropdown、Tree、Toast、Empty、Descriptions、SearchBar。

---

## 7. 落地规则

1. 新增样式必须优先使用 `sys.* / comp.*`，禁止直接写 hex。
2. 若组件缺 token：先补 `comp.*`，再实现样式。
3. 若业务特效（如飞线）需要独有变量，统一放到 `biz.*`。
4. 若未来引入明亮主题，仅替换 `ref.*` 与少量 `sys.*`，不改组件结构 token。
