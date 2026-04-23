# Design Token（v1.0）

> 适用范围：`政企业务智慧运维管家`（暗黑主题为主）
>
> 依据来源（主）：  
> - `/Users/ignorance/Downloads/东信软件/设计规范/规范暗黑.pdf`  
> - `/Users/ignorance/Downloads/东信软件/设计规范/设计规范.pdf`
>
> 依据来源（辅）：当前已实现页面（`App`、`QuantumSDWANOverview`、`UI`、`FloatingEntries`）

---

## 1. 设计原则

1. 以暗黑规范为主：布局、字号、组件高度、主色和信息层级严格沿用规范。
2. 以已实现页面为辅：对已上线视觉中高频值（如蓝色系图表、深蓝背景）做兼容映射。
3. Token 分层：`基础层（Base） -> 语义层（Semantic） -> 组件层（Component）`。
4. 避免“硬编码色值”：新增页面只允许使用 token，不直接写 hex。

---

## 2. 基础 Token（Base）

## 2.1 Color（暗黑主规范）

### 2.1.1 品牌与中性

| Token | Value | 说明 |
|---|---|---|
| `color.brand.500` | `#3080FF` | 主品牌色/提醒色 |
| `color.neutral.0` | `#FFFFFF` | 纯白（谨慎使用） |
| `color.neutral.100` | `#BCCCE8` | 默认正文 |
| `color.neutral.200` | `#AFBED8` | 次级文字 |
| `color.neutral.300` | `rgba(210,218,231,0.85)` | 弱化文字 |
| `color.neutral.400` | `#75819C` | 左侧菜单未选中文字/图标 |
| `color.neutral.500` | `#4E648A` | 失效文字/图标 |

### 2.1.2 背景与容器

| Token | Value | 说明 |
|---|---|---|
| `color.bg.base` | `#031130` | 页面最底层背景 |
| `color.bg.header` | `#012753` | Header 背景 |
| `color.bg.sider` | `#002147` | 侧边栏背景 |
| `color.bg.card` | `#002147` | 内容卡片背景 |
| `color.bg.menu.active` | `#114187` | Header 一级菜单选中 |
| `color.bg.sider.active` | `#0C3058` | Sider 选中背景 |
| `color.bg.table.header` | `#0D345F` | 表头背景 |
| `color.bg.table.hover` | `#0A346D` | 表格 hover 行背景 |
| `color.bg.emphasis.medium` | `#164C9B` | 中强调按钮背景 |

### 2.1.3 边框与分割

| Token | Value | 说明 |
|---|---|---|
| `color.border.default` | `#0E2D6F` | 默认边框/分割线 |
| `color.border.input` | `rgba(30,73,128,0.8)` | 输入框边框 |
| `color.border.brand.soft` | `rgba(48,128,255,0.25)` | 主色浅边框 |

### 2.1.4 状态色

| Token | Value | 说明 |
|---|---|---|
| `color.state.success` | `#00FF88` | 正常/成功 |
| `color.state.warning` | `#F59E0B` | 告警 |
| `color.state.danger` | `#EF4444` | 离线/错误 |
| `color.state.info` | `#00D4FF` | 信息强调 |
| `color.state.quantum` | `#A855F7` | 量子标识 |

---

## 2.2 Typography

> 规范推荐主字号为 `14px`，主行高 `22px`。

| Token | Value | 说明 |
|---|---|---|
| `font.family.zh` | `"PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif` | 中文优先 |
| `font.family.en` | `"Helvetica","Arial",sans-serif` | 英文/数字 |
| `font.size.12` | `12px` | 辅助文字/图表轴 |
| `font.size.13` | `13px` | 详情辅助文本 |
| `font.size.14` | `14px` | 正文/按钮/Tab |
| `font.size.16` | `16px` | 小标题/弹窗标题 |
| `font.size.18` | `18px` | 标题 |
| `font.size.20` | `20px` | 主标题 |
| `font.weight.regular` | `400` | 常规 |
| `font.weight.medium` | `500` | 标题级 |
| `line-height.base` | `22px` | 正文行高 |

---

## 2.3 Spacing / Radius / Size

| Token | Value | 说明 |
|---|---|---|
| `space.4` | `4px` | 微间距 |
| `space.8` | `8px` | 小间距 |
| `space.10` | `10px` | 按钮组间距 |
| `space.12` | `12px` | 栅格与默认间距 |
| `space.20` | `20px` | 表单项组间距 |
| `space.24` | `24px` | 表单上下节距 |
| `radius.3` | `3px` | 规范组件圆角（按钮/输入） |
| `radius.6` | `6px` | 卡片内小容器 |
| `radius.8` | `8px` | 卡片/浮层 |
| `size.header.h` | `50px` | 暗黑 Header 默认 |
| `size.sider.w.expanded` | `220px` | Sider 展开 |
| `size.sider.w.collapsed` | `48px` | Sider 收缩 |
| `size.footer.h` | `48px` | Footer |
| `size.control.h` | `32px` | 输入框/按钮统一高度 |
| `size.input.w.default` | `200px` | 输入框默认宽度 |
| `size.table.row` | `40px` | 表格行高 |

---

## 2.4 Icon

| Token | Value |
|---|---|
| `icon.size.xs` | `12px` |
| `icon.size.sm` | `14px` |
| `icon.size.md` | `16px` |
| `icon.size.lg` | `18px` |
| `icon.size.xl` | `24px` |
| `icon.size.hero` | `32px` |

---

## 2.5 Motion

| Token | Value | 说明 |
|---|---|---|
| `motion.duration.fast` | `160ms` | hover/微交互 |
| `motion.duration.base` | `240ms` | 常规切换 |
| `motion.duration.slow` | `360ms` | 面板/渐变 |
| `motion.easing.standard` | `cubic-bezier(0.2,0,0,1)` | 统一缓动 |
| `motion.easing.emphasis` | `cubic-bezier(0.2,0,0,0.95)` | 强调动画 |

---

## 3. 语义 Token（Semantic）

## 3.1 页面语义

| Token | Value |
|---|---|
| `semantic.page.bg` | `{color.bg.base}` |
| `semantic.page.text.primary` | `{color.neutral.100}` |
| `semantic.page.text.secondary` | `{color.neutral.200}` |
| `semantic.page.text.weak` | `{color.neutral.300}` |
| `semantic.header.bg` | `{color.bg.header}` |
| `semantic.sider.bg` | `{color.bg.sider}` |
| `semantic.card.bg` | `{color.bg.card}` |
| `semantic.card.border` | `{color.border.default}` |

## 3.2 交互语义

| Token | Value |
|---|---|
| `semantic.interactive.primary.bg` | `{color.brand.500}` |
| `semantic.interactive.primary.text` | `{color.neutral.0}` |
| `semantic.interactive.secondary.bg` | `{color.bg.emphasis.medium}` |
| `semantic.interactive.secondary.text` | `{color.neutral.0}` |
| `semantic.interactive.ghost.border` | `{color.border.brand.soft}` |
| `semantic.interactive.ghost.text` | `{color.brand.500}` |
| `semantic.interactive.disabled.text` | `rgba(75,90,115,0.8)` |

---

## 4. 组件 Token（Component）

## 4.1 Button

| Token | Value |
|---|---|
| `button.height` | `{size.control.h}` |
| `button.radius` | `{radius.3}` |
| `button.font.size` | `{font.size.14}` |
| `button.padding.x` | `16px` |
| `button.gap` | `{space.10}` |
| `button.primary.bg` | `{color.brand.500}` |
| `button.primary.text` | `{color.neutral.0}` |
| `button.secondary.bg` | `{color.bg.emphasis.medium}` |
| `button.secondary.text` | `{color.neutral.0}` |
| `button.outline.border` | `{color.border.brand.soft}` |
| `button.outline.text` | `{color.brand.500}` |
| `button.disabled.text` | `rgba(75,90,115,0.8)` |

## 4.2 Input / Form

| Token | Value |
|---|---|
| `input.height` | `{size.control.h}` |
| `input.width.default` | `{size.input.w.default}` |
| `input.radius` | `{radius.3}` |
| `input.bg` | `{color.bg.sider}` |
| `input.border` | `{color.border.input}` |
| `form.item.gap` | `{space.12}` |
| `form.group.gap.y` | `{space.24}` |
| `form.option.gap` | `>=20px` |

## 4.3 Table

| Token | Value |
|---|---|
| `table.row.height` | `{size.table.row}` |
| `table.header.bg` | `{color.bg.table.header}` |
| `table.header.text` | `{color.neutral.0}` |
| `table.border` | `{color.border.default}` |
| `table.row.hover.bg` | `{color.bg.table.hover}` |
| `table.action.link.color` | `{color.brand.500}` |

## 4.4 Modal / Drawer

| Token | Value |
|---|---|
| `modal.radius` | `{radius.8}` |
| `modal.min-width` | `362px` |
| `modal.content.gap.title` | `10px` |
| `modal.content.gap.footer` | `20px` |
| `modal.form.column.gap` | `20px~100px` |

## 4.5 Chart（ECharts）

### 主图表色（规范）
`#5B8FF9, #5AD8A6, #5D7092, #F6BD16, #E86452, #6DC8EC, #945FB9, #FF9845, #1E9493, #FF99C3`

### 大屏语义映射（结合现网）

| Token | Value |
|---|---|
| `chart.line.normal` | `#3B82F6` |
| `chart.line.quantum` | `#8B5CF6` |
| `chart.point.online` | `#00FF88` |
| `chart.point.warning` | `#F59E0B` |
| `chart.point.offline` | `#EF4444` |
| `chart.axis.text` | `#90C4E8` |
| `chart.legend.text` | `#9FC8F2` |

---

## 5. 当前项目兼容扩展 Token（辅）

> 以下值来自已实现页面高频使用，可作为暗黑规范的工程兼容层（不替代主规范）。

| Token | Value | 来源 |
|---|---|---|
| `compat.bg.shell` | `#020617` | App 主容器 |
| `compat.bg.panel` | `#082450` | SD-WAN 面板容器 |
| `compat.border.panel` | `#2A67AA` | 面板描边 |
| `compat.text.legend` | `#9FC8F2` | 图例文字 |
| `compat.accent.cyan` | `#00D4FF` | 指标强调 |
| `compat.accent.purple` | `#A855F7` | 量子强调 |

---

## 6. 推荐 CSS 变量清单（可直接落地）

```css
:root[data-theme="dark-epsaas"] {
  --color-brand-500: #3080ff;
  --color-bg-base: #031130;
  --color-bg-header: #012753;
  --color-bg-sider: #002147;
  --color-bg-card: #002147;
  --color-bg-table-header: #0d345f;
  --color-bg-table-hover: #0a346d;
  --color-border-default: #0e2d6f;
  --color-border-input: rgba(30, 73, 128, 0.8);

  --color-text-primary: #bccce8;
  --color-text-secondary: #afbed8;
  --color-text-weak: rgba(210, 218, 231, 0.85);
  --color-text-disabled: #4e648a;

  --color-state-success: #00ff88;
  --color-state-warning: #f59e0b;
  --color-state-danger: #ef4444;
  --color-state-info: #00d4ff;
  --color-state-quantum: #a855f7;

  --font-size-12: 12px;
  --font-size-13: 13px;
  --font-size-14: 14px;
  --font-size-16: 16px;
  --font-size-18: 18px;
  --font-size-20: 20px;
  --line-height-base: 22px;

  --space-8: 8px;
  --space-10: 10px;
  --space-12: 12px;
  --space-20: 20px;
  --space-24: 24px;

  --radius-3: 3px;
  --radius-8: 8px;

  --size-header-h: 50px;
  --size-sider-w: 220px;
  --size-sider-collapsed-w: 48px;
  --size-control-h: 32px;
  --size-input-w: 200px;
  --size-table-row-h: 40px;
}
```

---

## 7. 使用约束

1. 新页面优先使用第 2～4 章 token，不新增同义色值。
2. 组件样式的高宽、圆角、字号优先按规范值：`32/40/3/14`。
3. 大屏连线/状态色固定语义：`普通=蓝`、`量子=紫`、`在线=绿`、`告警=橙`、`离线=红`。
4. 如需扩展 token，必须新增到本文档并注明来源（规范 or 现网兼容）。
