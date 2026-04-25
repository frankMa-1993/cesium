# 🌍 全域生态环境监测大屏

基于 **Vue 3 + Vite + Cesium** 构建的 1920×1080 大屏监测可视化项目，支持天地图底图、200+ 实时监测点 billboard 渲染、1s 数据轮询与自适应布局。

---

## 📁 项目结构

```
cesium/
├── index.html                  # 入口 HTML
├── vite.config.js              # Vite 配置（Cesium / Mock）
├── package.json    
├── .env                        # 环境变量（天地图 Token）
├── .env.development
├── src/
│   ├── main.js                 # 应用入口
│   ├── App.vue                 # 根组件
│   ├── router/
│   │   └── index.js            # 路由配置
│   ├── styles/
│   │   ├── vars.scss           # Sass 变量
│   │   └── index.scss          # 全局样式
│   ├── api/
│   │   └── index.js            # Axios 封装 + API 方法
│   ├── utils/
│   │   ├── cesium-init.js      # Viewer 初始化、图层管理、相机飞行
│   │   └── cesium-water.js     # 水面 Primitive（Water 材质）
│   ├── components/
│   │   ├── MapViewer.vue       # Cesium 地图容器（含气泡、图例）
│   │   ├── StatCard.vue        # 统计卡片
│   │   └── TrendChart.vue      # SVG 折线图
│   ├── views/
│   │   └── Dashboard.vue       # 主大屏页面
│   └── mock/
│       ├── index.js            # Mock 服务聚合入口
│       ├── overview.js         # 设备概览数据
│       ├── alerts.js           # 告警列表数据
│       ├── trend.js            # 趋势图数据
│       └── points.js           # 200 个监测点 GeoJSON
└── public/
    └── favicon.svg
```

---

## 🚀 本地启动

### 1. 安装依赖

```bash
npm install
```

### 2. 配置天地图 Token

复制 `.env.development` 中的变量，将 `your_tianditu_token_here` 替换为你在 [天地图官网](https://www.tianditu.gov.cn/) 申请的真实 Key：

```bash
VITE_TIANDITU_TOKEN=你的真实Token
```

> 若无 Token，项目仍可启动，但天地图底图可能无法正常加载（显示为空白或 401）。

### 3. 启动开发服务器

```bash
npm run dev
```

服务默认运行在 `http://localhost:3000`，浏览器会自动打开。

Mock 服务由 `src/mock/vite-plugin-mock.js` 在开发阶段自动拦截 `/api/*` 请求，无需额外启动后端。所有 mock 规则统一在 `src/mock/index.js` 中聚合导出。

---

## 📦 打包构建

```bash
npm run build
```

构建产物输出到 `dist/` 目录。vite-plugin-cesium 会自动将 Cesium 静态资源（WebWorker、wasm、Assets）拷贝到输出目录并修正 baseUrl。

```bash
npm run preview
```

预览生产构建结果。

---

## 🔧 关键技术点

| 模块 | 说明 |
|------|------|
| **Vue 3** | Composition API + `<script setup>` |
| **Vite** | 极速 HMR，ESM 原生支持 |
| **Cesium 1.100** | 3D 地球引擎，vite-plugin-cesium 自动处理静态资源 |
| **天地图 WMTS** | 影像底图 + 注记叠加层，Token 通过环境变量注入 |
| **自定义 Vite Mock 插件** | 开发阶段拦截 `/api/*`，返回 RESTful JSON |
| **自适应布局** | 1920×1080 设计稿基准，flex + grid 实现，小屏自动堆叠 |
| **1s 轮询** | `setInterval` 统一拉取 overview / alerts / trend |
| **Billboard** | 200 个监测点使用 Canvas 动态生成图标，支持点击弹窗 |

---

## 🌐 接口列表

所有接口前缀为 `/api`，均由 Mock 拦截：

| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/overview` | GET | 设备在线数、告警数、任务进度 |
| `/api/alerts` | GET | 实时告警列表（8 条） |
| `/api/trend` | GET | 24 小时在线/告警/数据量趋势 |
| `/api/points` | GET | 200 个随机 GeoJSON 监测点 |
| `/api/points/:id` | GET | 单个监测点实时详情（含值波动） |

---

## 📝 自定义配置

### 修改轮询间隔

在 `src/views/Dashboard.vue` 中调整：

```js
pollTimer = setInterval(loadData, 1000) // 单位 ms
```

### 修改监测点数量

在 `src/mock/points.js` 中调整 `generateGeoJSON(200)` 的参数。

### 替换底图服务

在 `src/utils/cesium-init.js` 的 `addTiandituLayers` 中替换 `WebMapTileServiceImageryProvider` 的 URL 与参数。

---

## 📄 许可证

MIT
