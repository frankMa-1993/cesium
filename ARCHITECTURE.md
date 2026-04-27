# 架构设计文档

## 1. 工程概述

`cesium-eco` 是基于 Vue 3 + Vite + Cesium 的全域生态环境监测大屏 Monorepo。通过 pnpm workspaces + Turborepo + Changesets 实现多包协作、增量构建与版本管理。

## 2. Monorepo 工具选型

| 工具 | 职责 | 选型理由 |
|------|------|----------|
| **pnpm workspaces** | 包管理与依赖链接 | 磁盘占用低、安装速度快、`workspace:*` 协议原生支持 Monorepo 内部依赖 |
| **Turborepo** | 任务编排与缓存 | 支持任务拓扑（`dependsOn`）、远程/本地缓存、并行执行，显著提升 CI 构建效率 |
| **Changesets** | 版本管理与 changelog 生成 | 声明式变更集、自动化版本 bump、生成 CHANGELOG，适合多包协同发布 |

## 3. 包结构与职责

```
cesium-eco/
├── apps/
│   └── dashboard/          # 生产级应用入口 — 全域生态环境监测大屏
├── packages/
│   ├── config/             # 共享配置 — ESLint、TypeScript、Vite 基础配置
│   ├── shared/             # 共享资源 — 类型定义、SCSS 变量、通用工具函数
│   ├── api/                # API 接口层 — axios 封装、Mock 数据、接口类型
│   ├── core/               # Cesium 核心封装 — Viewer、天地图、Billboard、水面 Primitive
│   ├── ui/                 # Vue 3 组件库 — MapViewer、StatCard、TrendChart
│   └── app/                # 大屏业务模块 — Dashboard 页面、路由、状态管理
└── package.json            # 根包：Turborepo 脚本、Changesets、Prettier
```

### 各包详细职责

| 包名 | 路径 | 输出 | 说明 |
|------|------|------|------|
| `@cesium-eco/config` | `packages/config` | 源码直出 | 无构建步骤，直接暴露配置文件供其他包引用 |
| `@cesium-eco/shared` | `packages/shared` | `dist/` | 零运行时依赖，所有包均可安全引用 |
| `@cesium-eco/api` | `packages/api` | `dist/` | 依赖 `axios`；dev 依赖 `shared`、`config` |
| `@cesium-eco/core` | `packages/core` | `dist/` | peer 依赖 `cesium`；封装 Cesium 初始化、天地图、水面、相机 |
| `@cesium-eco/ui` | `packages/ui` | `dist/` | peer 依赖 `vue`、`cesium`；组合 `core` + `api` 提供业务组件 |
| `@cesium-eco/app` | `packages/app` | `dist/` | peer 依赖 `vue`、`vue-router`；聚合各底层包的业务页面模块 |
| `dashboard` | `apps/dashboard` | `dist/` | 应用入口，组合所有包，承载 dev server、测试、构建产物 |

## 4. 依赖关系图

```
                        ┌─────────────────┐
                        │   dashboard     │  ← 应用入口 (apps/)
                        │   (app entry)   │
                        └────────┬────────┘
                                 │ depends on
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
        ▼                        ▼                        ▼
┌───────────────┐      ┌───────────────┐      ┌───────────────┐
│ @cesium-eco/  │      │ @cesium-eco/  │      │ @cesium-eco/  │
│      app      │      │      ui       │      │     core      │
└───────┬───────┘      └───────┬───────┘      └───────┬───────┘
        │                      │                      │
        │    ┌─────────────────┘                      │
        │    │            ┌───────────────────────────┘
        │    │            │
        ▼    ▼            ▼
┌─────────────────────────────────────────────────────────────┐
│                    @cesium-eco/api                           │
│         (axios 封装 / Mock / 接口类型)                       │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┴────────────────┐
        │                                 │
        ▼                                 ▼
┌───────────────┐               ┌───────────────┐
│ @cesium-eco/  │◄─────────────►│ @cesium-eco/  │
│    shared     │   (无依赖)    │    config     │
│ (types/utils/ │               │(tsconfig/vite│
│   scss vars)  │               │  /eslint)     │
└───────────────┘               └───────────────┘
```

### 依赖规则

- `config`、`shared` 为**最底层**，无任何内部依赖，可被任意包引用。
- `api` 依赖 `shared`，提供数据层能力。
- `core` 为 Cesium 专用层，peer 依赖 `cesium`，可被 `ui` 和 `dashboard` 直接使用。
- `ui` 组合 `core` + `api` + `shared`，提供业务组件。
- `app` 聚合 `ui` + `core` + `api` + `shared`，输出页面级模块。
- `dashboard` 为**唯一应用包**，依赖所有其他包，负责最终打包与部署。

## 5. 关键技术决策

### 5.1 为什么拆分为 `core`、`ui`、`app` 三层？

- **core** 只做 Cesium 相关底层封装，与 Vue 解耦，可被非 Vue 项目复用。
- **ui** 只负责通用组件，与页面路由解耦，可被多个应用复用。
- **app** 承载业务页面与状态管理，聚焦大屏业务逻辑。
- 三层分离后，单包代码量控制在 300 行以内（见 `AGENTS.md` 开发规范），降低维护复杂度。

### 5.2 为什么 `config` 不做构建？

`config` 仅暴露静态配置文件（`tsconfig.base.json`、`vite.base.ts`）。源码直出可避免构建循环：若 `config` 需要构建，则所有包的构建脚本又依赖 `config`，形成循环依赖。

### 5.3 为什么使用 `peerDependencies`？

`cesium`、`vue`、`vue-router` 体积大且全局单例。使用 `peerDependencies` 可避免多包重复安装，确保运行时仅存在一份实例，减少包体积并防止上下文冲突。

### 5.4 Turborepo 缓存策略

| 任务 | 缓存 | 说明 |
|------|------|------|
| `build` | ✅ 启用 | 输出 `dist/`、`lib/`、`es/`，依赖上游 `^build` |
| `dev` | ❌ 禁用 | `cache: false` + `persistent: true`，长期运行 |
| `test` | ✅ 启用 | 依赖上游构建完成 |
| `lint` | ✅ 启用 | 纯静态检查，速度快 |
| `clean` | ❌ 禁用 | 清理任务不可缓存 |

### 5.5 外部依赖收敛

- `cesium` 版本统一收敛在 `1.100`，由 `dashboard` 显式安装，`core` / `ui` 使用 peer 引用。
- `vue`、`vue-router`、`pinia` 等框架级依赖仅在应用包和 `ui` / `app` 中声明，避免底层包污染。
