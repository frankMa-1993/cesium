export type LayerType = 'geojson' | '3dtiles' | 'imagery'

export interface LayerItem {
  id: string
  type: LayerType
  name: string
  visible: boolean
  alpha: number
  order: number
  url?: string
  options?: Record<string, any>
  /** 运行时引用，不持久化 */
  instance?: any
}

export interface LayerState {
  layers: LayerItem[]
  pickEnabled: boolean
  selectedFeature: Record<string, any> | null
}
