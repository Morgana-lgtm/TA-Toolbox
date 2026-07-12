import { ipcMain, dialog, BrowserWindow } from 'electron'

export function registerFileHandlers(): void {
  /** 打开文件选择对话框 */
  ipcMain.handle('dialog:open-file', async (_event, options?: {
    filters?: Array<{ name: string; extensions: string[] }>
  }) => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return null

    const result = await dialog.showOpenDialog(win, {
      properties: ['openFile'],
      filters: options?.filters ?? [
        { name: '图片文件', extensions: ['png', 'jpg', 'jpeg', 'tga', 'tiff', 'tif', 'bmp', 'webp'] },
        { name: '所有文件', extensions: ['*'] }
      ]
    })

    return result.canceled ? null : result.filePaths[0]
  })

  /** 保存文件对话框 */
  ipcMain.handle('dialog:save-file', async (_event, options?: {
    defaultPath?: string
    filters?: Array<{ name: string; extensions: string[] }>
  }) => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return null

    const result = await dialog.showSaveDialog(win, {
      defaultPath: options?.defaultPath,
      filters: options?.filters ?? [
        { name: 'PNG', extensions: ['png'] }
      ]
    })

    return result.canceled ? null : result.filePath
  })
}
