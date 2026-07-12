# Momo's TA Toolbox — 产品文档

## 概述

**Momo's TA Toolbox** 是一款面向技术美术（Technical Artist）的桌面工具集，运行于 Windows 平台。采用 **Electron + React + TypeScript** 技术栈，通过插件化架构实现功能的高可扩展性。

### 设计目标

| 目标 | 说明 |
|------|------|
| Windows 稳定运行 | 基于 Electron 成熟生态，原生支持 Windows 10/11 |
| 高可扩展性 | 插件化架构，新增工具只需注册路由+组件 |
| 中文优先 | UI 文案全部中文，仅专业术语（AO、ORM、Ramp 等）保留英文 |
| 离线可用 | 所有图像处理在本地完成，无需网络 |

---

## 技术架构

### 技术选型

```
┌─────────────────────────────────────────┐
│               Renderer (React)           │
│  ┌─────────┐ ┌──────────┐ ┌──────────┐  │
│  │  Home   │ │ Channel  │ │  Ramp    │  │
│  │  Page   │ │  Packer  │ │ Generator│  │
│  └─────────┘ └──────────┘ └──────────┘  │
│  ┌──────────────────────────────────┐    │
│  │      Plugin Registry (路由注册)    │    │
│  └──────────────────────────────────┘    │
│  ┌─────────┐ ┌──────────────────────┐    │
│  │  Sidebar│ │   Shared Components  │    │
│  └─────────┘ └──────────────────────┘    │
├─────────────────────────────────────────┤
│           Preload (IPC Bridge)           │
├─────────────────────────────────────────┤
│         Main Process (Electron)          │
│  ┌──────────┐ ┌──────────┐ ┌─────────┐  │
│  │  File IO │ │  sharp   │ │  Dialog │  │
│  │          │ │ (图像处理) │ │         │  │
│  └──────────┘ └──────────┘ └─────────┘  │
└─────────────────────────────────────────┘
```

| 层级 | 技术 | 用途 |
|------|------|------|
| 桌面容器 | Electron 28+ | 窗口管理、系统集成、文件对话框 |
| 前端框架 | React 18 + TypeScript | UI 渲染 |
| 构建工具 | Vite | 开发/打包 |
| UI 组件 | 自定义组件 + CSS Modules | 界面控件 |
| 图像处理 | sharp (Main Process) | 通道拆分/合并、图片读写 |
| 状态管理 | React Context + useReducer | 工具内部状态 |
| 打包分发 | electron-builder | 生成 Windows .exe 安装包 |

### 为什么选 Electron 而不是 Tauri？

- **生态成熟度**：sharp、canvas 等 Node.js 图像库在 Electron 下直接可用
- **插件化友好**：Node.js 的 require/import 动态加载机制天然支持插件
- **Windows 稳定**：Electron 在 Windows 上的兼容性经过大量商业应用验证
- **开发效率**：React 生态 + Vite HMR，开发体验流畅

---

## 项目目录结构

```
ta-toolbox/
├── electron/                    # Electron 主进程
│   ├── main.ts                  # 入口：窗口创建、生命周期
│   ├── preload.ts               # 预加载脚本：IPC 桥接
│   └── ipc/                     # IPC 处理器（按功能模块）
│       ├── file.ipc.ts          # 文件读写、对话框
│       ├── texture.ipc.ts       # 图像处理（sharp 调用）
│       └── index.ts             # 统一注册
│
├── src/                         # React 渲染进程
│   ├── main.tsx                 # React 挂载入口
│   ├── App.tsx                  # 根组件：路由 + 布局
│   │
│   ├── components/              # 通用组件
│   │   ├── Layout/
│   │   │   ├── AppLayout.tsx    # 整体布局（侧边栏 + 内容区）
│   │   │   └── Sidebar.tsx      # 侧边栏导航
│   │   ├── common/
│   │   │   ├── DropZone.tsx     # 拖拽/点击上传区域
│   │   │   ├── ImageCanvas.tsx  # 图片预览画布
│   │   │   └── SliderControl.tsx# 滑块控件
│   │   └── ToolShell.tsx        # 工具页面外壳（标题栏、操作区）
│   │
│   ├── pages/                   # 页面
│   │   ├── Home/
│   │   │   └── HomePage.tsx     # 首页
│   │   ├── ChannelPacker/
│   │   │   └── ChannelPackerPage.tsx
│   │   ├── RampGenerator/
│   │   │   └── RampGeneratorPage.tsx
│   │   └── TexturePreview/
│   │       └── TexturePreviewPage.tsx
│   │
│   ├── tools/                   # 工具注册中心
│   │   ├── registry.ts          # 工具注册表
│   │   ├── types.ts             # 工具类型定义
│   │   └── index.ts             # 所有工具入口
│   │
│   ├── hooks/                   # 自定义 Hooks
│   │   ├── useImageProcessor.ts # 调用主进程图像处理
│   │   └── useFileDialog.ts     # 文件选择
│   │
│   └── styles/                  # 全局样式
│       ├── global.css           # CSS 变量、重置
│       └── variables.css        # 主题变量
│
├── resources/                   # 静态资源
│   └── icons/                   # 应用图标
│
├── package.json
├── tsconfig.json
├── vite.config.ts               # Vite 配置（electron-vite）
├── electron-builder.yml         # 打包配置
└── CLAUDE.md                    # 本文档
```

---

## 插件化工具系统

### 工具注册接口

每个工具实现 `ToolPlugin` 接口即可被自动发现和加载：

```typescript
// src/tools/types.ts

interface ToolPlugin {
  /** 工具唯一标识 */
  id: string;
  /** 工具中文名称 */
  name: string;
  /** 简短描述（中文） */
  description: string;
  /** 侧边栏图标（可用 emoji 或 SVG 路径） */
  icon: string;
  /** 路由路径 */
  path: string;
  /** 页面组件 */
  component: React.LazyExoticComponent<React.ComponentType>;
  /** 排序权重（越小越靠前） */
  order?: number;
}
```

### 添加新工具的步骤

1. 在 `src/pages/NewTool/` 下创建页面组件
2. 在 `src/tools/index.ts` 中注册：

```typescript
const NewTool: ToolPlugin = {
  id: 'new-tool',
  name: '新工具',
  description: '新工具的描述',
  icon: '🔧',
  path: '/new-tool',
  component: lazy(() => import('../pages/NewTool/NewToolPage')),
  order: 10,
};

// 加入到 tools 数组
export const tools: ToolPlugin[] = [
  homePlugin,
  channelPackerPlugin,
  rampGeneratorPlugin,
  texturePreviewPlugin,
  newTool, // ← 新增一行即可
];
```

3. 如需调用主进程能力，在 `electron/ipc/` 下添加对应 IPC 处理器

---

## 功能详细设计

### 1. 首页 (Home)

**路由：** `/`

**布局：**
```
┌──────────────────────────────────────────────┐
│               Momo's TA Toolbox               │
│             技术美术日常工具集                 │
│                                               │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│   │  📦      │  │  🎨      │  │  🔍      │   │
│   │ ORM 打包 │  │ Ramp 生成│  │ 贴图预览 │   │
│   │          │  │          │  │          │   │
│   └──────────┘  └──────────┘  └──────────┘   │
│                                               │
└──────────────────────────────────────────────┘
```

用卡片网格展示所有工具入口，点击卡片跳转到对应工具页。

---

### 2. Channel Packer（ORM 打包）

**路由：** `/channel-packer`
**IPC 通道：** `texture:pack-orm`

**功能流程：**
```
AO.png ──────┐
             ├──→ 提取通道 ──→ ORM.png
Metallic.png ─┤       R: Metallic
             │       G: Roughness
Roughness.png┘       B: AO
```

**交互设计：**
```
┌─────────────────────────────────────────────────────┐
│  ← 返回              ORM 打包                       │
├─────────────────────────────────────────────────────┤
│                                                     │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│   │   拖入或点击  │  │   拖入或点击  │  │   拖入或点击  │ │
│   │   AO.png     │  │ Metallic.png│  │Roughness.png│ │
│   │   (B 通道)   │  │  (R 通道)   │  │  (G 通道)   │ │
│   └─────────────┘  └─────────────┘  └─────────────┘ │
│                                                     │
│              ┌─────────────────────┐                 │
│              │     ORM 预览        │                 │
│              │   ┌───────────────┐ │                 │
│              │   │               │ │                 │
│              │   │  R: Metallic  │ │                 │
│              │   │  G: Roughness │ │                 │
│              │   │  B: AO        │ │                 │
│              │   │               │ │                 │
│              │   └───────────────┘ │                 │
│              │   输出格式: [PNG ▼] │                 │
│              │   [  导出 ORM  ]    │                 │
│              └─────────────────────┘                 │
└─────────────────────────────────────────────────────┘
```

**技术实现：**
- 主进程用 `sharp` 分别读取三张图，提取指定通道
- 通过 `joinChannel` 合并为单张 3 通道图片
- 支持的输入格式：PNG、TGA、EXR、TIFF
- 默认输出格式：PNG

**校验规则：**
- 三张图分辨率必须一致（不一致时提示用户，可选择自动缩放）
- 至少需要一张输入图才能导出

---

### 3. Ramp Generator（Ramp 生成器）

**路由：** `/ramp-generator`
**IPC 通道：** `texture:generate-ramp`

**功能：** 生成 Toon Shader 使用的渐变 Ramp 贴图（1D 纹理，横向渐变）。

**交互设计：**
```
┌─────────────────────────────────────────────────────┐
│  ← 返回             Ramp 生成器                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│   ┌─────────────────────────────────────────────┐   │
│   │                                             │   │
│   │          ████████████████████████            │   │
│   │          ████████████████████████            │   │
│   │          ████████████████████████            │   │
│   │          Ramp 实时预览 (256×16)              │   │
│   │                                             │   │
│   └─────────────────────────────────────────────┘   │
│                                                     │
│   Shadow Position  ────●──────────  0.50            │
│   （阴影位置）                                       │
│                                                     │
│   Softness         ──────●────────  0.30            │
│   （柔和度）                                         │
│                                                     │
│   Contrast         ────────●──────  0.60            │
│   （对比度）                                         │
│                                                     │
│   分辨率: [256 ▼] × 16                              │
│                                                     │
│   [  导出 Ramp  ]                                   │
└─────────────────────────────────────────────────────┘
```

**参数说明：**

| 参数 | 范围 | 默认值 | 说明 |
|------|------|--------|------|
| Shadow Position | 0.0 – 1.0 | 0.50 | 阴影分界线的位置，越小阴影区域越大 |
| Softness | 0.0 – 1.0 | 0.30 | 阴影到亮部的过渡柔和度，0 为硬边 |
| Contrast | 0.0 – 1.0 | 0.60 | 亮部与暗部的对比强度 |
| 分辨率宽度 | 64/128/256/512 | 256 | Ramp 贴图的水平分辨率 |

**生成算法（GPU-friendly 数学描述）：**
```
对于每个像素 x (0 到 width-1)：
  t = x / (width - 1)                    // 归一化到 0-1
  midpoint = clamp(shadowPosition, 0, 1)
  
  使用 smoothstep 做柔和过渡：
  halfSoft = max(softness * 0.5, 0.001)
  low = midpoint - halfSoft
  high = midpoint + halfSoft
  
  基础值 = smoothstep(low, high, t)
  
  应用对比度：
  value = (基础值 - 0.5) * (1 + contrast) + 0.5
  value = clamp(value, 0, 1)
  
  pixel = vec4(value, value, value, 1.0)
```

**导出规格：**
- 默认分辨率：256×16 像素
- 格式：PNG（8-bit 灰度/RGB）

---

### 4. Texture Preview（贴图预览）

**路由：** `/texture-preview`
**IPC 通道：** `texture:get-info`、`texture:get-channel`

**功能：** 加载贴图，查看 RGBA 各通道和元信息。

**交互设计：**
```
┌─────────────────────────────────────────────────────┐
│  ← 返回             贴图预览                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│   ┌───────────────────────┐  ┌────────────────────┐ │
│   │                       │  │  基本信息           │ │
│   │                       │  │  分辨率  2048×2048  │ │
│   │     贴图预览          │  │  格式    PNG        │ │
│   │                       │  │  位深    8-bit      │ │
│   │                       │  │  通道数  RGBA       │ │
│   │                       │  │  文件大小 4.2 MB    │ │
│   └───────────────────────┘  └────────────────────┘ │
│                                                     │
│   通道显示:                                         │
│   ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐    │
│   │ RGBA │ │  R   │ │  G   │ │  B   │ │  A   │    │
│   │  ●   │ │  ○   │ │  ○   │ │  ○   │ │  ○   │    │
│   └──────┘ └──────┘ └──────┘ └──────┘ └──────┘    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**通道显示模式：**

| 标签 | 显示内容 |
|------|----------|
| RGBA | 完整彩色贴图（默认） |
| R | 仅红色通道（灰阶显示） |
| G | 仅绿色通道（灰阶显示） |
| B | 仅蓝色通道（灰阶显示） |
| A | 仅 Alpha 通道（灰阶显示） |

**元信息展示：**
- 分辨率（宽×高）
- 文件格式（PNG / TGA / EXR / TIFF / BMP / JPG）
- 位深度（8-bit / 16-bit / 32-bit）
- 通道数
- 文件大小
- 色彩空间（sRGB / Linear）

**技术实现：**
- 拖拽或点击上传贴图
- 主进程用 `sharp` 读取 metadata 和通道数据
- 前端用 Canvas 渲染灰度通道预览
- RGBA 预览直接用 `<img>` 标签（带 object-fit）
- 支持滚轮缩放和拖拽平移（大图浏览）

---

## 侧边栏设计

```
┌──────────────┐
│  TA TOOLBOX  │  ← Logo / 标题
│──────────────│
│  🏠 首页     │  ← 导航项（高亮当前）
│  📦 ORM 打包 │
│  🎨 Ramp 生成│
│  🔍 贴图预览 │
│──────────────│
│              │
│              │  ← 未来工具将在此区域追加
│              │
│──────────────│
│  ⚙ 设置      │  ← 底部固定
└──────────────┘
```

- 宽度：220px（可折叠为 60px 仅图标模式）
- 选中态：左侧高亮条 + 背景色变化
- 底部固定"设置"入口

---

## 开发路线图

### Phase 1：基础框架（已完成 ✅）
- [x] 初始化 Electron + React + Vite 项目
- [x] 实现 AppLayout（侧边栏 + 内容区路由）
- [x] 实现首页（工具卡片网格）
- [x] 搭建插件注册系统
- [x] 完成 IPC 桥接基础
- [x] Windows 下 ELECTRON_RUN_AS_NODE 兼容处理

### Phase 2：核心工具（已完成 ✅）
- [x] Channel Packer — ORM 打包
- [x] Ramp Generator — Ramp 生成器
- [x] Texture Preview — 贴图预览

### Phase 3：完善（部分完成）
- [ ] 设置页面（语言、默认路径）
- [x] 深色主题切换
- [x] 错误处理与用户提示（Toast 通知系统）
- [x] Windows 便携版打包（electron-builder）
- [ ] 自动更新机制

---

## 开发规范

### 命名约定
- **组件文件**：PascalCase（`ChannelPackerPage.tsx`）
- **工具函数**：camelCase（`packORMChannels`）
- **CSS 类名**：kebab-case（`.channel-packer`）
- **IPC 通道**：`模块:动作`（`texture:pack-orm`）

### 中文文案规范
- UI 标签、按钮、提示语一律使用中文
- 技术术语保留英文原文：AO、ORM、Ramp、Toon Shader、Alpha、sRGB
- 首次出现的技术术语可在括号内注释中文

### 组件规范
- 每个工具页面通过 `ToolShell` 组件包裹，自动获得统一的标题栏和返回按钮
- 使用 CSS Modules 避免样式冲突
- 所有颜色使用 CSS 变量，方便后续主题切换

---

## 常见问题

**Q: 为什么不直接用 Python + PyQt？**
A: Python 打包体积大、启动慢，且 UI 定制灵活性不如 Web 技术。Electron 虽有体积问题，但生态更成熟，对插件化支持更好。

**Q: 图像处理为什么放主进程而不是渲染进程？**
A: `sharp` 是 Node.js 原生模块，无法在浏览器环境中运行。通过 IPC 将处理逻辑放在主进程，渲染进程只负责 UI 展示。

**Q: 支持 HDR/EXR 贴图吗？**
A: `sharp` 对 EXR 支持有限，计划在后续版本通过集成 `OpenImageIO` 或用户自行安装插件来支持。

**Q: 启动报 `Cannot read properties of undefined (reading 'whenReady')` 怎么办？**
A: 检查是否设置了环境变量 `ELECTRON_RUN_AS_NODE=1`。当此变量为 `1` 时，Electron 以纯 Node.js 模式运行，无法访问 `app`、`BrowserWindow` 等 API，`require('electron')` 会错误地返回 npm 包路径而非 API 对象。解决：`unset ELECTRON_RUN_AS_NODE && npm run dev`。`package.json` 的 `dev`/`preview`/`package` 脚本已内置处理此问题。

## 环境要求

| 依赖 | 版本 |
|------|------|
| Node.js | ≥ 18 |
| npm | ≥ 9 |
| Windows | 10 / 11 |

**重要：** 运行前确保环境变量 `ELECTRON_RUN_AS_NODE` 未被设为 `1`。可通过 `echo $ELECTRON_RUN_AS_NODE` 检查。若为 `1`，执行 `unset ELECTRON_RUN_AS_NODE` 后重试。
