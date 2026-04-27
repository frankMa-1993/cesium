import { resolve } from 'path'

/**
 * 解析 workspace 内包路径的辅助函数
 */
export function resolveWorkspace(pkgRoot: string) {
  return {
    '@': resolve(pkgRoot, 'src'),
  }
}

/**
 * 通用库模式构建配置
 */
export function libBuildOptions(entry: string, name: string) {
  return {
    lib: {
      entry: resolve(entry),
      name,
      formats: ['es'] as const,
      fileName: 'index',
    },
    rollupOptions: {
      external: [/node_modules/],
    },
  }
}
