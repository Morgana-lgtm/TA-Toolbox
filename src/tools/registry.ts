import type { ToolPlugin } from './types'

/**
 * 工具注册表
 * 所有工具在此集中注册，按 order 排序
 */
const registry: Map<string, ToolPlugin> = new Map()

export function registerTool(plugin: ToolPlugin): void {
  if (registry.has(plugin.id)) {
    console.warn(`工具 "${plugin.id}" 已注册，将被覆盖`)
  }
  registry.set(plugin.id, plugin)
}

export function getTool(id: string): ToolPlugin | undefined {
  return registry.get(id)
}

export function getAllTools(): ToolPlugin[] {
  return Array.from(registry.values()).sort(
    (a, b) => (a.order ?? 100) - (b.order ?? 100)
  )
}
