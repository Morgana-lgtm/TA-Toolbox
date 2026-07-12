# Momo's TA Toolbox

> 技术美术日常工具集 — 高效、离线、可扩展

基于 **Electron + React + TypeScript** 的 Windows 桌面工具，为技术美术（Technical Artist）提供贴图处理的一站式工作台。

---

## 功能

| 工具 | 说明 |
|------|------|
| **ORM 打包** | 将 AO / Metallic / Roughness 三张贴图合并为一张 ORM 贴图，支持 sRGB→Linear 色彩空间转换 |
| **Ramp 生成器** | 多色阶 Toon Shader Ramp 贴图生成，smoothstep 柔和过渡，实时预览 |
| **贴图预览** | 查看贴图 RGBA 各通道，像素值悬停检查，自适应缩放 |

![screenshot](screenshots/app.png)

---

## 安装

### 便携版（推荐）

下载 [最新 Release](https://github.com/Morgana-lgtm/ta-toolbox/releases) 中的 `Momo TA Toolbox v0.1.0 portable.zip`，解压后双击 `Momo's TA Toolbox.exe` 即可运行。

### 开发者

```bash
# 环境要求
Node.js ≥ 18 | npm ≥ 9 | Windows 10/11

# 克隆项目
git clone https://github.com/Morgana-lgtm/ta-toolbox.git
cd ta-toolbox

# 安装依赖
npm install

# 启动开发模式
npm run dev

# 构建
npm run build

# 打包 exe
npm run package
```

> **注意**：运行前确保环境变量 `ELECTRON_RUN_AS_NODE` 未被设为 `1`。

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 桌面容器 | Electron 31 |
| 前端框架 | React 18 + TypeScript |
| 构建工具 | electron-vite (Vite 5) |
| 图像处理 | sharp 0.35（主进程） |
| 打包分发 | electron-builder |
| 路由 | react-router-dom v6 (HashRouter) |

### 架构

```
Renderer (React)          Main Process (Electron)
┌─────────────────┐       ┌──────────────────┐
│  Tool Pages      │       │  IPC Handlers    │
│  Components      │◄─IPC─►│  sharp (纹理处理) │
│  Plugin Registry │       │  File Dialog     │
└─────────────────┘       └──────────────────┘
```

---

## 项目结构

```
ta-toolbox/
├── electron/                  # Electron 主进程
│   ├── main/index.ts          # 窗口创建、生命周期
│   ├── preload/index.ts       # IPC 桥接
│   └── ipc/                   # IPC 处理器
│       ├── file.ipc.ts        # 文件对话框
│       └── texture.ipc.ts     # 图像处理（sharp）
├── src/                       # React 渲染进程
│   ├── components/            # 通用组件
│   │   ├── Layout/            # 布局（侧边栏 + 内容区）
│   │   └── common/            # DropZone, ImageCanvas, SliderControl, Toast
│   ├── pages/                 # 工具页面
│   │   ├── Home/              # 首页
│   │   ├── ChannelPacker/     # ORM 打包
│   │   ├── RampGenerator/     # Ramp 生成器
│   │   └── TexturePreview/    # 贴图预览
│   ├── tools/                 # 插件注册中心
│   └── styles/                # 设计变量 + 全局样式
├── resources/                 # 应用图标
├── electron-builder.yml       # 打包配置
├── package.json
└── CLAUDE.md                  # 产品设计文档
```

---

## 添加新工具

1. 在 `src/pages/NewTool/` 创建页面组件
2. 在 `src/tools/index.ts` 注册：

```typescript
const newTool: ToolPlugin = {
  id: 'new-tool',
  name: '新工具',
  description: '工具描述',
  icon: '🔧',
  path: '/new-tool',
  component: lazy(() => import('../pages/NewTool/NewToolPage')),
  order: 10,
}
```

3. 如需主进程能力，在 `electron/ipc/` 添加 IPC 处理器

侧边栏、首页、路由自动生效。

---

## 开发计划

- [x] Phase 1 — 基础框架（Electron + React + 插件系统）
- [x] Phase 2 — 核心工具（ORM 打包 / Ramp 生成 / 贴图预览）
- [x] Phase 3 — 产品打磨（统一 UI / 深色主题 / 错误处理 / 打包）

---

## License

MIT
