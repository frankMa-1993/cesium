# 全域生态环境监测大屏

基于 **Vue 3 + Vite + TypeScript + Cesium** 的全域生态环境监测可视化：天地图 WMTS 影像与注记底图、监测点 Billboard、开发阶段 `/api/*` Mock，以及主屏地图中的 **Cesium 水面 Primitive**（PolygonGeometry + 内置 Water 材质）。详细参数见仓库根目录 [`水域.md`](./水域.md)。

本仓库为 **pnpm Monorepo**（`apps/`、`packages/`、`services/`），推荐使用 **`apps/dashboard`** 作为大屏生产入口；仓库根目录仍保留一套扁平 **`src/`** 结构，可通过根目录 `pnpm dev` 单独启动，便于对照或迁移。

---

## 仓库结构（概要）

```
cesium/
├── apps/
│   ├── dashboard/          # 大屏应用入口（推荐）
│   └── admin/              # 管理后台（Element Plus）
├── packages/
│   ├── app/                # 大屏页面、路由、Pinia（如 Dashboard.vue）
│   ├── core/               # Cesium：Viewer、天地图/高德图层、相机、水面、点位插件
│   ├── ui/                 # StatCard、TrendChart、MapViewer 等
│   ├── api/                # Axios 封装 + Mock 数据（供 Vite 插件拦截）
│   ├── shared/             # 样式变量与共享类型
│   └── config/             # Vite 共享配置
├── services/api/           # NestJS 后端（JWT/RBAC，与大屏/后台可选对接）
├── deploy/                 # docker-compose、k8s/monitoring 示例
├── src/                    # 遗留扁平前端（根目录 vite 入口，逻辑与 packages 类似）
├── vite.config.js          # 根目录 Vite（指向 ./src）
├── turbo.json              # Turborepo 任务与环境变量白名单
├── VERSIONING.md             # Changesets 与语义化版本说明
└── 水域.md                   # 水面 Primitive 参数说明
```

---

## 环境要求

- **Node.js**（建议 LTS）
- **pnpm**（workspace 与脚本均以 pnpm 为准）

---

## 本地启动（推荐：大屏）

### 1. 安装依赖

在仓库根目录执行：

```bash
pnpm install
```

### 2. 配置天地图 Token

在 **`apps/dashboard`**（或根目录遗留入口）对应的环境文件中设置：

```bash
VITE_TIANDITU_TOKEN=你在天地图申请的 Key
```

申请地址：[天地图开放平台](https://www.tianditu.gov.cn/)。未配置时仍可启动，但底图请求可能失败。

### 3. 启动开发服务器

```bash
pnpm --filter dashboard dev
```

默认 **`http://localhost:3000`**，浏览器可自动打开。

开发环境下 **`apps/dashboard`** 通过 `src/mock/vite-plugin-mock.ts` 拦截 **`/api/*`**，数据定义在 **`packages/api/src/mock/`**，无需单独启后端。

---

## 其他常用脚本（根目录 `package.json`）

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 使用根目录 **`vite.config.js`**，入口为 **`src/`**（遗留扁平工程） |
| `pnpm --filter dashboard dev` | 大屏 Monorepo 入口（**推荐**） |
| `pnpm dev:api` | 启动 Nest **`services/api`** |
| `pnpm dev:admin` | 启动 **`apps/admin`** 管理端 |
| `pnpm build` | 根目录工程构建（对应 **`src/`**） |
| `pnpm --filter dashboard build` | 构建 **`apps/dashboard`** |
| `pnpm preview` | 预览根目录 **`dist/`** |
| `pnpm test:unit` / `pnpm test:e2e` | 单元测试 / Cypress E2e（以根脚本为准时读取根配置） |

后端与数据库可参考 **`deploy/docker-compose.yml`** 启动 PostgreSQL / Redis，再配置 **`DATABASE_URL`**、**`REDIS_URL`** 等（详见 **`turbo.json`** 中的 `globalEnv`）。

---

## 打包与预览

```bash
pnpm --filter dashboard build
pnpm --filter dashboard preview
```

根目录遗留工程：

```bash
pnpm build
pnpm preview
```

构建时 **`vite-plugin-cesium`** 会将 Cesium 静态资源拷贝到输出目录并处理 **`baseUrl`**。

---

## 技术栈摘要

| 模块 | 说明 |
|------|------|
| Vue 3 | Composition API、`<script setup>` |
| TypeScript | Monorepo 内 packages/apps 广泛使用 |
| Vite 8 | ESM、HMR |
| Cesium 1.100 | `vite-plugin-cesium` 处理 Workers / WASM / Assets |
| 天地图 WMTS | 影像 `img_w` + 注记 `cia_w`，Token 经 **`VITE_TIANDITU_TOKEN`** 注入（dashboard 在 `define` 中为 **`__TIANDITU_TOKEN__**） |
| 高德卫星（可选） | `packages/core` 中 **`createGaodeSatelliteWmtsProvider`**，可与底图叠加并调节 **`ImageryLayer.alpha`** |
| Mock | 开发期中间件拦截 **`/api/*`**，聚合自 **`@cesium-eco/api`** |
| 布局 | 1920×1080 基准；大屏样式见 **`packages/app`** / **`packages/shared`** |

---

## HTTP 接口（Mock，前缀 `/api`）

| 路径 | 方法 | 说明 |
|------|------|------|
| `/api/overview` | GET | 设备概览 |
| `/api/alerts` | GET | 告警列表 |
| `/api/trend` | GET | 趋势数据 |
| `/api/points` | GET | 监测点 GeoJSON |
| `/api/points/:id` | GET | 单点详情 |

对接真实后端时，请配置 **`VITE_API_BASE`**（及所需认证逻辑），并关闭或绕过 Mock 插件。

---

## 自定义说明

### 轮询间隔

Monorepo：**`packages/app/src/views/Dashboard.vue`** 中的 **`setInterval`**。  
遗留：**`src/views/Dashboard.vue`**。

### 监测点数量与 Mock 数据

- Monorepo：**`packages/api/src/mock/points.ts`**（当前为示例数量的静态点位，可按需扩展或改为随机生成）。
- 遗留：**`src/mock/points.js`** 中 **`generateGeoJSON(数量)`**。

### 底图与图层（天地图 / 高德）

- **推荐维护位置（Monorepo）**：**`packages/core/src/layers.ts`** 中的 **`addTiandituLayers`**、**`createGaodeSatelliteWmtsProvider`**；天地图 Token 与 Viewer 侧常量见 **`packages/core/src/viewer.ts`**（构建时由 **`apps/dashboard/vite.config.ts`** 注入 **`__TIANDITU_TOKEN__`**）。
- **遗留入口**：**`src/utils/cesium-init.js`** 中的 **`addTiandituLayers`** 与同文件内的 **`createGaodeSatelliteWmtsProvider`**。

替换其他 **`WebMapTileServiceImageryProvider`** 时，请同步修改 **`url`**、**`layer`**、**`tileMatrixSetID`**、**`format`**、**`subdomains`** 等与服务商文档一致。

### 水面与地图 UI

逻辑与参数见 **`水域.md`**；代码主要在 **`packages/core/src/water.ts`** 与 **`packages/ui/src/components/MapViewer.vue`**（含图层勾选与销毁清理）。

---

## 版本与协作

发布与 Changesets 流程见 **[VERSIONING.md](./VERSIONING.md)**。

---

## 许可证

MIT

## 注意：
 本项目后面将不再要求使用 ts 去代码迭代