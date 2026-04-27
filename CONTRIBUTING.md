# 贡献指南

## 1. 代码风格

项目使用 **Prettier** + **ESLint** 统一代码风格，提交前自动格式化。

### 1.1 Prettier 配置（`.prettierrc`）

| 规则 | 值 |
|------|-----|
| `semi` | `false`（语句末尾不加分号） |
| `singleQuote` | `true`（使用单引号） |
| `tabWidth` | `2` |
| `trailingComma` | `es5` |
| `printWidth` | `100` |
| `arrowParens` | `always` |
| `endOfLine` | `lf` |

### 1.2 ESLint

各包 ESLint 配置继承 `@cesium-eco/config` 中的共享配置。提交前 `lint-staged` 会自动对变更文件执行：

```bash
prettier --write
eslint --fix
```

### 1.3 手动格式化

```bash
# 格式化全部文件
pnpm format

# 检查格式
pnpm format:check

# 修复 ESLint 问题
pnpm lint:fix
```

## 2. Git 提交规范

### 2.1 Commit Message 格式

遵循 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/v1.0.0/)：

```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Type 说明

| 类型 | 含义 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `docs` | 文档更新 |
| `style` | 代码格式调整（不影响逻辑） |
| `refactor` | 重构（非 feat/fix 的代码改动） |
| `perf` | 性能优化 |
| `test` | 测试相关 |
| `chore` | 构建/工具链/依赖调整 |
| `ci` | CI 配置变动 |

#### 示例

```bash
feat(core): 添加相机飞行动画封装

- 支持 flyTo 与 setView 两种模式
- 增加 easing 参数可选配置

fix(ui): 修复 MapViewer 内存泄漏

销毁时未正确移除 Cesium event listener，
导致组件卸载后仍有引用残留。

docs: 更新 ARCHITECTURE.md 依赖图
```

### 2.2 分支命名规范

```
<type>/<scope>-<简短描述>
```

| 场景 | 分支名示例 |
|------|-----------|
| 新功能 | `feat/water-material` |
| Bug 修复 | `fix/billboard-memory-leak` |
| 文档 | `docs/api-readme` |
| 重构 | `refactor/split-utils` |
| 紧急修复 | `hotfix/cors-error` |

### 2.3 提交前检查清单

- [ ] 代码已通过 `pnpm lint` 与 `pnpm typecheck`
- [ ] 单元测试通过 `pnpm test:unit`
- [ ] 变更涉及多包时，已创建 Changeset（见第 4 节）
- [ ] Commit message 符合 Conventional Commits 规范

## 3. Pull Request 流程

### 3.1 创建 PR 前

1. 从 `main` 创建功能分支：`git checkout -b feat/xxx`
2. 开发并本地验证：`pnpm dev`、`pnpm test:unit`、`pnpm lint`
3. 如修改了多个包，执行 `pnpm changeset` 创建变更集（见第 4 节）
4. 提交并推送分支

### 3.2 PR 描述模板

```markdown
## 变更内容
- 简述改动目的与范围

## 影响包
- [ ] `@cesium-eco/core`
- [ ] `@cesium-eco/ui`
- [ ] `@cesium-eco/api`
- [ ] `dashboard`
- [ ] 其他：___

## 检查项
- [ ] 代码风格检查通过
- [ ] 单元测试通过
- [ ] 已添加 Changeset（如需要）
- [ ] 本地手动验证通过

## 关联 Issue
Fixes #123
```

### 3.3 Review 与合并

1. 至少需要 **1 位维护者** 的 `Approve`
2. CI 检查（lint / test / build）必须全部通过
3. 合并方式：使用 **Squash and Merge**，确保 `main` 分支历史整洁
4. 合并后删除功能分支

## 4. Changeset 使用指南

Changesets 用于记录多包变更、自动化版本升级与 CHANGELOG 生成。

### 4.1 何时需要创建 Changeset？

- 修改了 `packages/` 或 `apps/` 中的源代码
- 该变更会影响下游包的运行时行为或类型定义
- **不需要**：纯文档修改、代码格式化、测试-only 的改动

### 4.2 创建 Changeset

```bash
pnpm changeset
```

交互步骤：

1. 选择受影响的包（空格选中，回车确认）
2. 选择版本升级类型：
   - `patch` — Bug 修复、内部重构（`0.1.0` → `0.1.1`）
   - `minor` — 新功能（`0.1.0` → `0.2.0`）
   - `major` — 破坏性变更（`0.1.0` → `1.0.0`）
3. 输入变更摘要（支持多行，最终写入 CHANGELOG）

完成后会在 `.changeset/` 目录生成一个 `*.md` 文件，例如：

```markdown
---
"@cesium-eco/core": minor
"@cesium-eco/ui": patch
---

添加水面材质参数动态配置能力

- core: WaterPrimitive 支持 uniforms 外部传入
- ui: MapViewer 新增 water-options prop
```

### 4.3 提交 Changeset

将生成的 `.changeset/*.md` 一并提交到 PR 中：

```bash
git add .changeset/feat-water-uniforms.md
git commit -m "feat(core,ui): 添加水面材质参数动态配置能力"
```

### 4.4 版本发布（维护者操作）

```bash
# 1. 根据 changesets 自动升级版本号、生成 CHANGELOG
pnpm version-packages

# 2. 提交版本变更

git add .
git commit -m "chore: version packages"
git push

# 3. 发布到 npm（如有需要）
pnpm release
```

> 当前所有包标记为 `private: true`，`pnpm release` 仅更新版本与 CHANGELOG，不会实际发布到 npm。

## 5. 目录规范提醒

- 单个代码文件原则上**不超过 300 行**，复杂模块应拆分为多个文件（见 `AGENTS.md`）。
- 进入子目录后，若存在 `README.md`，须先阅读并遵循其中规范。
- 修改工程结构或配置后，须同步更新 `AGENTS.md` 与本文档。
