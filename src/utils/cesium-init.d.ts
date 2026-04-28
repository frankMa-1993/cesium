import type { Viewer } from 'cesium'

export function createViewer(
  container: string | HTMLElement,
  options?: ConstructorParameters<typeof Viewer>[1]
): Viewer

export function addTiandituLayers(viewer: Viewer): Promise<void>

export function loadBillboardPoints(
  viewer: Viewer,
  geojson: { features: Array<{ id?: string; geometry: { coordinates: number[] }; properties: Record<string, unknown> }> },
  onClick?: (entity: import('cesium').Entity, cartesian: import('cesium').Cartesian3) => void
): { dataSource: import('cesium').CustomDataSource; handler: import('cesium').ScreenSpaceEventHandler }

export function flyTo(
  viewer: Viewer,
  lon: number,
  lat: number,
  height?: number,
  duration?: number
): void

export function flyToChina(viewer: Viewer): void

export const cesiumPlugin: {
  install(app: import('vue').App): void
}
