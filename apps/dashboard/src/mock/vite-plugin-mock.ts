import type { Plugin } from 'vite'
import {
  pointsMock,
  pointDetailMock,
  overviewMock,
  alertsMock,
  trendMock,
} from '@cesium-eco/api'

export default function mockPlugin(): Plugin {
  return {
    name: 'vite-plugin-mock',
    configureServer(server) {
      server.middlewares.use('/api/overview', (_req, res) => {
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(overviewMock))
      })
      server.middlewares.use('/api/alerts', (_req, res) => {
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(alertsMock))
      })
      server.middlewares.use('/api/trend', (_req, res) => {
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(trendMock))
      })
      server.middlewares.use('/api/points', (_req, res) => {
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(pointsMock))
      })
      server.middlewares.use('/api/points/', (req, res) => {
        const url = (req as any).url || ''
        const id = url.replace('/api/points/', '').split('?')[0]
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(pointDetailMock[id] || { code: 404, data: null }))
      })
    },
  }
}
