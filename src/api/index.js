import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.response.use(
  (res) => res.data,
  (err) => Promise.reject(err)
)

// 大屏数据接口
export const fetchOverview = () => api.get('/overview')
export const fetchAlerts = () => api.get('/alerts')
export const fetchTrend = () => api.get('/trend')
export const fetchFloodPoints = () => api.get('/flood-points')
export const fetchFloodPointDetail = (id) => api.get(`/flood-points/${id}`)

export default api
