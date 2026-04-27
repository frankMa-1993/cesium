# 版本管理策略

本文档描述 `cesium-eco` Monorepo 的版本管理规范，基于 **Semantic Versioning** 与 **Changesets** 实现独立版本控制。

---

## 目录

1. [语义化版本规则](#语义化版本规则)
2. [Changesets 工作流](#changesets-工作流)
3. [独立版本 vs 固定版本](#独立版本-vs-固定版本)
4. [发布检查清单](#发布检查清单)

---

## 语义化版本规则

本项目严格遵循 [SemVer 2.0.0](https://semver.org/lang/zh-CN/) 规范，版本号格式为 `MAJOR.MINOR.PATCH`：

| 版本位 | 递增时机 | 示例场景 |
|---|---|---|
| **MAJOR** | 存在不兼容的 API 修改 | 移除公开导出的函数、修改组件 Props 签名、Cesium 大版本升级导致 Breaking Change |
| **MINOR** | 向下兼容的功能新增 | 新增监测点类型、新增图表组件、新增 API 接口封装 |
| **PATCH** | 向下兼容的问题修复 | 修复 Billboard 渲染异常、修复轮询内存泄漏、修正类型定义错误 |

### 版本前缀约定

- `0.x.x`：开发阶段，API 可能随时发生 Breaking Change，Minor 版本也可能包含不兼容修改
- `1.x.x` 及以上：稳定阶段，严格遵循 SemVer

### Commit 与版本对应关系

| Commit 类型 | 对应版本位 | Changeset 级别 |
|---|---|---|
| `feat:` | `MINOR` | `minor` |
| `fix:` | `PATCH` | `patch` |
| `refactor:`（不兼容） | `MAJOR` | `major` |
| `perf:` | `PATCH` | `patch` |
| `docs:` / `style:` / `chore:` | 不触发版本变更 | 通常无需 Changeset |

---

## Changesets 工作流

[Changesets](https://github.com/changesets/changesets) 是管理 Monorepo 版本与 Changelog 的工具。本仓库已初始化配置，工作目录为 `.changeset/`。

### 添加 Changeset

每次提交包含用户可见变更（新功能、修复、Breaking Change）的代码时，**必须**同时添加对应的 Changeset：

```bash
# 交互式创建 Changeset
pnpm changeset

# 或简写
pnpm changeset add
```

执行后会提示：
1. 选择受影响的包（空格选择，回车确认）
2. 选择版本级别：`patch` / `minor` / `major`
3. 编写变更摘要（支持 Markdown）

生成的文件示例：`.changeset/hungry-foxes-jump.md`

```markdown
---
'@cesium-eco/core': minor
'@cesium-eco/ui': patch
---

新增水面波纹动画参数支持；修复 MapViewer 在暗色模式下的样式异常。
```

> **注意**：Changeset 文件应随代码改动一同提交到 Pull Request 中，由 CI 检查确保不遗漏。

### 版本聚合（Version）

当准备发布时，运行版本聚合命令：

```bash
pnpm version-packages
# 等价于：changeset version
```

该命令会：
1. 读取所有未消费的 Changeset 文件
2. 根据依赖关系拓扑排序，计算每个包的最终版本号
3. 更新各 `package.json` 中的 `version` 字段
4. 更新 `CHANGELOG.md`（按包分别生成）
5. 删除已消费的 Changeset 文件
6. 自动提交并打 Tag（在 CI 环境中由 `changesets/action` 完成）

### 发布（Publish）

```bash
pnpm release
# 等价于：changeset publish
```

该命令会：
1. 检查哪些包的当前版本尚未在 npm/Git Tag 中存在
2. 为这些包创建 Git Tag（格式：`@cesium-eco/core@0.2.0`）
3. 若包未标记 `private: true`，则发布到 npm registry
4. 创建 GitHub Release（在 CI 环境中由 `changesets/action` 完成）

### 自动化发布流程（CI）

实际项目中，发布由 GitHub Actions 自动处理：

1. 开发者提交代码 + Changeset → 发起 PR → 合并到 `main`
2. `release.yml` 检测到 `main` 分支有新的 Changeset
3. Changesets Action 自动创建 **Version Packages** PR
4. 维护者审核并合并该 PR
5. Changesets Action 自动执行 `version` + `publish`，创建 Tag 和 Release

详见 [CI_CD.md](./CI_CD.md)。

---

## 独立版本 vs 固定版本

### 本项目采用：独立版本（Independent Versioning）

Monorepo 中每个包拥有独立的版本号，互不影响：

```
@cesium-eco/core    0.3.1
@cesium-eco/ui      0.2.0
@cesium-eco/api     0.1.4
dashboard           0.5.0
```

#### 独立版本的适用场景

- 各包发布周期不同（`core` 频繁迭代，`shared` 相对稳定）
- 不同包面向不同使用方（内部包 vs 外部组件库）
- 需要精确控制每个包的变更范围与升级成本

#### 独立版本的注意事项

- 必须显式为每个变更的包添加 Changeset，不能遗漏
- 依赖方升级时需要手动更新 `package.json` 中的版本约束
- Changelog 按包独立维护，阅读成本略高

### 固定版本（Fixed Versioning）对比

所有包共用同一版本号，如 `v1.2.3`：

| 特性 | 独立版本 | 固定版本 |
|---|---|---|
| 版本号 | 各包独立 | 全局统一 |
| 适用场景 | 多包差异大、发布节奏不同 | 单应用拆包、同版本发布 |
| Changeset 复杂度 | 需为每个包单独指定 | 只需指定一次 |
| 用户理解成本 | 较高 | 较低 |

若未来项目形态变为"单一应用拆分为内部模块"，可考虑在 `.changeset/config.json` 中切换为 `"fixed": [["@cesium-eco/*", "dashboard"]]`。

---

## 发布检查清单

在合并 Release PR 前，维护者应按以下清单逐项确认：

### 代码质量

- [ ] 所有 Changeset 描述准确、无拼写错误
- [ ] `pnpm lint` 无警告或错误
- [ ] `pnpm typecheck` 全量通过
- [ ] `pnpm test:unit` 全部通过，覆盖率未下降
- [ ] `pnpm build` 成功，无产物异常

### 版本与依赖

- [ ] 各包版本号符合 SemVer 规范
- [ ] 跨包依赖版本已正确更新（`workspace:*` 已解析为实际版本）
- [ ] 无循环依赖或依赖版本冲突
- [ ] `CHANGELOG.md` 已按包正确生成

### 构建产物

- [ ] `apps/dashboard/dist` 可正常预览
- [ ] Cesium 静态资源（WebWorker、WASM、Assets）已正确拷贝
- [ ] 环境变量注入正确（开发/生产区分）

### 部署与回滚

- [ ] 预发布环境已部署并验证通过
- [ ] 生产环境部署脚本就绪
- [ ] 回滚方案明确（可基于 Git Tag 快速回退）
- [ ] 监控与告警已配置

### 文档与沟通

- [ ] README / AGENTS.md 中的版本信息已更新（如有必要）
- [ ] 关键变更已同步给相关团队成员
- [ ] GitHub Release Notes 已准备（Breaking Change 需高亮说明）

---

## 相关文档

- [CI_CD.md](./CI_CD.md) — 自动化发布流水线配置
- [SemVer 官方中文文档](https://semver.org/lang/zh-CN/)
- [Changesets 文档](https://github.com/changesets/changesets/blob/main/docs/intro-to-using-changesets.md)
