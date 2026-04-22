# 权限管理优化需求规格说明书 (SRS) - 路由与菜单映射

本文档详细描述了系统各功能模块与前端路由地址的对应关系。

## 1. 系统管理模块 (System Management)

| 功能名称 | 菜单路径 | 路由地址 (Hash Mode) | 组件 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| **域管理** | 系统管理 > 域管理 | `#/system/domain` | `DomainManager` | 管理多租户/多级域结构 |
| - 新增子域 | - | `#/system/domain/add` | (Modal) | 新增子域弹窗 |
| - 编辑子域 | - | `#/system/domain/edit/:id` | (Modal) | 编辑子域弹窗 |
| **菜单管理** | 系统管理 > 菜单管理 | `#/system/menu` | `MenuManager` | 配置系统菜单资源与权限标识 |
| **部门管理** | 系统管理 > 部门管理 | `#/system/dept` | `DeptManager` | 管理组织架构与部门层级 |
| **岗位管理** | 系统管理 > 岗位管理 | `#/system/post` | `PostManager` | 配置企业岗位信息 |
| **角色管理** | 系统管理 > 角色管理 | `#/system/role` | `RoleManager` | RBAC 角色授权与数据权限配置 |
| **用户管理** | 系统管理 > 用户管理 | `#/system/user` | `UserManager` | 用户账号、归属与状态管理 |
| - 新增用户 | - | `#/system/user/add` | (Modal) | 新增用户弹窗 |
| - 编辑用户 | - | `#/system/user/edit/:id` | (Modal) | 编辑用户弹窗 |
| **字典管理** | 系统管理 > 字典管理 | `#/system/dict` | `DictManager` | 系统通用字典数据维护 |
| **日志管理** | 系统管理 > 日志管理 | `#/system/log` | `LogManager` | 查看系统操作日志与审计 |

## 2. 配置管理模块 (Configuration Management)

| 功能名称 | 菜单路径 | 路由地址 (Hash Mode) | 组件 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| **组件管理** | 配置管理 > 组件管理 | `#/config/component` | `ComponentManager` | 可视化大屏组件库维护与预览 |
| - 新增分组 | - | `#/config/component/group/add` | (Modal) | 新增组件分组弹窗 |
| - 编辑分组 | - | `#/config/component/group/edit/:id` | (Modal) | 编辑组件分组弹窗 |
| **模板管理** | 配置管理 > 模板管理 | `#/config/template` | `TemplateManager` | 拖拽式大屏页面设计器 |

## 3. 路由模式与重定向

*   **路由模式**：系统采用 `HashRouter` (URL 中包含 `/#/`)。
    *   例如：`http://localhost:8080/#/system/domain`。
    *   **原因**：确保在无服务器端路由配置的静态托管环境（如预览工具、GitHub Pages、S3）中也能正常刷新页面和直接访问深层链接，避免 404 错误。
*   **重定向规则**：
    *   根路径 `/` 默认重定向至 `/system/domain`。
    *   任何未匹配的路径 (`*`) 将重定向至 `/system/domain`。

## 4. 路由设计说明 (Deep Linking)

系统采用了 Deep Linking 设计，关键资源的操作（如新增、编辑）拥有独立的 URL 地址。这允许用户直接分享或收藏特定操作页面的链接，同时在浏览器中通过前进/后退按钮自然地打开或关闭模态框。

*   **实现方式**：在父级页面组件中通过 `useMatch` 钩子监听特定路由模式（如 `/add`, `/edit/:id`），匹配成功时自动打开模态框，并在模态框关闭时导航回列表页。
*   **当前已支持路由模态框的模块**：域管理、用户管理、组件管理(分组)。
*   **权限控制 (Planning)**：目前前端路由通过 `react-router-dom` 实现。后续优化将引入 `RouteGuard` 组件，根据当前登录用户的 `permissions` 列表动态拦截路由访问。
