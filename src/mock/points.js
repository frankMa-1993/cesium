const STATUS_LIST = ['online', 'warning', 'danger']
const STATUS_WEIGHT = [0.7, 0.2, 0.1] // 权重

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomFloat(min, max, fixed = 5) {
  return +(Math.random() * (max - min) + min).toFixed(fixed)
}

function weightedStatus() {
  const r = Math.random()
  let sum = 0
  for (let i = 0; i < STATUS_WEIGHT.length; i++) {
    sum += STATUS_WEIGHT[i]
    if (r <= sum) return STATUS_LIST[i]
  }
  return STATUS_LIST[0]
}

function generateGeoJSON(count = 200) {
  const features = []
  // 在中国范围内生成随机点
  for (let i = 0; i < count; i++) {
    const lon = randomFloat(73, 135)
    const lat = randomFloat(18, 53)
    const status = weightedStatus()
    const id = `P${String(i + 1).padStart(4, '0')}`

    features.push({
      type: 'Feature',
      id,
      geometry: {
        type: 'Point',
        coordinates: [lon, lat],
      },
      properties: {
        id,
        name: `监测点-${id}`,
        status,
        type: ['气象', '水质', '空气', '土壤', '噪声'][randomInt(0, 4)],
        value: randomFloat(0, 100, 1),
        unit: ['°C', 'mg/L', 'μg/m³', '%', 'dB'][randomInt(0, 4)],
        updateTime: new Date(Date.now() - randomInt(0, 300000)).toLocaleString('zh-CN'),
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

// 内存缓存，保证单次会话点位稳定
let cachedGeoJSON = null

export default [
  {
    url: '/api/points',
    method: 'GET',
    response() {
      if (!cachedGeoJSON) {
        cachedGeoJSON = generateGeoJSON(200)
      }
      return {
        code: 200,
        message: 'success',
        data: cachedGeoJSON,
      }
    },
  },
  {
    url: '/api/points/:id',
    method: 'GET',
    response(req) {
      if (!cachedGeoJSON) {
        cachedGeoJSON = generateGeoJSON(200)
      }
      const id = req.params.id
      const feature = cachedGeoJSON.features.find((f) => f.id === id)
      return {
        code: 200,
        message: 'success',
        data: feature
          ? {
              ...feature.properties,
              // 模拟实时波动
              value: +(
                feature.properties.value +
                (Math.random() - 0.5) * 5
              ).toFixed(1),
              updateTime: new Date().toLocaleString('zh-CN'),
            }
          : null,
      }
    },
  },
]
