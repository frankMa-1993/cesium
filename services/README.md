# services 目录说明

本目录存放与「生态环境监测大屏」配套的后端服务。当前主要交付物为 **`api/`**：基于 **NestJS 10** 的企业后台 REST API，为管理端（如 `apps/admin`）提供认证、用户与角色、数据字典、登录审计、大屏数据源配置等能力。

## 目录结构

| 路径 | 说明 |
|------|------|
| `api/` | NestJS 应用源码、构建与测试配置 |
| `api/src/main.ts` | HTTP 入口：全局中间件、CORS、可选 Session、Swagger、监听端口 |
| `api/src/app.module.ts` | 根模块：配置、TypeORM、Prometheus、各业务子模块注册 |
| `api/src/config/configuration.ts` | 环境变量映射（端口、JWT、数据库、CORS 等） |
| `api/src/entities/` | TypeORM 实体（用户、角色、权限、字典、登录日志等） |
| `api/src/auth/` | 登录、验证码、JWT、刷新令牌、找回密码、`HybridAuthGuard` |
| `api/src/common/` | 共享守卫、装饰器、`bcryptjs` 封装 |
| `api/src/users/` | 用户列表、批量状态、重置密码、角色分配、CSV 导出 |
| `api/src/roles/` | 角色列表（供分配下拉等） |
| `api/src/dict/` | 字典类型、快照版本、发布与版本 diff |
| `api/src/audit/` | 登录审计日志分页查询 |
| `api/src/screen/` | 大屏数据源 CRUD（类型 + JSON 配置） |
| `api/src/system/` | 按权限过滤的菜单、空库种子数据（默认 admin） |
| `api/src/geoip/` | 登录 IP 离线解析（geoip-lite） |
| `api/data/` | 默认 sql.js 持久化文件目录（如 `admin.sqlite`，由运行环境生成） |

## 技术栈与依赖关系

- **框架**：NestJS、`@nestjs/swagger`、`class-validator` / `class-transformer`
- **数据库**：TypeORM；开发默认 **sql.js** 落盘 `data/admin.sqlite`，也可通过 `DATABASE_URL` 使用 **PostgreSQL**
- **共享包**：`@cesium-eco/shared`（如 `AuthErrorCode`、`MenuItem`、字典 diff 类型等）
- **安全**：Helmet、`bcryptjs` 哈希、SVG 验证码、JWT 或 Cookie Session（`AUTH_MODE`）
- **可观测**：`@willsoto/nestjs-prometheus`，指标路径为根路径 **`/metrics`**（不受 `api/v1` 前缀影响）
- **健康检查**：**`GET /health`**，同样不受 API 前缀影响

## 认证与权限模型

1. **JWT 模式（默认）**  
   - 登录成功后返回 `accessToken` + `refreshToken`。  
   - 受保护接口使用 `Authorization: Bearer <accessToken>`。  
   - `HybridAuthGuard` 校验访问令牌并填充 `req.user`（`sub`、`username`、`permissions`）。

2. **Session 模式**（`AUTH_MODE=session`）  
   - 登录成功后由 `AuthController` 写入 `express-session`（可选 **Redis** 存储，`REDIS_URL`）。  
   - `HybridAuthGuard` 从 Session 读取 `userId` / `permissions` 构造 `req.user`。

3. **RBAC**  
   - 用户 ↔ 角色 ↔ 权限（多对多），登录时把权限码聚合进 JWT 或 Session。  
   - `PermissionsGuard` + `@RequirePermissions('xxx:read')` 做接口级鉴权。

## API 路由约定

- 业务接口全局前缀：**`/api/v1`**（在 `main.ts` 中配置）。  
- OpenAPI 文档：**`/api/docs`**，JSON：**`/openapi.json`**。  
- 主要标签：`auth`、`users`、`roles`、`dict`、`audit`、`screen`、`system`、`health`。

## 配置与环境变量（摘要）

完整映射见 `api/src/config/configuration.ts`。常用项包括：

- `PORT`：监听端口，默认 `4000`  
- `JWT_SECRET` / `JWT_REFRESH_SECRET`：令牌签名密钥（生产必须替换）  
- `AUTH_MODE`：`jwt` 或 `session`  
- `CORS_ORIGIN`：未设置时默认允许 `http://localhost:*`  
- `DATABASE_URL`：以 `postgres` 开头则使用 PostgreSQL  
- `REDIS_URL`：Session 模式下可选  
- `BCRYPT_ROUNDS`：密码哈希轮数  

## 本地开发与测试

在 monorepo 根目录推荐使用 **pnpm**（见仓库 `AGENTS.md`）：

```bash
pnpm --filter @cesium-eco/api-server dev
pnpm --filter @cesium-eco/api-server test
pnpm --filter @cesium-eco/api-server typecheck
```

空库首次启动时，`SeedService` 会写入默认管理员（详见该服务注释与日志提示）；**生产环境务必修改默认密码**。

## 代码注释说明

`api/src` 下各 TypeScript 文件已补充 **文件头说明** 与关键 **类/方法注释**，便于快速理解模块边界、数据流与安全策略；实体字段含简要语义说明。若修改行为，请同步更新注释以避免误导后续维护者。
