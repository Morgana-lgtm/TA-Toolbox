import type { ComponentType, LazyExoticComponent } from 'react'

/** 工具插件接口 */
export interface ToolPlugin {
  /** 工具唯一标识（kebab-case） */
  id: string
  /** 工具中文名称 */
  name: string
  /** 简短描述（中文） */
  description: string
  /** 侧边栏与首页卡片图标（emoji 字符） */
  icon: string
  /** 路由路径 */
  path: string
  /** 懒加载的页面组件 */
  component: LazyExoticComponent<ComponentType>
  /** 排序权重（越小越靠前，默认 100） */
  order?: number
}

/** 全局 API 类型（来自 preload 暴露的 taAPI） */
export type { TAApi } from '../../electron/preload'
