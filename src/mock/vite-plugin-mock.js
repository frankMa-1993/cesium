import mockRoutes from './index.js'

function matchRoute(url, method, routes) {
  const path = url.split('?')[0]

  for (const route of routes) {
    // method 匹配
    const routeMethod = (route.method || 'GET').toUpperCase()
    if (routeMethod !== method && routeMethod !== '*') continue

    // url 匹配（支持 :param）
    const routeUrl = route.url
    const regexStr = routeUrl.replace(/:([^/]+)/g, '([^/]+)')
    const regex = new RegExp(`^${regexStr}$`)
    const match = path.match(regex)

    if (match) {
      const params = {}
      const paramNames = []
      const paramRegex = /:([^/]+)/g
      let m
      while ((m = paramRegex.exec(routeUrl)) !== null) {
        paramNames.push(m[1])
      }
      paramNames.forEach((name, i) => {
        params[name] = match[i + 1]
      })

      return { route, params }
    }
  }
  return null
}

export default function vitePluginMock() {
  return {
    name: 'vite-plugin-custom-mock',
    enforce: 'pre',
    configureServer(server) {
      // 收集所有 mock 处理器
      const allRoutes = []
      if (Array.isArray(mockRoutes)) {
        allRoutes.push(...mockRoutes)
      }

      server.middlewares.use((req, res, next) => {
        if (!req.url || !req.url.startsWith('/api')) {
          return next()
        }

        const method = req.method?.toUpperCase() || 'GET'
        const matched = matchRoute(req.url, method, allRoutes)

        if (!matched) {
          return next()
        }

        const { route, params } = matched

        // 延迟
        const delay = route.delay || 0
        const doResponse = () => {
          try {
            let body
            if (typeof route.response === 'function') {
              // 模拟 req 对象
              const mockReq = {
                url: req.url,
                method,
                params,
                query: Object.fromEntries(
                  new URL(req.url, `http://${req.headers.host}`).searchParams
                ),
                headers: req.headers,
                body: req.body,
              }
              body = route.response(mockReq)
            } else if (typeof route.body === 'function') {
              body = route.body(req)
            } else {
              body = route.body
            }

            if (body === undefined && typeof route.response === 'function') {
              // response 中间件模式，假设已经处理了 res
              return
            }

            res.setHeader('Content-Type', 'application/json')
            res.statusCode = route.status || 200
            res.end(JSON.stringify(body))
          } catch (e) {
            console.error('[mock]', e)
            res.statusCode = 500
            res.end(JSON.stringify({ code: 500, message: e.message }))
          }
        }

        if (delay) {
          setTimeout(doResponse, Array.isArray(delay) ? delay[0] : delay)
        } else {
          doResponse()
        }
      })
    },
  }
}
