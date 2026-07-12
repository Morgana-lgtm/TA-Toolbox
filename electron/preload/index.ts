import { contextBridge, ipcRenderer } from 'electron'

/**
 * 暴露给渲染进程的 API
 * 所有与主进程的通信都通过这个桥接对象
 */
const api = {
  /** 获取应用版本号 */
  getVersion: (): Promise<string> => ipcRenderer.invoke('app:get-version'),

  /** 打开文件选择对话框 */
  openFileDialog: (options?: {
    filters?: Array<{ name: string; extensions: string[] }>
  }): Promise<string | null> =>
    ipcRenderer.invoke('dialog:open-file', options),

  /** 保存文件对话框 */
  saveFileDialog: (options?: {
    defaultPath?: string
    filters?: Array<{ name: string; extensions: string[] }>
  }): Promise<string | null> =>
    ipcRenderer.invoke('dialog:save-file', options),

  /** 获取图片信息 */
  getImageInfo: (
    filePath: string
  ): Promise<{
    width: number
    height: number
    format: string
    bitDepth: number
    channels: number
    hasAlpha: boolean
    fileSize: number
  }> => ipcRenderer.invoke('texture:get-info', filePath),

  /** 读取图片某个通道的像素数据（返回 base64） */
  getChannelData: (
    filePath: string,
    channel: 'r' | 'g' | 'b' | 'a'
  ): Promise<{ dataUrl: string; width: number; height: number }> =>
    ipcRenderer.invoke('texture:get-channel', filePath, channel),

  /** ORM 打包：三张图合并为 ORM */
  packORM: (
    aoPath: string,
    metallicPath: string,
    roughnessPath: string,
    outputPath: string
  ): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('texture:pack-orm', aoPath, metallicPath, roughnessPath, outputPath),

  /** Ramp 生成 */
  generateRamp: (params: {
    width: number
    height: number
    shadowPosition: number
    softness: number
    contrast: number
    outputPath: string
  }): Promise<{ success: boolean; dataUrl?: string; error?: string }> =>
    ipcRenderer.invoke('texture:generate-ramp', params)
}

contextBridge.exposeInMainWorld('taAPI', api)

export type TAApi = typeof api
