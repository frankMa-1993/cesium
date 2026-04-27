import * as Cesium from 'cesium'

export interface PointGeoJSON {
  features: Array<{
    id?: string
    geometry: {
      type: string
      coordinates: [number, number]
    }
    properties: Record<string, any>
  }>
}

export interface PointLayerResult {
  dataSource: Cesium.CustomDataSource
  handler: Cesium.ScreenSpaceEventHandler
}

/**
 * 加载 GeoJSON 点位并渲染为 Billboard
 */
export function loadBillboardPoints(
  viewer: Cesium.Viewer,
  geojson: PointGeoJSON,
  onClick?: (entity: Cesium.Entity, cartesian: Cesium.Cartesian3) => void
): PointLayerResult {
  const dataSource = new Cesium.CustomDataSource('points')

  geojson.features.forEach((feature) => {
    const [lon, lat] = feature.geometry.coordinates
    const props = feature.properties

    const entity = dataSource.entities.add({
      id: feature.id || props.id,
      position: Cesium.Cartesian3.fromDegrees(lon, lat),
      billboard: {
        image: createPointCanvas(props.status),
        scale: 1.0,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      },
      properties: props,
    })

    ;(entity as any).pointProps = props
  })

  viewer.dataSources.add(dataSource)

  const handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas)
  handler.setInputAction((click: { position: Cesium.Cartesian2 }) => {
    const picked = viewer.scene.pick(click.position)
    if (Cesium.defined(picked) && picked.id && picked.id.properties) {
      const cartesian = picked.id.position.getValue(viewer.clock.currentTime)
      onClick && onClick(picked.id, cartesian)
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

  return { dataSource, handler }
}

function createPointCanvas(status: string): HTMLCanvasElement {
  const size = 32
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  let color = '#00f0ff'
  if (status === 'warning') color = '#ff9c00'
  if (status === 'danger') color = '#ff4d4f'

  const gradient = ctx.createRadialGradient(size / 2, size / 2, 2, size / 2, size / 2, size / 2)
  gradient.addColorStop(0, color)
  gradient.addColorStop(0.5, color + '80')
  gradient.addColorStop(1, 'transparent')

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)

  ctx.beginPath()
  ctx.arc(size / 2, size / 2, 5, 0, Math.PI * 2)
  ctx.fillStyle = '#fff'
  ctx.fill()

  ctx.beginPath()
  ctx.arc(size / 2, size / 2, 5, 0, Math.PI * 2)
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.stroke()

  return canvas
}
