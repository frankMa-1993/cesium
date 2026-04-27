import axios, { AxiosInstance } from 'axios'

export function createAPIClient(baseURL?: string): AxiosInstance {
  const api = axios.create({
    baseURL: baseURL || '/api',
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  api.interceptors.response.use(
    (res) => res.data,
    (err) => Promise.reject(err)
  )

  return api
}

export const defaultClient = createAPIClient()
