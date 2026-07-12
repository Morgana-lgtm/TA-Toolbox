import { ipcMain } from 'electron'

export function registerTextureHandlers(): void {
  /** 获取图片信息（使用 canvas 读取文件后分析） */
  ipcMain.handle('texture:get-info', async (_event, filePath: string) => {
    // TODO: Phase 2 用 sharp 实现完整信息读取
    // 当前返回占位数据，后续通过 sharp.metadata() 实现
    return {
      width: 0,
      height: 0,
      format: 'unknown',
      bitDepth: 0,
      channels: 0,
      hasAlpha: false,
      fileSize: 0
    }
  })

  /** 获取图片某个通道的灰度数据 */
  ipcMain.handle('texture:get-channel', async (_event, _filePath: string, _channel: 'r' | 'g' | 'b' | 'a') => {
    // TODO: Phase 2 用 sharp 实现
    return { dataUrl: '', width: 0, height: 0 }
  })

  /** ORM 打包：合并三张图的指定通道 */
  ipcMain.handle(
    'texture:pack-orm',
    async (_event, _aoPath: string, _metallicPath: string, _roughnessPath: string, _outputPath: string) => {
      // TODO: Phase 2 用 sharp 实现
      // R ← Metallic, G ← Roughness, B ← AO
      return { success: false, error: '功能开发中' }
    }
  )

  /** Ramp 生成 */
  ipcMain.handle('texture:generate-ramp', async (_event, params: {
    width: number
    height: number
    shadowPosition: number
    softness: number
    contrast: number
    outputPath: string
  }) => {
    // TODO: Phase 2 实现
    return { success: false, error: '功能开发中' }
  })
}
