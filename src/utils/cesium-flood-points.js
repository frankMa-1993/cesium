import * as Cesium from 'cesium'

// 按风险等级缓存 canvas 图标，避免重复创建 800 个独立 canvas
const canvasCache = {}

/**
 * 创建积水内涝点图标（水滴形状）
 * @param {'高'|'中'|'低'} riskLevel
 * @returns {HTMLCanvasElement}
 */
function createFloodCanvas(riskLevel) {
  if (canvasCache[riskLevel]) return canvasCache[riskLevel]

  const size = 36
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')

  const colorMap = {
    '高': '#ff4d4f',
    '中': '#ff9c00',
    '低': '#1890ff',
  }
  const color = colorMap[riskLevel] || '#1890ff'

  // 外发光光晕
  const glow = ctx.createRadialGradient(size / 2, size / 2, 2, size / 2, size / 2, size / 2)
  glow.addColorStop(0, color + 'aa')
  glow.addColorStop(0.6, color + '33')
  glow.addColorStop(1, 'transparent')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, size, size)

  // 水滴主体路径
  const cx = size / 2
  const cy = size / 2 + 2
  const r = 7
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()

  // 水滴顶部尖角
  ctx.beginPath()
  ctx.moveTo(cx - 5, cy - r + 2)
  ctx.quadraticCurveTo(cx, cy - r - 8, cx + 5, cy - r + 2)
  ctx.fillStyle = color
  ctx.fill()

  // 高亮反光
  ctx.beginPath()
  ctx.arc(cx - 2, cy - 2, 2.5, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255,255,255,0.55)'
  ctx.fill()

  canvasCache[riskLevel] = canvas
  return canvas
}

/**
 * 批量加载积水内涝点位（高性能，仅创建3种图标复用）
 * @param {Cesium.Viewer} viewer
 * @param {object} geojson - FeatureCollection
 * @param {Function} onClick - 点击回调 (properties, screenPosition)
 * @returns {{ dataSource: Cesium.CustomDataSource, handler: Cesium.ScreenSpaceEventHandler }}
 */
export function loadFloodPoints(viewer, geojson, onClick) {
  const dataSource = new Cesium.CustomDataSource('floodPoints') // 

  // 预先创建三种图标
  const icons = {
    '高': createFloodCanvas('高'),
    '中': createFloodCanvas('中'),
    '低': createFloodCanvas('低'),
  }

  geojson.features.forEach((feature) => {
    const [lon, lat] = feature.geometry.coordinates
    const props = feature.properties

    dataSource.entities.add({
      id: feature.id || props.id,
      position: Cesium.Cartesian3.fromDegrees(lon, lat),
      billboard: {
        image: icons[props.riskLevel] || icons['低'],
        scale: 1.0,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      properties: props,
    })
  })

  viewer.dataSources.add(dataSource)

  // 点击事件
  const handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas)
  handler.setInputAction((click) => {
    const picked = viewer.scene.pick(click.position)
    if (
      Cesium.defined(picked) &&
      picked.id &&
      picked.id.properties &&
      picked.id.properties.id &&
      String(picked.id.properties.id.getValue()).startsWith('FP')
    ) {
      const screenPos = click.position
      onClick && onClick(picked.id.properties, screenPos) // 点击事件
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

  return { dataSource, handler }
}

/**
 * 清除积水内涝点图层并销毁事件监听
 * @param {Cesium.Viewer} viewer
 * @param {{ dataSource, handler }} layer
 */
export function clearFloodPoints(viewer, layer) {
  if (!layer) return
  if (layer.handler && !layer.handler.isDestroyed()) {
    layer.handler.destroy()
  }
  if (layer.dataSource) {
    viewer.dataSources.remove(layer.dataSource, true)
  }
}
