# @cesium-eco/config

共享配置包，提供 TypeScript 与 Vite 基础配置，供 monorepo 内各包继承使用。

## 安装

```bash
pnpm add @cesium-eco/config --workspace
```

## 使用

**TypeScript 配置继承**

```json
{
  "extends": "@cesium-eco/config/tsconfig.base.json",
  "compilerOptions": {
    "baseUrl": "."
  }
}
```

**Vite 基础配置导入**

```ts
import { resolveWorkspace, libBuildOptions } from '@cesium-eco/config/vite.base'
import { defineConfig } from 'vite'

export default defineConfig({
  ...libBuildOptions('./src/index.ts', 'MyLib'),
  resolve: { alias: resolveWorkspace(__dirname) },
})
```

## 导出

| 导出路径 | 说明 |
|---------|------|
| `tsconfig.base.json` | TS 基础配置：ESNext、strict、sourceMap 等 |
| `vite.base.ts` | `resolveWorkspace(pkgRoot)` — 解析 workspace 别名；`libBuildOptions(entry, name)` — 库模式构建配置 |

## 依赖

无运行时依赖，仅含配置文件。
