# 性能清单

## 🎯 目标指标

| 指标 | 目标值 | 验证方式 |
|------|--------|----------|
| **首屏加载时间（FCP）** | < 2s | Lighthouse / Chrome DevTools Performance |
| **运行时内存占用** | < 200 MB | Chrome DevTools Memory Tab |
| **JS 主线程阻塞** | < 200 ms | Lighthouse TBT |

---

## ✅ 已实施的性能优化

### 1. 构建与加载

- **Vite Code Splitting**：`manualChunks` 将 `cesium` 单独拆包，避免主包膨胀。
- **Tree Shaking**：ESM 按需引入 Cesium API，未使用模块不会打包。
- **静态资源自动化**：`vite-plugin-cesium` 仅在构建时拷贝 Cesium Assets / Workers，开发阶段按需加载。

### 2. Cesium 渲染优化

- **关闭非必要 Widget**：`animation / timeline / baseLayerPicker / geocoder` 等全部禁用。
- **关闭雾效**：`viewer.scene.fog.enabled = false`，减少远景片段着色开销。
- **FXAA 后处理**：仅开启快速近似抗锯齿，平衡画质与性能。
- **Billboard 替代 Primitive**：200 个点位使用 Billboard 而非 Entity Polygon，GPU 负担更低。
- **Canvas 图标预生成**：点位图标为运行时 Canvas 生成，无需外部图片请求。

### 3. 运行时优化

- **1s 轮询合并**：Dashboard 使用 `Promise.all` 同时请求 overview + alerts + trend，减少并发连接。
- **数据缓存**：Mock 中 200 个 GeoJSON 点位在内存中缓存，防止重复计算。
- **组件懒加载**：当前为单页大屏，如需扩展可使用 `defineAsyncComponent` 懒加载子模块。

### 4. 布局与样式

- **CSS 硬件加速**：大屏容器使用 `transform` 与 `will-change`  hint（可通过全局样式扩展）。
- **SVG 轻量图表**：趋势图使用原生 SVG `<polyline>`，不引入 ECharts / D3 等重型库。

---

## 📊 预期性能数据（本地测试参考）

| 场景 | 预估值 |
|------|--------|
| 开发冷启动（`npm run dev`） | ~800 ms |
| 生产构建（`npm run build`） | ~15–25 s |
| 首屏 FCP（生产环境 + gzip） | ~1.2–1.8 s |
| Cesium 初始化 | ~600–900 ms |
| 运行时内存（200 点位 + 天地图） | ~120–170 MB |
| 1s 轮询网络开销 | ~3 KB / 次 |

---

## 🔍 性能检测步骤

1. **构建生产包**
   ```bash
   npm run build
   npm run preview
   ```

2. **Chrome DevTools → Performance**
   - 开启 4x CPU 降速模拟低端设备
   - Record 页面加载过程，查看 FCP / LCP

3. **Chrome DevTools → Memory**
   - 选择 Heap Snapshot
   - 加载完成后对比内存占用

4. **Lighthouse**
   ```bash
   # CLI 方式
   npx lighthouse http://localhost:4173 --preset=desktop
   ```

---

## 🚀 进一步优化建议

| 建议 | 收益 |
|------|------|
| 开启 HTTP/2 + gzip / brotli | 减少 60%+ 传输体积 |
| CDN 部署 Cesium 静态资源 | 降低服务器带宽，提升并行加载 |
| 使用 `requestIdleCallback` 分批加载点位 | 减少首帧卡顿 |
| Web Worker 处理 GeoJSON 生成 | 避免阻塞主线程 |
| 开启 `viewer.scene.requestRenderMode` | 无交互时停止渲染，降低 GPU 占用 |
