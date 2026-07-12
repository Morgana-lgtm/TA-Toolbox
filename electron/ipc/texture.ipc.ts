import { ipcMain } from 'electron'
import sharp, { type Metadata } from 'sharp'
import { statSync } from 'fs'
import { basename } from 'path'

/**
 * 将 sharp 格式字符串映射为友好名称
 */
function mapFormat(format: string | undefined): string {
  if (!format) return 'unknown'
  const map: Record<string, string> = {
    png: 'PNG',
    jpeg: 'JPEG',
    tiff: 'TIFF',
    webp: 'WebP',
    gif: 'GIF',
    svg: 'SVG',
    pdf: 'PDF',
    ppm: 'PPM',
    pfm: 'PFM'
  }
  return map[format] ?? format.toUpperCase()
}

/**
 * 根据通道数推断 hasAlpha
 */
function inferHasAlpha(channels: number): boolean {
  return channels === 4 || channels === 2
}

/**
 * 根据位深和通道数推算 bitDepth
 */
function inferBitDepth(metadata: Metadata): number {
  // 优先使用 bitsPerSample，其次根据 depth 字符串推断
  if (metadata.bitsPerSample) return metadata.bitsPerSample
  const depth = metadata.depth as string
  if (depth === 'uchar' || depth === 'char') return 8
  if (depth === 'ushort' || depth === 'short') return 16
  if (depth === 'float') return 32
  if (depth === 'double') return 64
  return 8
}

/**
 * 将 Buffer 转为 PNG base64 data URL
 */
function toPngDataUrl(buffer: Buffer): string {
  const base64 = buffer.toString('base64')
  return `data:image/png;base64,${base64}`
}

export function registerTextureHandlers(): void {
  // ─── 获取图片信息 ────────────────────────────────────────
  ipcMain.handle('texture:get-info', async (_event, filePath: string) => {
    try {
      const metadata = await sharp(filePath).metadata()
      const stats = statSync(filePath)

      return {
        width: metadata.width ?? 0,
        height: metadata.height ?? 0,
        format: mapFormat(metadata.format),
        bitDepth: inferBitDepth(metadata),
        channels: metadata.channels ?? 0,
        hasAlpha: inferHasAlpha(metadata.channels ?? 0),
        fileSize: stats.size,
        colorSpace: metadata.space ?? 'unknown'
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[texture:get-info] 读取失败: ${filePath}`, message)
      return {
        width: 0,
        height: 0,
        format: 'unknown',
        bitDepth: 0,
        channels: 0,
        hasAlpha: false,
        fileSize: 0,
        colorSpace: 'unknown',
        error: message
      }
    }
  })

  // ─── 读取图片为 PNG data URL（供渲染进程显示） ──────────
  ipcMain.handle('texture:read-file', async (_event, filePath: string) => {
    try {
      const buffer = await sharp(filePath).png().toBuffer()
      return { dataUrl: toPngDataUrl(buffer) }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[texture:read-file] 读取失败: ${filePath}`, message)
      return { dataUrl: null, error: message }
    }
  })

  // ─── 获取图片某个通道的灰度数据 ────────────────────────
  ipcMain.handle(
    'texture:get-channel',
    async (_event, filePath: string, channel: 'r' | 'g' | 'b' | 'a') => {
      try {
        const metadata = await sharp(filePath).metadata()
        const channels = metadata.channels ?? 0

        // sharp extractChannel 接受的 channel 参数
        const channelNameMap: Record<string, 'red' | 'green' | 'blue' | 'alpha'> = {
          r: 'red',
          g: 'green',
          b: 'blue',
          a: 'alpha'
        }
        const channelName = channelNameMap[channel]

        // 如果请求的通道不存在
        if (
          (channel === 'a' && !inferHasAlpha(channels)) ||
          (channel !== 'a' && channels < 3)
        ) {
          return {
            dataUrl: null,
            width: metadata.width ?? 0,
            height: metadata.height ?? 0,
            error: `图片没有 ${channel.toUpperCase()} 通道`
          }
        }

        const buffer = await sharp(filePath)
          .extractChannel(channelName)
          .toBuffer()

        return {
          dataUrl: toPngDataUrl(buffer),
          width: metadata.width ?? 0,
          height: metadata.height ?? 0
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        console.error(`[texture:get-channel] 读取失败: ${filePath}`, message)
        return { dataUrl: null, width: 0, height: 0, error: message }
      }
    }
  )

  // ─── ORM 打包：合并三张图的指定通道 ─────────────────────
  ipcMain.handle(
    'texture:pack-orm',
    async (
      _event,
      aoPath: string | null,
      metallicPath: string | null,
      roughnessPath: string | null,
      outputPath?: string,
      options?: { linearizeMetallic?: boolean; linearizeRoughness?: boolean }
    ) => {
      try {
        // 收集有效输入
        const inputs: { path: string; role: 'ao' | 'metallic' | 'roughness' }[] = []
        if (aoPath) inputs.push({ path: aoPath, role: 'ao' })
        if (metallicPath) inputs.push({ path: metallicPath, role: 'metallic' })
        if (roughnessPath) inputs.push({ path: roughnessPath, role: 'roughness' })

        if (inputs.length === 0) {
          return { success: false, error: '至少需要提供一张输入图' }
        }

        // 获取第一张图的分辨率作为基准
        const firstMeta = await sharp(inputs[0].path).metadata()
        const width = firstMeta.width ?? 0
        const height = firstMeta.height ?? 0

        // 校验所有图分辨率一致
        for (const input of inputs) {
          const meta = await sharp(input.path).metadata()
          if (meta.width !== width || meta.height !== height) {
            return {
              success: false,
              error: `分辨率不一致: ${basename(inputs[0].path)} 为 ${width}×${height}，但 ${basename(input.path)} 为 ${meta.width}×${meta.height}`
            }
          }
        }

        // 预计算 sRGB → Linear 查找表 (gamma 2.2)
        const gamma = 2.2
        const srgbToLinearLUT = new Uint8Array(256)
        for (let i = 0; i < 256; i++) {
          srgbToLinearLUT[i] = Math.round(Math.pow(i / 255, gamma) * 255)
        }

        // 提取各通道 raw buffer（所有输入都是独立灰度贴图，各取 R 通道即可）
        const pixelCount = width * height
        const zeroBuffer = Buffer.alloc(pixelCount, 0)

        const aoBuf = aoPath
          ? await sharp(aoPath).extractChannel('red').raw().toBuffer()
          : zeroBuffer
        const metBuf = metallicPath
          ? await sharp(metallicPath).extractChannel('red').raw().toBuffer()
          : zeroBuffer
        const roughBuf = roughnessPath
          ? await sharp(roughnessPath).extractChannel('red').raw().toBuffer()
          : zeroBuffer

        // 使用 Uint8Array 视图加速交错
        const ao = new Uint8Array(aoBuf.buffer, aoBuf.byteOffset, pixelCount)
        const met = new Uint8Array(metBuf.buffer, metBuf.byteOffset, pixelCount)
        const rough = new Uint8Array(roughBuf.buffer, roughBuf.byteOffset, pixelCount)

        const applyLinear = options?.linearizeMetallic || options?.linearizeRoughness

        // 交错: R=Metallic, G=Roughness, B=AO
        const merged = new Uint8Array(pixelCount * 3)
        const linearizeMet = options?.linearizeMetallic
        const linearizeRough = options?.linearizeRoughness

        if (applyLinear) {
          for (let i = 0; i < pixelCount; i++) {
            merged[i * 3] = linearizeMet ? srgbToLinearLUT[met[i]] : met[i]
            merged[i * 3 + 1] = linearizeRough ? srgbToLinearLUT[rough[i]] : rough[i]
            merged[i * 3 + 2] = ao[i]
          }
        } else {
          for (let i = 0; i < pixelCount; i++) {
            merged[i * 3] = met[i]
            merged[i * 3 + 1] = rough[i]
            merged[i * 3 + 2] = ao[i]
          }
        }

        const outputBuffer = await sharp(Buffer.from(merged), {
          raw: { width, height, channels: 3 }
        }).png().toBuffer()

        if (outputPath) {
          await sharp(outputBuffer).toFile(outputPath)
          return { success: true, outputPath }
        }

        return {
          success: true,
          dataUrl: toPngDataUrl(outputBuffer),
          width,
          height
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        console.error('[texture:pack-orm] 打包失败', message)
        return { success: false, error: message }
      }
    }
  )

  // ─── Ramp 生成 ───────────────────────────────────────────
  ipcMain.handle(
    'texture:generate-ramp',
    async (
      _event,
      params: {
        width: number
        height: number
        softness: number
        stops: { position: number; color: string }[]
        outputPath: string
      }
    ) => {
      try {
        const { width, height, softness, stops, outputPath } = params

        // 解析 hex 颜色
        const parseHex = (hex: string) => {
          const clean = hex.replace('#', '')
          const num = parseInt(clean, 16)
          return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 }
        }

        // 排序并解析
        const parsed = [...stops]
          .sort((a, b) => a.position - b.position)
          .map((s) => ({ position: s.position, rgb: parseHex(s.color) }))

        // 多色阶 smoothstep
        const pixels = Buffer.alloc(width * height * 3)

        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const t = x / (width - 1)

            // 找到 t 落在哪两个节点之间
            let leftIdx = 0
            let rightIdx = parsed.length - 1
            for (let i = 0; i < parsed.length - 1; i++) {
              if (t >= parsed[i].position && t <= parsed[i + 1].position) {
                leftIdx = i
                rightIdx = i + 1
                break
              }
            }
            if (t <= parsed[0].position) { leftIdx = 0; rightIdx = 0 }
            if (t >= parsed[parsed.length - 1].position) { leftIdx = parsed.length - 1; rightIdx = parsed.length - 1 }

            let value: number
            if (leftIdx === rightIdx) {
              value = leftIdx === 0 ? 0 : 1
            } else {
              const segLen = parsed[rightIdx].position - parsed[leftIdx].position
              const localT = (t - parsed[leftIdx].position) / segLen
              const halfSoft = Math.max(softness * 0.5, 0.001)

              const clampLow = Math.max(0, Math.min(1, 0.5 - halfSoft))
              const clampHigh = Math.max(0, Math.min(1, 0.5 + halfSoft))

              if (localT <= clampLow) {
                value = 0
              } else if (localT >= clampHigh) {
                value = 1
              } else {
                const s = (localT - clampLow) / (clampHigh - clampLow)
                value = s * s * (3 - 2 * s)
              }
            }

            const left = parsed[leftIdx].rgb
            const right = parsed[rightIdx].rgb
            const offset = (y * width + x) * 3
            pixels[offset] = Math.round(left.r + (right.r - left.r) * value)
            pixels[offset + 1] = Math.round(left.g + (right.g - left.g) * value)
            pixels[offset + 2] = Math.round(left.b + (right.b - left.b) * value)
          }
        }

        await sharp(pixels, {
          raw: {
            width,
            height,
            channels: 3
          }
        })
          .png()
          .toFile(outputPath)

        // 同时返回 dataUrl 用于前端预览
        const previewBuffer = await sharp(pixels, {
          raw: { width, height, channels: 3 }
        })
          .png()
          .toBuffer()

        return {
          success: true,
          dataUrl: toPngDataUrl(previewBuffer),
          width,
          height
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        console.error('[texture:generate-ramp] 生成失败', message)
        return { success: false, error: message }
      }
    }
  )
}
