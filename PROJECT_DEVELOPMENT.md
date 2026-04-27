# cesium-eco 项目开发文档

## 1. 项目概述

`cesium-eco` 是一套面向**生态环境监测领域**的 3D 可视化大屏解决方案。项目以 1920×1080 为设计基准，基于 **Vue 3 + Vite + Cesium** 技术栈，支持天地图底图渲染、200+ 实时监测点 Billboard 展示、1 秒级数据轮询与自适应布局。

核心功能特性：
- **3D 地球引擎**：Cesium 1.100，全球尺度地形与影像渲染
- **天地图集成**：WMTS 影像底图 + 注记叠加，Token 环境变量注入
- **监测点可视化**：200 个监测点动态 Billboard，支持点击弹窗与实时值波动
- **水面 Primitive**：按《水域.md》规范集成 Cesium 内置 Water 材质（PolygonGeometry）
- **Mock 数据体系**：开发阶段自动拦截 `/api/*`，无需后端即可联调
- **Monorepo 架构**：应用与共享包分离，支持独立迭代与复用

---

## 2. 架构设计

### 2.1 Monorepo 工具选型

| 工具 | 职责 | 选型理由 |
|------|------|----------|
| **pnpm workspaces** | 包管理与依赖链接 | 磁盘占用低、安装速度快、`workspace:*` 协议原生支持 Monorepo 内部依赖 |
| **Turborepo** | 任务编排与缓存 | 支持任务拓扑（`dependsOn`）、远程/本地缓存、并行执行，显著提升 CI 构建效率 |
| **Changesets** | 版本管理与 changelog 生成 | 声明式变更集、自动化版本 bump、生成 CHANGELOG，适合多包协同发布 |

### 2.2 包分层架构（Layered Architecture）

项目采用**六层包结构**，按职责自下而上分层：

```
┌─────────────────────────────────────────┐
│  apps/dashboard                         │  ← 应用入口层（App Entry）
│  生产级应用入口，负责打包、部署、测试       │
├─────────────────────────────────────────┤
│  packages/app                           │  ← 业务页面层（Business）
│  Dashboard 页面、路由、Pinia 状态管理      │
├─────────────────────────────────────────┤
│  packages/ui                            │  ← 组件层（Components）
│  Vue 3 组件库：MapViewer、StatCard 等      │
├─────────────────────────────────────────┤
│  packages/core                          │  ← 3D 引擎层（3D Engine）
│  Cesium 封装：Viewer、天地图、Billboard    │
├─────────────────────────────────────────┤
│  packages/api                           │  ← 数据层（Data）
│  axios 封装、Mock 数据、接口类型定义        │
├─────────────────────────────────────────┤
│  packages/shared + packages/config      │  ← 基础设施层（Infra）
│  类型定义、SCSS 变量、ESLint/TS/Vite 配置  │
└─────────────────────────────────────────┘
```

### 2.3 分层设计原则

**为什么拆分为 `core`、`ui`、`app` 三层？**

- **`core`** 只做 Cesium 相关底层封装，与 Vue 解耦，可被非 Vue 项目复用
- **`ui`** 只负责通用组件，与页面路由解耦，可被多个应用复用
- **`app`** 承载业务页面与状态管理，聚焦大屏业务逻辑
- 三层分离后，单包代码量控制在 **300 行以内**，降低维护复杂度

**为什么 `config` 不做构建？**

`config` 仅暴露静态配置文件（`tsconfig.base.json`、`vite.base.ts`）。源码直出可避免构建循环：若 `config` 需要构建，则所有包的构建脚本又依赖 `config`，形成循环依赖。

**为什么使用 `peerDependencies`？**

`cesium`、`vue`、`vue-router` 体积大且全局单例。使用 `peerDependencies` 可避免多包重复安装，确保运行时仅存在一份实例，减少包体积并防止上下文冲突。

---

## 3. 单仓多包结构详解

### 3.1 Workspace 配置

```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

`packages/*` 存放可复用的共享包，`apps/*` 存放可独立部署的应用。

### 3.2 各包详细职责

| 包名 | 路径 | 输出 | 说明 |
|------|------|------|------|
| `@cesium-eco/config` | `packages/config` | 源码直出 | 无构建步骤，直接暴露配置文件供其他包引用 |
| `@cesium-eco/shared` | `packages/shared` | `dist/` | 零运行时依赖，所有包均可安全引用 |
| `@cesium-eco/api` | `packages/api` | `dist/` | 依赖 `axios`；dev 依赖 `shared`、`config` |
| `@cesium-eco/core` | `packages/core` | `dist/` | peer 依赖 `cesium`；封装 Cesium 初始化、天地图、水面、相机 |
| `@cesium-eco/ui` | `packages/ui` | `dist/` | peer 依赖 `vue`、`cesium`；组合 `core` + `api` 提供业务组件 |
| `@cesium-eco/app` | `packages/app` | `dist/` | peer 依赖 `vue`、`vue-router`；聚合各底层包的业务页面模块 |
| `dashboard` | `apps/dashboard` | `dist/` | 应用入口，组合所有包，承载 dev server、测试、构建产物 |

### 3.3 依赖关系图

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

### 3.4 依赖规则

- `config`、`shared` 为**最底层**，无任何内部依赖，可被任意包引用
- `api` 依赖 `shared`，提供数据层能力
- `core` 为 Cesium 专用层，peer 依赖 `cesium`，可被 `ui` 和 `dashboard` 直接使用
- `ui` 组合 `core` + `api` + `shared`，提供业务组件
- `app` 聚合 `ui` + `core` + `api` + `shared`，输出页面级模块
- `dashboard` 为**唯一应用包**，依赖所有其他包，负责最终打包与部署

### 3.5 包间引用示例

```typescript
// packages/ui/src/components/MapViewer.vue
import { createViewer, addTiandituLayers } from '@cesium-eco/core'
import { fetchPoints, fetchPointDetail } from '@cesium-eco/api'

// packages/app/src/views/Dashboard.vue
import { MapViewer, StatCard, TrendChart } from '@cesium-eco/ui'
import { fetchOverview, fetchAlerts, fetchTrend } from '@cesium-eco/api'

// apps/dashboard/src/main.ts
import { router, pinia } from '@cesium-eco/app'
import { cesiumPlugin } from '@cesium-eco/core'
```

---

## 4. 技术栈及其业务运用

### 4.1 核心技术栈总览

| 技术 | 版本 | 业务运用 |
|------|------|----------|
| **Vue 3** | 3.5+ |  Composition API + `<script setup>`，响应式系统驱动大屏数据实时更新 |
| **Vite 8** | 8.0+ | 极速 HMR，ESM 原生支持，`vite-plugin-cesium` 自动处理 Cesium 静态资源 |
| **Cesium 1.100** | 1.100 | 3D 地球引擎，PolygonGeometry + 内置 Water 材质实现水面动画 |
| **TypeScript 6** | 6.0+ | 全栈类型安全，接口定义、组件 Props、Cesium API 均有类型约束 |
| **pnpm 10** | 10.33.2 | Workspace 协议链接，高效的依赖去重与磁盘占用优化 |
| **Turborepo 2** | 2.5+ | 任务管道编排与远程缓存，加速 Monorepo 构建 |
| **Changesets** | 2.29+ | 独立版本管理与自动化 Changelog 生成 |
| **Pinia 3** | 3.0+ | 状态管理，搭配持久化插件保存用户配置 |
| **Vitest + Cypress** | 4.1+ / 15.14+ | 单元测试与端到端测试全覆盖 |
| **Sass/SCSS** | 1.99+ | 大屏暗色主题变量系统，统一色彩与间距规范 |

### 4.2 各技术栈业务运用详解

#### Vue 3 + Composition API

大屏页面采用 `Composition API` + `<script setup>` 语法，所有业务逻辑集中在 `packages/app/src/views/Dashboard.vue`：

```typescript
// 1s 轮询合并请求，减少并发连接
async function loadData() {
  const [oRes, aRes, tRes] = await Promise.all([
    fetchOverview(),
    fetchAlerts(),
    fetchTrend(),
  ])
  // ... 更新响应式数据
}

onMounted(() => {
  timer = setInterval(updateTime, 1000)
  loadData()
})
```

#### Cesium + 天地图 WMTS

`packages/core/src/viewer.ts` 封装 Viewer 创建，关闭所有非必要 Widget 以优化性能：

```typescript
export function createViewer(container: string | HTMLElement): Cesium.Viewer {
  const viewer = new Cesium.Viewer(container, {
    animation: false,
    baseLayerPicker: false,
    geocoder: false,
    timeline: false,
    // ... 更多优化配置
  })
  viewer.scene.fog.enabled = false      // 关闭雾效减少 GPU 开销
  viewer.scene.postProcessStages.fxaa.enabled = true  // FXAA 抗锯齿
  return viewer
}
```

`packages/core/src/layers.ts` 集成天地图 WMTS 影像底图 + 注记叠加层：

```typescript
export function addTiandituLayers(viewer: Cesium.Viewer): void {
  const imgLayer = new Cesium.WebMapTileServiceImageryProvider({
    url: `https://t0.tianditu.gov.cn/img_w/wmts?tk=${TIANDITU_TOKEN}`,
    layer: 'img',
    style: 'default',
    tileMatrixSetID: 'w',
    format: 'tiles',
    maximumLevel: 18,
    subdomains: ['t0', 't1', 't2', 't3', 't4', 't5', 't6', 't7'],
  })
  viewer.imageryLayers.addImageryProvider(imgLayer)
  // ... 注记层叠加
}
```

#### 水面 Primitive（Water 材质）

`packages/core/src/water.ts` 使用 Cesium 内置 `Water` 材质，通过 `PolygonGeometry` 定义水域范围：

```typescript
export function addWaterSurface(viewer: Cesium.Viewer, options?: WaterSurfaceOptions): Cesium.Primitive {
  const primitive = new Cesium.Primitive({
    geometryInstances: new Cesium.GeometryInstance({
      geometry: new Cesium.PolygonGeometry({
        polygonHierarchy: new Cesium.PolygonHierarchy(
          Cesium.Cartesian3.fromDegreesArray(positions)
        ),
      }),
    }),
    appearance: new Cesium.EllipsoidSurfaceAppearance({
      material: new Cesium.Material({
        fabric: {
          type: 'Water',
          uniforms: {
            normalMap: Cesium.buildModuleUrl('Assets/Textures/waterNormals.jpg'),
            frequency: 1000.0,
            animationSpeed: 0.01,
            amplitude: 10,
          },
        },
      }),
    }),
  })
  viewer.scene.primitives.add(primitive)
  return primitive
}
```

#### Billboard 点位可视化

`packages/core/src/points.ts` 将 GeoJSON 点位渲染为 Billboard，运行时动态生成 Canvas 图标：

```typescript
export function loadBillboardPoints(
  viewer: Cesium.Viewer,
  geojson: PointGeoJSON,
  onClick?: (entity: Cesium.Entity, cartesian: Cesium.Cartesian3) => void
): PointLayerResult {
  const dataSource = new Cesium.CustomDataSource('points')

  geojson.features.forEach((feature) => {
    const [lon, lat] = feature.geometry.coordinates
    dataSource.entities.add({
      position: Cesium.Cartesian3.fromDegrees(lon, lat),
      billboard: {
        image: createPointCanvas(props.status),  // Canvas 动态生成
        scale: 1.0,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      },
    })
  })

  viewer.dataSources.add(dataSource)
  // ... 绑定点击事件
}
```

#### Mock 数据体系

`packages/api/src/mock/` 提供完整的 Mock 数据，开发阶段无需后端：

| 接口 | Mock 文件 | 说明 |
|------|-----------|------|
| `/api/overview` | `overview.ts` | 设备在线数、告警数、任务进度 |
| `/api/alerts` | `alerts.ts` | 实时告警列表（8 条） |
| `/api/trend` | `trend.ts` | 24 小时在线/告警/数据量趋势 |
| `/api/points` | `points.ts` | 200 个随机 GeoJSON 监测点 |
| `/api/points/:id` | `points.ts` | 单个监测点实时详情（含值波动） |

#### Pinia 状态管理

`packages/app/src/stores/index.ts` 定义大屏全局状态，搭配 `pinia-plugin-persistedstate` 持久化用户配置：

```typescript
// 示例：用户偏好持久化
export const useUserStore = defineStore('user', () => {
  // ... state & actions
}, {
  persist: true  // 自动持久化到 localStorage
})
```

---

## 5. 单元测试与 E2E 测试设计

### 5.1 测试技术栈

| 工具 | 用途 | 配置位置 |
|------|------|----------|
| **Vitest** | 单元测试 | `apps/dashboard/vitest.config.ts` |
| **@vue/test-utils** | Vue 组件测试辅助 | `apps/dashboard/package.json` |
| **jsdom** | 浏览器环境模拟 | `apps/dashboard/vitest.config.ts` |
| **@vitest/coverage-v8** | 覆盖率收集 | `apps/dashboard/package.json` |
| **Cypress** | E2E 端到端测试 | `apps/dashboard/cypress.config.ts` |
| **cypress-audit** | Lighthouse 性能审计 | `apps/dashboard/cypress.config.ts` |

### 5.2 Vitest 单元测试配置

```typescript
// apps/dashboard/vitest.config.ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  test: {
    globals: true,           // 全局 API（describe/it/expect）
    environment: 'jsdom',    // 模拟 DOM 环境
    passWithNoTests: true,   // 无测试时不报错
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      thresholds: {          // 覆盖率门槛
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
      },
    },
  },
})
```

### 5.3 单元测试策略

#### 分层测试目标

| 层级 | 测试对象 | 示例 |
|------|----------|------|
| **工具函数层** | `packages/shared`、`packages/api` 的纯函数 | 数据格式化、API 响应解析 |
| **核心封装层** | `packages/core` 的 Cesium 封装 | Viewer 创建参数校验、坐标转换 |
| **组件层** | `packages/ui` 的 Vue 组件 | `StatCard` Props 渲染、`TrendChart` SVG 路径计算 |
| **页面层** | `packages/app` 的页面逻辑 | `Dashboard.vue` 数据加载与状态变更 |

#### 组件测试示例（设计模式）

```typescript
// 推荐测试模式：StatCard 组件
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StatCard from '@cesium-eco/ui/components/StatCard.vue'

describe('StatCard', () => {
  it('正确渲染数值与单位', () => {
    const wrapper = mount(StatCard, {
      props: { label: '设备在线数', value: 128, unit: '台', color: '#00f0ff' }
    })
    expect(wrapper.text()).toContain('128')
    expect(wrapper.text()).toContain('台')
    expect(wrapper.text()).toContain('设备在线数')
  })

  it('颜色样式绑定正确', () => {
    const wrapper = mount(StatCard, {
      props: { label: '测试', value: 1, unit: '', color: '#ff0000' }
    })
    const valueEl = wrapper.find('.stat-value')
    expect(valueEl.attributes('style')).toContain('color: #ff0000')
  })
})
```

#### API 层测试示例（设计模式）

```typescript
// 推荐测试模式：API Client
import { describe, it, expect, vi } from 'vitest'
import { createAPIClient } from '@cesium-eco/api'

describe('API Client', () => {
  it('正确拼接 baseURL', () => {
    const client = createAPIClient('https://api.example.com')
    expect(client.defaults.baseURL).toBe('https://api.example.com')
  })

  it('响应拦截器提取 data', async () => {
    const client = createAPIClient()
    // Mock axios 响应
    const mockResponse = { data: { code: 200, data: { test: true } } }
    // 验证 interceptor 行为
  })
})
```

### 5.4 Cypress E2E 测试配置

```typescript
// apps/dashboard/cypress.config.ts
import { defineConfig } from 'cypress'
import { lighthouse, prepareAudit } from 'cypress-audit'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    video: false,
    screenshotOnRunFailure: false,
    setupNodeEvents(on, config) {
      lighthouse(on)  // 集成 Lighthouse 性能审计
      on('before:browser:launch', (browser, launchOptions) => {
        prepareAudit(launchOptions)
        return launchOptions
      })
      return config
    },
  },
})
```

### 5.5 E2E 测试策略

| 场景 | 测试内容 | 工具 |
|------|----------|------|
| **页面加载** | 大屏标题、统计卡片、地图容器是否正确渲染 | Cypress |
| **数据轮询** | 1s 时钟更新、API 数据是否正确展示 | Cypress |
| **地图交互** | 点击监测点是否弹出详情气泡 | Cypress |
| **图层切换** | 水域图层 / 高德影像图层的显示/隐藏 | Cypress |
| **性能基准** | FCP < 2s、TBT < 200ms | Cypress + Lighthouse |

### 5.6 测试执行命令

```bash
# 单元测试
pnpm test:unit

# 单元测试 + 覆盖率
pnpm --filter=dashboard coverage

# E2E 测试（需先 build）
pnpm test:e2e

# E2E 交互式调试
pnpm --filter=dashboard test:e2e:open

# 全部测试
pnpm test
```

### 5.7 Turborepo 测试任务编排

```json
// turbo.json
{
  "tasks": {
    "test:unit": {
      "dependsOn": ["^build"]   // 单元测试依赖上游包构建完成
    },
    "test:e2e": {
      "dependsOn": ["build"]    // E2E 测试依赖当前包构建完成
    }
  }
}
```

> **现状说明**：当前项目测试框架（Vitest + Cypress）已配置就绪，但 `apps/dashboard/tests` 目录及各包的 `__tests__` 目录尚为空。建议按上述分层策略逐步补充测试用例。

---

## 6. CI/CD 设计

### 6.1 工作流概览

所有 CI/CD 配置位于 `.github/workflows/` 目录下（基于 `CI_CD.md` 设计规范）：

| 工作流 | 文件 | 触发条件 | 职责 |
|--------|------|----------|------|
| **PR Checks** | `pr-checks.yml` | PR 打开/更新/重新打开 | Lint、Typecheck、Unit Test、Build |
| **Release** | `release.yml` | `main` 分支 push | 版本聚合、打 Tag、发布 |

### 6.2 PR Checks 工作流

```yaml
name: PR Checks

on:
  pull_request:
    branches: [main, develop]
    types: [opened, synchronize, reopened]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true  # 同一分支新提交取消旧任务

jobs:
  lint-and-typecheck:
    name: Lint & Typecheck
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - uses: pnpm/action-setup@v4
        with: { version: 10.33.2 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck

  test:
    name: Test
    runs-on: ubuntu-latest
    steps:
      # ... 环境准备同上
      - run: pnpm test:unit
      - uses: codecov/codecov-action@v4
        with:
          files: ./apps/dashboard/coverage/lcov.info
          fail_ci_if_error: false

  build:
    name: Build
    runs-on: ubuntu-latest
    env:
      TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
      TURBO_TEAM: ${{ secrets.TURBO_TEAM }}
    steps:
      # ... 环境准备同上
      - run: pnpm build
```

### 6.3 Release 工作流（Changesets 自动化）

```yaml
name: Release

on:
  push:
    branches: [main]

jobs:
  release:
    name: Release
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
      id-token: write
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - uses: pnpm/action-setup@v4
        with: { version: 10.33.2 }
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
          registry-url: 'https://registry.npmjs.org'
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
        env:
          TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
          TURBO_TEAM: ${{ secrets.TURBO_TEAM }}
      - uses: changesets/action@v1
        with:
          version: pnpm version-packages
          publish: pnpm release
          commit: 'chore(release): version packages'
          title: 'chore(release): version packages'
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### 6.4 Changesets 自动化发布流程

```
开发者提交代码 + Changeset
        │
        ▼
发起 Pull Request ──► PR Checks (Lint/Test/Build)
        │
        ▼
合并到 main 分支
        │
        ▼
release.yml 触发
        │
        ▼
Changesets Action 检测未消费 Changeset
        │
        ▼
自动创建 "Version Packages" PR
        │
        ▼
维护者审核并合并
        │
        ▼
自动执行 version + publish
        │
        ├── 更新 package.json 版本号
        ├── 生成 CHANGELOG.md
        ├── 创建 Git Tag (@cesium-eco/core@0.2.0)
        └── 创建 GitHub Release
```

### 6.5 Turborepo 远程缓存

Turborepo 本地缓存可加速重复构建，但在 CI 环境中每次运行都是全新 Runner。**远程缓存**将构建产物上传到云端，使不同机器、不同工作流之间共享缓存。

#### Vercel Remote Cache 配置

| Secret | 说明 |
|--------|------|
| `TURBO_TOKEN` | Vercel 个人访问令牌（Scope 需包含 `read/write`） |
| `TURBO_TEAM` | Vercel Team 的 slug（个人用户可填用户名） |

在 CI 中自动启用：

```yaml
env:
  TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
  TURBO_TEAM: ${{ secrets.TURBO_TEAM }}
```

#### Turborepo 缓存策略

| 任务 | 缓存 | 说明 |
|------|------|------|
| `build` | 启用 | 输出 `dist/`、`lib/`、`es/`，依赖上游 `^build` |
| `dev` | 禁用 | `cache: false` + `persistent: true`，长期运行 |
| `test` | 启用 | 依赖上游构建完成 |
| `lint` | 启用 | 纯静态检查，速度快 |
| `clean` | 禁用 | 清理任务不可缓存 |

### 6.6 部署策略

`apps/dashboard` 构建产物为纯静态文件（`dist/` 目录），适合部署到任何支持静态托管的平台。

#### 方案一：Vercel（推荐）

1. 在 Vercel Dashboard 导入本仓库
2. 设置 Framework Preset 为 `Vite`
3. Build Command：`cd ../.. && pnpm install --frozen-lockfile && pnpm build --filter=dashboard`
4. Output Directory：`apps/dashboard/dist`
5. 环境变量：`VITE_TIANDITU_TOKEN`

#### 方案二：Nginx / 自有服务器

```nginx
server {
    listen 80;
    server_name dashboard.example.com;
    root /var/www/cesium-eco/apps/dashboard/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### 环境划分

| 环境 | 分支 | 触发方式 | 用途 |
|------|------|----------|------|
| 开发环境 | `develop` | 合并自动部署 | 功能验证、内部测试 |
| 预发布环境 | `release/*` | 手动触发 | UAT、回归测试 |
| 生产环境 | `main` | Release 合并后自动部署 | 正式对外服务 |

#### 环境变量管理

| 变量 | 开发 | 预发布 | 生产 |
|------|------|--------|------|
| `VITE_API_BASE` | `/api` (Mock) | `https://staging-api.example.com` | `https://api.example.com` |
| `VITE_TIANDITU_TOKEN` | 开发 Token | 预发布 Token | 生产 Token |
| `NODE_ENV` | `development` | `production` | `production` |

---

## 7. 版本管理策略

### 7.1 语义化版本规则

严格遵循 [SemVer 2.0.0](https://semver.org/lang/zh-CN/)：

| 版本位 | 递增时机 | 示例场景 |
|--------|----------|----------|
| **MAJOR** | 不兼容的 API 修改 | 移除公开导出的函数、修改组件 Props 签名、Cesium 大版本升级 |
| **MINOR** | 向下兼容的功能新增 | 新增监测点类型、新增图表组件、新增 API 接口封装 |
| **PATCH** | 向下兼容的问题修复 | 修复 Billboard 渲染异常、修复轮询内存泄漏、修正类型定义错误 |

### 7.2 Commit 与 Changeset 对应关系

| Commit 类型 | 对应版本位 | Changeset 级别 |
|-------------|------------|----------------|
| `feat:` | `MINOR` | `minor` |
| `fix:` | `PATCH` | `patch` |
| `refactor:`（不兼容） | `MAJOR` | `major` |
| `perf:` | `PATCH` | `patch` |
| `docs:` / `style:` / `chore:` | 不触发 | 通常无需 Changeset |

### 7.3 独立版本控制

本项目采用**独立版本（Independent Versioning）**，每个包拥有独立的版本号：

```
@cesium-eco/core    0.3.1
@cesium-eco/ui      0.2.0
@cesium-eco/api     0.1.4
dashboard           0.5.0
```

独立版本的适用场景：
- 各包发布周期不同（`core` 频繁迭代，`shared` 相对稳定）
- 不同包面向不同使用方（内部包 vs 外部组件库）
- 需要精确控制每个包的变更范围与升级成本

---

## 8. 性能优化设计

### 8.1 构建与加载优化

- **Vite Code Splitting**：`manualChunks` 将 `cesium` 单独拆包，避免主包膨胀
- **Tree Shaking**：ESM 按需引入 Cesium API，未使用模块不会打包
- **静态资源自动化**：`vite-plugin-cesium` 仅在构建时拷贝 Cesium Assets / Workers

### 8.2 Cesium 渲染优化

- **关闭非必要 Widget**：`animation / timeline / baseLayerPicker / geocoder` 等全部禁用
- **关闭雾效**：`viewer.scene.fog.enabled = false`，减少远景片段着色开销
- **FXAA 后处理**：仅开启快速近似抗锯齿，平衡画质与性能
- **Billboard 替代 Primitive**：200 个点位使用 Billboard 而非 Entity Polygon，GPU 负担更低
- **Canvas 图标预生成**：点位图标为运行时 Canvas 生成，无需外部图片请求

### 8.3 运行时优化

- **1s 轮询合并**：Dashboard 使用 `Promise.all` 同时请求 overview + alerts + trend，减少并发连接
- **数据缓存**：Mock 中 200 个 GeoJSON 点位在内存中缓存，防止重复计算
- **SVG 轻量图表**：趋势图使用原生 SVG `<polyline>`，不引入 ECharts / D3 等重型库

### 8.4 性能基准

| 场景 | 预估值 |
|------|--------|
| 开发冷启动 | ~800 ms |
| 生产构建 | ~15–25 s |
| 首屏 FCP（生产 + gzip） | ~1.2–1.8 s |
| Cesium 初始化 | ~600–900 ms |
| 运行时内存（200 点位 + 天地图） | ~120–170 MB |
| 1s 轮询网络开销 | ~3 KB / 次 |

---

## 9. 开发规范

### 9.1 代码规范

- **包管理**：统一使用 **pnpm**（版本 >= 10.33.2），禁止混用 npm / yarn
- **单文件行数**：单个代码文件原则上不宜超过 **300 行**，复杂度高的模块应拆分
- **提交用户可见变更**：必须同步添加 Changeset：`pnpm changeset`
- **跨包修改**：需确保依赖关系正确，避免循环依赖

### 9.2 常用开发命令

```bash
# 启动开发服务器
pnpm dev

# 构建所有包
pnpm build

# 代码检查
pnpm lint
pnpm typecheck

# 测试
pnpm test:unit
pnpm test:e2e

# 格式化
pnpm format

# 清理
pnpm clean
```

---

## 10. 附录：目录结构总览

```
cesium-eco/
├── apps/
│   └── dashboard/              # 生产级应用入口
│       ├── src/
│       │   ├── main.ts         # 应用入口
│       │   ├── App.vue         # 根组件
│       │   ├── styles/         # Sass 全局样式
│       │   └── mock/           # Vite Mock 插件
│       ├── tests/              # 单元测试目录（待补充）
│       ├── cypress/            # E2E 测试目录（待补充）
│       ├── vitest.config.ts    # 单元测试配置
│       ├── cypress.config.ts   # E2E 测试配置
│       └── package.json
│
├── packages/
│   ├── config/                 # @cesium-eco/config — 共享配置
│   │   ├── tsconfig.base.json
│   │   └── vite.base.ts
│   ├── shared/                 # @cesium-eco/shared — 类型与工具
│   │   ├── src/types/
│   │   └── src/styles/
│   ├── api/                    # @cesium-eco/api — API 层
│   │   ├── src/client.ts       # axios 封装
│   │   ├── src/index.ts        # 接口导出
│   │   └── src/mock/           # Mock 数据
│   ├── core/                   # @cesium-eco/core — Cesium 核心
│   │   ├── src/viewer.ts       # Viewer 创建
│   │   ├── src/layers.ts       # 天地图层
│   │   ├── src/water.ts        # 水面 Primitive
│   │   ├── src/points.ts       # Billboard 点位
│   │   └── src/camera.ts       # 相机控制
│   ├── ui/                     # @cesium-eco/ui — Vue 组件库
│   │   └── src/components/
│   │       ├── MapViewer.vue   # 地图容器
│   │       ├── StatCard.vue    # 统计卡片
│   │       └── TrendChart.vue  # SVG 趋势图
│   └── app/                    # @cesium-eco/app — 业务页面
│       ├── src/views/
│       │   └── Dashboard.vue   # 大屏主页面
│       ├── src/router/
│       └── src/stores/
│
├── .changeset/                 # Changesets 配置
├── .github/workflows/           # GitHub Actions CI/CD
│   ├── pr-checks.yml           # PR 检查
│   └── release.yml             # 自动化发布
├── turbo.json                   # Turborepo 任务管道
├── pnpm-workspace.yaml          # pnpm Workspace 定义
├── package.json                 # 根包脚本
├── 水域.md                       # 水面 Primitive 集成规范
├── CI_CD.md                     # CI/CD 配置指南
├── VERSIONING.md                # 版本管理策略
├── PERFORMANCE.md               # 性能优化记录
├── DEVELOPMENT.md               # 本地开发指南
├── AGENTS.md                    # 工程说明（Agent 同步）
└── PROJECT_DEVELOPMENT.md       # 本文档
```
