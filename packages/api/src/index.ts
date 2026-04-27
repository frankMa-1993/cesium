/**
 * @cesium-eco/api
 * API 接口层
 */

import { defaultClient, createAPIClient } from './client'

export { createAPIClient, defaultClient }

// 大屏数据接口
export const fetchOverview = () => defaultClient.get('/overview')
export const fetchAlerts = () => defaultClient.get('/alerts')
export const fetchTrend = () => defaultClient.get('/trend')
export const fetchPoints = () => defaultClient.get('/points')
export const fetchPointDetail = (id: string) => defaultClient.get(`/points/${id}`)

// Mock 数据导出（供 vite 插件使用）
export {
  pointsMock,
  pointDetailMock,
  overviewMock,
  alertsMock,
  trendMock,
} from './mock'
