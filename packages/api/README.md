# @cesium-eco/api

API 接口层，封装 axios 请求客户端，提供大屏数据接口与 Mock 数据。

## 安装

```bash
pnpm add @cesium-eco/api --workspace
```

## 使用

```ts
import { fetchOverview, fetchAlerts, fetchTrend, createAPIClient } from '@cesium-eco/api'

// 使用默认客户端
const data = await fetchOverview()

// 自定义客户端
const client = createAPIClient('https://api.example.com')
```

**Vite Mock 插件**

```ts
import { pointsMock, overviewMock } from '@cesium-eco/api/mock'
```

## 导出

| 名称 | 说明 |
|------|------|
| `createAPIClient(baseURL?)` | 创建 axios 实例（默认 `/api`） |
| `defaultClient` | 默认 axios 实例 |
| `fetchOverview()` | 获取设备概览数据 |
| `fetchAlerts()` | 获取实时告警数据 |
| `fetchTrend()` | 获取趋势统计数据 |
| `fetchPoints()` | 获取监测点位数据 |
| `fetchPointDetail(id)` | 获取点位详情 |
| `mock/*` | Mock 数据模块（pointsMock、overviewMock 等） |

## 依赖

- `dependencies`: `axios ^1.15.2`
- `devDependencies`: `typescript`, `vite`, `@cesium-eco/config`, `@cesium-eco/shared`
