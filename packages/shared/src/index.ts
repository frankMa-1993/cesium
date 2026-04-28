/**
 * @cesium-eco/shared
 * 共享类型与工具
 */

// 类型导出
export type {
  LayerType,
  LayerItem,
  LayerState,
} from './types/layer'

export {
  AuthErrorCode,
} from './types/admin'

export type {
  UserStatus,
  AuthUser,
  MenuItem,
  LoginResult,
  LoginAuditFields,
  DictChangeType,
  DictItemDiffRow,
  ScreenDatasourceType,
  ScreenDatasourceConfig,
} from './types/admin'

// SCSS 变量通过路径直接引用：@use '@cesium-eco/shared/styles/vars.scss' as *;
