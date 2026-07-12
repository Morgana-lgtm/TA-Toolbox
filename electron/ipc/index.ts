import { ipcMain, dialog, app } from 'electron'
import { registerFileHandlers } from './file.ipc'
import { registerTextureHandlers } from './texture.ipc'

export function registerIpcHandlers(): void {
  // 基础
  ipcMain.handle('app:get-version', () => app.getVersion())

  // 文件操作
  registerFileHandlers()

  // 纹理处理
  registerTextureHandlers()
}
