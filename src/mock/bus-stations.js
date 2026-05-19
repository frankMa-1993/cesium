const DISTRICTS = ['福田区', '罗湖区', '南山区', '宝安区', '龙岗区', '龙华区', '光明区', '坪山区', '盐田区', '大鹏新区']

const ROAD_NAMES = ['深南大道', '北环大道', '滨海大道', '宝安大道', '龙岗大道', '红荔路', '笋岗路', '布心路', '科技路', '民治大道']

const ROUTE_PREFIX = ['M', 'B', 'E', '高峰']

const STATUS_LIST = ['normal', 'busy', 'maintenance']
const STATUS_WEIGHT = [0.6, 0.3, 0.1]

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomFloat(min, max, fixed = 5) {
  return +(Math.random() * (max - min) + min).toFixed(fixed)
}

function weightedRandom(list, weights) {
  const r = Math.random()
  let sum = 0
  for (let i = 0; i < weights.length; i++) {
    sum += weights[i]
    if (r <= sum) return list[i]
  }
  return list[0]
}

function randomDate(daysAgo = 7) {
  const now = Date.now()
  const offset = randomInt(0, daysAgo * 86400000)
  return new Date(now - offset).toLocaleString('zh-CN')
}

function randomRoutes() {
  const count = randomInt(1, 4)
  const routes = []
  for (let i = 0; i < count; i++) {
    const prefix = ROUTE_PREFIX[randomInt(0, ROUTE_PREFIX.length - 1)]
    routes.push(`${prefix}${randomInt(10, 999)}`)
  }
  return [...new Set(routes)]
}

function generateBusStations(count = 10000) {
  const features = []
  for (let i = 0; i < count; i++) {
    const lon = randomFloat(113.755, 114.615)
    const lat = randomFloat(22.405, 22.845)
    const id = `BS${String(i + 1).padStart(5, '0')}`
    const district = DISTRICTS[randomInt(0, DISTRICTS.length - 1)]
    const road = ROAD_NAMES[randomInt(0, ROAD_NAMES.length - 1)]
    const status = weightedRandom(STATUS_LIST, STATUS_WEIGHT)

    features.push({
      type: 'Feature',
      id,
      geometry: {
        type: 'Point',
        coordinates: [lon, lat],
      },
      properties: {
        id,
        name: `${road}公交站-${id.slice(-4)}`,
        address: `深圳市${district}${road}（${randomInt(1, 500)}号）附近`,
        district,
        road,
        routes: randomRoutes(),
        status,
        dailyPassengers: randomInt(200, 12000),
        shelter: Math.random() > 0.25,
        electronicBoard: Math.random() > 0.4,
        reportTime: randomDate(60),
        updateTime: randomDate(3),
        lon,
        lat,
      },
    })
  }

  return {
    type: 'FeatureCollection',
    features,
  }
}

let cachedBusGeoJSON = null

export default [
  {
    url: '/api/bus-stations',
    method: 'GET',
    response() {
      if (!cachedBusGeoJSON) {
        cachedBusGeoJSON = generateBusStations(10000)
      }
      return {
        code: 200,
        message: 'success',
        data: cachedBusGeoJSON,
      }
    },
  },
  {
    url: '/api/bus-stations/:id',
    method: 'GET',
    response(req) {
      if (!cachedBusGeoJSON) {
        cachedBusGeoJSON = generateBusStations(10000)
      }
      const id = req.params.id
      const feature = cachedBusGeoJSON.features.find((f) => f.id === id)
      if (!feature) {
        return { code: 404, message: 'not found', data: null }
      }
      return {
        code: 200,
        message: 'success',
        data: {
          ...feature.properties,
          dailyPassengers: feature.properties.dailyPassengers + randomInt(-50, 50),
          updateTime: new Date().toLocaleString('zh-CN'),
        },
      }
    },
  },
]
