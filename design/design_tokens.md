# Design Tokens

适用主题：暗黑主主题（政企业务智慧运维管家）

## 1. 基准与来源

1. 主基准：`/Users/ignorance/Downloads/东信软件/2024RD01_Managed_YWGJ_LinkSight_AHv1/5Design/界面设计/设计稿` 及其 `页面标注`。
2. 辅助基准：当前项目已实现页面的可用性与一致性。
3. 结构分层：`reference -> system -> components -> business`。
4. 页面与组件禁止直接硬编码色值，统一走 token。

---

## 2. Reference Tokens

### 2.1 Color

品牌蓝系：

- `brand.500`: `#0082FF`
- `brand.400`: `#2B83FF`
- `brand.300`: `#3E97FF`
- `brand.600`: `#0050A9`

暗色背景层级：

- `background.980`: `#000E1E`
- `background.950`: `#001F43`
- `background.900`: `#002147`
- `background.850`: `#052D58`
- `background.820`: `#0D345F`
- `background.800`: `#173155`
- `background.780`: `#164C9B`

面板与边框：

- `surface.panel`: `#012753`
- `surface.card`: `#052D58`
- `surface.tableHeader`: `#0D345F`
- `surface.tableRowHover`: `#00326B`
- `border.700`: `#0D345F`
- `border.650`: `#1E4980`
- `border.600`: `#2B6CB3`
- `border.soft`: `#526E95`
- `border.light`: `#9AB8E3`

文本色阶：

- `text.100`: `#FFFFFF`
- `text.200`: `#CAE0FF`
- `text.300`: `#BCCCE8`
- `text.400`: `#9AB8E3`
- `text.500`: `#6483AF`
- `text.600`: `#526E95`

状态色：

- `success`: `#30BF78`
- `successSoft`: `#63CE87`
- `warning`: `#FAAD14`
- `danger`: `#F4664A`
- `info`: `#0082FF`
- `quantum`: `#945FB9`

图表色盘：

`#5B8FF9 #5AD8A6 #6DC8EC #945FB9 #FF9845 #F4664A #FAAD14 #3E97FF #6483AF #9AB8E3`

### 2.2 Typography

字体（按优先级）：

- 中文主字体：`"Source Han Sans SC","PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif`
- UI 兜底：`"Microsoft YaHei","PingFang SC",sans-serif`
- 英文数字：`"Helvetica","Arial",sans-serif`

字号：`9 / 10 / 11 / 12 / 13 / 14 / 16 / 18`

字重：`400 / 500`

行高：

- `compact`: `16px`
- `base`: `20px`
- `relaxed`: `22px`

### 2.3 Spacing / Radius / Size

间距：`2 / 4 / 6 / 8 / 10 / 12 / 16 / 20 / 24 / 32`

圆角：`0 / 1 / 2 / 3 / 4 / 11 / 15`

关键尺寸：

- Header：`50px`
- Footer：`48px`
- Sider：`220px`（收起 `48px`）
- 控件高：`32px`
- 主按钮宽：`72px`
- 输入框默认宽：`210px`
- 表格行高：`40px`
- Tag 高：`22px`

### 2.4 Motion / Shadow / Stroke

动效：

- duration：`140ms / 220ms / 360ms / 1600ms(loop)`
- easing：`standard / emphasis / float`

阴影：

- `focus`: `0 1px 1px rgba(0,79,172,0.84)`
- `button`: `0 3px 6px rgba(0,0,0,0.16)`
- `buttonWeak`: `0 3px 6px rgba(0,0,0,0.05)`
- `panel`: `0 0 22px rgba(0,38,71,0.04)`
- `glow`: `0 0 10px rgba(0,0,0,0.1)`

描边：`0.5 / 1 / 2`

---

## 3. System Tokens

语义映射规则：

1. 文本：`primary/secondary/tertiary/disabled/inverse` 映射 `reference.color.text`。
2. 链接：`default/hover/active` 映射品牌蓝阶。
3. 背景：`page/header/sider/card/cardHover` 映射暗色层级。
4. 边框：`primary/secondary/light/focus` 映射描边层级与品牌焦点。
5. 状态：`info/success/warning/danger/quantum` 统一引用状态色。
6. Overlay：遮罩 `rgba(0,14,30,0.56)`，浮层底色继承 panel。

---

## 4. Component Tokens

统一组件规范：

1. `button`: `32px` 高、`72px` 主按钮宽、`4px` 圆角、`14px` 字号、带按钮阴影。
2. `input`: `32px` 高、`210px` 默认宽、`3px` 圆角、暗底+亮边框。
3. `table`: `40px` 行高、`12px` 正文、表头 `#0D345F`。
4. `menu`: 激活背景 `#114187`，激活条 `3px`。
5. `tabs`: 激活态使用品牌蓝并带弱底色。
6. `card/panel/modal/drawer/dropdown`: 全部复用深蓝底+蓝色边框体系。
7. `tag/badge`: 状态色透明背景 + 统一圆角胶囊风格。
8. `chart`: 轴文字、图例、普通/量子线、状态点全部走 token。

---

## 5. Business Tokens（SD-WAN）

地图与拓扑专项：

1. 安徽底图：保留深蓝渐变背景。
2. 地市面：默认 `#2756B5`，hover `#4F83EA`，描边 `#9AB8E3`。
3. 站点气泡：在线绿、告警橙、离线红、量子紫环。
4. 飞线：
   - 普通隧道：`#3E97FF`
   - 量子隧道：`#945FB9`
   - 宽度范围：`1.2px ~ 14px`
   - 光晕：`rgba(148,95,185,0.35)`
   - 空间抬升：`28px ~ 96px`

---

## 6. 使用约束

1. 新页面只使用 token，不直接写 hex。
2. 页面主题色以设计稿高频色为主，个别场景由业务层扩展。
3. 拓扑语义固定：普通隧道蓝、量子隧道紫、在线绿、告警橙、离线红。
4. 新增业务变量先落 `business` 层，再进入代码实现。
