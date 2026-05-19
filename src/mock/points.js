const RISK_LEVELS = ['高', '中', '低']
const RISK_WEIGHT = [0.2, 0.5, 0.3]

const DISTRICTS = ['福田区', '罗湖区', '南山区', '宝安区', '龙岗区', '龙华区', '光明区', '坪山区', '盐田区', '大鹏新区']

const ROAD_TYPES = ['立交桥下', '地下通道', '低洼路段', '居民区', '工业园区', '商业街区', '公园绿地', '学校周边']

const STATUS_LIST = ['active', 'warning', 'normal']
const STATUS_WEIGHT = [0.3, 0.4, 0.3]

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

function generateFloodPoints(count = 800) {
  const features = []
  // 深圳市经纬度范围：113.75–114.62E，22.40–22.85N
  for (let i = 0; i < count; i++) {
    const lon = randomFloat(113.755, 114.615)
    const lat = randomFloat(22.405, 22.845)
    const riskLevel = weightedRandom(RISK_LEVELS, RISK_WEIGHT)
    const status = weightedRandom(STATUS_LIST, STATUS_WEIGHT)
    const id = `FP${String(i + 1).padStart(4, '0')}`
    const district = DISTRICTS[randomInt(0, DISTRICTS.length - 1)]
    const roadType = ROAD_TYPES[randomInt(0, ROAD_TYPES.length - 1)]

    features.push({
      type: 'Feature',
      id,
      geometry: {
        type: 'Point',
        coordinates: [lon, lat],
      },
      properties: {
        id,
        name: `积水内涝点-${id}`,
        address: `深圳市${district}${roadType}附近`,
        district,
        roadType,
        depth: randomInt(5, 180),
        area: randomInt(10, 5000),
        riskLevel,
        status,
        reportTime: randomDate(30),
        updateTime: randomDate(1),
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

let cachedFloodGeoJSON = null

export default [
  {
    url: '/api/flood-points',
    method: 'GET',
    response() {
      if (!cachedFloodGeoJSON) {
        cachedFloodGeoJSON = generateFloodPoints(800)
      }
      return {
        code: 200,
        message: 'success',
        data: cachedFloodGeoJSON,
      }
    },
  },
  {
    url: '/api/flood-points/:id',
    method: 'GET',
    response(req) {
      if (!cachedFloodGeoJSON) {
        cachedFloodGeoJSON = generateFloodPoints(800)
      }
      const id = req.params.id
      const feature = cachedFloodGeoJSON.features.find((f) => f.id === id)
      if (!feature) {
        return { code: 404, message: 'not found', data: null }
      }
      return {
        code: 200,
        message: 'success',
        data: {
          ...feature.properties,
          depth: feature.properties.depth + randomInt(-5, 5),
          updateTime: new Date().toLocaleString('zh-CN'),
        },
      }
    },
  },
]
