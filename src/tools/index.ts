/**
 * 工具入口 —— 所有工具在此注册
 *
 * 新增工具的步骤：
 * 1. 在 src/pages/ 下创建页面组件
 * 2. 在此文件 import 并调用 registerTool
 * 3. 侧边栏、首页、路由自动生效
 */
import { lazy } from 'react'
import { registerTool, getAllTools } from './registry'
import type { ToolPlugin } from './types'

// ─── 首页（特殊：path = '/'，order = 0 排最前） ───
const homePlugin: ToolPlugin = {
  id: 'home',
  name: '首页',
  description: "Momo's TA Toolbox 工具集入口",
  icon: '🏠',
  path: '/',
  component: lazy(() => import('../pages/Home/HomePage')),
  order: 0
}

// ─── 纹理工具 ───
const channelPackerPlugin: ToolPlugin = {
  id: 'channel-packer',
  name: 'ORM 打包',
  description: '将 AO、Metallic、Roughness 三张贴图合并为一张 ORM 贴图',
  icon: '📦',
  path: '/channel-packer',
  component: lazy(() => import('../pages/ChannelPacker/ChannelPackerPage')),
  order: 10
}

const rampGeneratorPlugin: ToolPlugin = {
  id: 'ramp-generator',
  name: 'Ramp 生成器',
  description: '通过滑块生成 Toon Shader 用的 Ramp 纹理',
  icon: '🎨',
  path: '/ramp-generator',
  component: lazy(() => import('../pages/RampGenerator/RampGeneratorPage')),
  order: 20
}

const texturePreviewPlugin: ToolPlugin = {
  id: 'texture-preview',
  name: '贴图预览',
  description: '查看贴图 RGBA 各通道和基本信息',
  icon: '🔍',
  path: '/texture-preview',
  component: lazy(() => import('../pages/TexturePreview/TexturePreviewPage')),
  order: 30
}

// ─── 注册所有工具 ───
;[homePlugin, channelPackerPlugin, rampGeneratorPlugin, texturePreviewPlugin].forEach(registerTool)

// ─── 导出（供路由和侧边栏使用） ───
export const tools = getAllTools()
export { registerTool, getTool, getAllTools } from './registry'
export type { ToolPlugin } from './types'
