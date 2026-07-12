import { useState, useCallback, useRef, useEffect } from 'react'
import ToolShell from '../../components/ToolShell'
import DropZone from '../../components/common/DropZone'
import SliderControl from '../../components/common/SliderControl'
import { useToast } from '../../components/common/Toast'
import styles from './TexturePreviewPage.module.css'

type Channel = 'rgba' | 'r' | 'g' | 'b' | 'a'

interface ImageInfo {
  width: number
  height: number
  format: string
  bitDepth: number
  channels: number
  hasAlpha: boolean
  fileSize: number
  colorSpace?: string
  error?: string
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

const CHANNELS: { key: Channel; label: string }[] = [
  { key: 'rgba', label: 'RGBA' },
  { key: 'r', label: 'R' },
  { key: 'g', label: 'G' },
  { key: 'b', label: 'B' },
  { key: 'a', label: 'A' }
]

export default function TexturePreviewPage(): JSX.Element {
  const [filePath, setFilePath] = useState<string | null>(null)
  const [imgInfo, setImgInfo] = useState<ImageInfo | null>(null)
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [currentChannel, setCurrentChannel] = useState<Channel>('rgba')
  const [channelUrl, setChannelUrl] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pixel, setPixel] = useState<{ x: number; y: number; r: number; g: number; b: number; a: number } | null>(null)
  const [loading, setLoading] = useState(false)

  const { toast } = useToast()

  // 保存原始图片的 ImageData（用于像素采样和通道提取）
  const originalImageDataRef = useRef<ImageData | null>(null)
  const previewBoxRef = useRef<HTMLDivElement>(null)

  // 加载图片
  const loadImage = useCallback(async (path: string) => {
    setLoading(true)
    setCurrentChannel('rgba')
    setChannelUrl(null)
    setZoom(1)
    setPixel(null)

    // 独立请求 getInfo 和 readFile，各自处理错误
    let info: ImageInfo | null = null
    let fileData: { dataUrl: string | null; error?: string } | null = null

    try {
      info = await window.taAPI.getImageInfo(path)
    } catch (err) {
      const msg = err instanceof Error ? err.message : '未知错误'
      toast('error', '读取图片信息失败: ' + msg)
      setLoading(false)
      return
    }

    try {
      fileData = await window.taAPI.readFile(path)
    } catch (err) {
      const msg = err instanceof Error ? err.message : '未知错误'
      toast('error', '读取图片文件失败: ' + msg)
      // 即使 readFile 失败，info 可能仍然可用
    }

    if (info) {
      // 检查 info 中的 error 字段
      if (info.error) {
        toast('error', '图片信息异常: ' + info.error)
      }
      setImgInfo(info)
    }

    if (fileData?.dataUrl) {
      setDataUrl(fileData.dataUrl)

      // 预加载并提取原始像素数据
      const img = new Image()
      img.onload = () => {
        const c = document.createElement('canvas')
        c.width = img.naturalWidth
        c.height = img.naturalHeight
        const ctx = c.getContext('2d')!
        ctx.drawImage(img, 0, 0)
        originalImageDataRef.current = ctx.getImageData(0, 0, c.width, c.height)
      }
      img.onerror = () => {
        toast('error', '无法解码图片数据，文件可能已损坏')
        setDataUrl(null)
        originalImageDataRef.current = null
      }
      img.src = fileData.dataUrl
    } else {
      setDataUrl(null)
      originalImageDataRef.current = null
    }

    setLoading(false)
  }, [toast])

  // 切换通道 → 生成通道灰度图
  useEffect(() => {
    if (currentChannel === 'rgba') {
      setChannelUrl(null)
      return
    }

    const imgData = originalImageDataRef.current
    if (!imgData) return

    const channelIdx = { r: 0, g: 1, b: 2, a: 3 }[currentChannel]
    const { width, height, data } = imgData

    const out = new ImageData(width, height)
    for (let i = 0; i < data.length; i += 4) {
      const val = data[i + channelIdx]
      out.data[i] = val
      out.data[i + 1] = val
      out.data[i + 2] = val
      out.data[i + 3] = 255
    }

    const c = document.createElement('canvas')
    c.width = width
    c.height = height
    c.getContext('2d')!.putImageData(out, 0, 0)
    setChannelUrl(c.toDataURL('image/png'))
  }, [currentChannel])

  // 鼠标移动 → 像素采样
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const origData = originalImageDataRef.current
      if (!origData) return

      const rect = previewBoxRef.current?.getBoundingClientRect()
      if (!rect) return

      const imgW = origData.width * zoom
      const imgH = origData.height * zoom

      // 图片在容器中居中
      const offsetX = Math.max(0, (rect.width - imgW) / 2)
      const offsetY = Math.max(0, (rect.height - imgH) / 2)

      const box = previewBoxRef.current!
      const relX = (e.clientX - rect.left - box.scrollLeft - offsetX) / zoom
      const relY = (e.clientY - rect.top - box.scrollTop - offsetY) / zoom

      const px = Math.floor(relX)
      const py = Math.floor(relY)

      if (px < 0 || px >= origData.width || py < 0 || py >= origData.height) {
        setPixel(null)
        return
      }

      const idx = (py * origData.width + px) * 4
      setPixel({
        x: px, y: py,
        r: origData.data[idx],
        g: origData.data[idx + 1],
        b: origData.data[idx + 2],
        a: origData.data[idx + 3]
      })
    },
    [zoom]
  )

  const handleMouseLeave = useCallback(() => setPixel(null), [])

  const displayUrl = currentChannel === 'rgba' ? dataUrl : channelUrl

  return (
    <ToolShell toolId="texture-preview">
      <div className={styles.page}>
        {/* ─── 输入区 ─── */}
        <div className={styles.inputRow}>
          <DropZone
            label="拖入或点击选择贴图"
            sublabel="支持 PNG、TGA、TIFF、EXR、BMP、JPG、WebP"
            value={filePath}
            onChange={(p) => { setFilePath(p); loadImage(p) }}
          />
        </div>

        {loading && (
          <div className={styles.placeholder}>
            <span className={styles.placeholderText}>加载中...</span>
          </div>
        )}

        {!loading && filePath && imgInfo && (
          <div className={styles.content}>
            {/* ─── 预览区 ─── */}
            <div className={styles.previewArea}>
              {/* 预览容器 */}
              <div
                ref={previewBoxRef}
                className={styles.previewBox}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              >
                {displayUrl && (
                  <img
                    className={styles.previewImg}
                    src={displayUrl}
                    alt="预览"
                    draggable={false}
                    style={{
                      width: imgInfo.width * zoom,
                      height: imgInfo.height * zoom
                    }}
                  />
                )}
              </div>

              {/* 缩放滑块 */}
              <div className={styles.zoomRow}>
                <SliderControl
                  label="缩放"
                  value={zoom}
                  onChange={setZoom}
                  min={0.25}
                  max={8}
                  step={0.25}
                  formatValue={(v) => `${Math.round(v * 100)}%`}
                />
              </div>

              {/* 通道切换 */}
              <div className={styles.channelBar}>
                {CHANNELS.map((ch) => (
                  <button
                    key={ch.key}
                    className={`${styles.channelBtn} ${currentChannel === ch.key ? styles.active : ''}`}
                    onClick={() => setCurrentChannel(ch.key)}
                  >
                    {ch.label}
                  </button>
                ))}
              </div>

              {/* 像素值（固定高度） */}
              <div className={styles.pixelBar}>
                {pixel ? (
                  <div className={styles.pixelValues}>
                    <span className={styles.pixelCoord}>({pixel.x}, {pixel.y})</span>
                    <span className={styles.pixelR}>R:{pixel.r}</span>
                    <span className={styles.pixelG}>G:{pixel.g}</span>
                    <span className={styles.pixelB}>B:{pixel.b}</span>
                    <span className={styles.pixelA}>A:{pixel.a}</span>
                    <span className={styles.pixelHex}>
                      #{pixel.r.toString(16).padStart(2, '0').toUpperCase()}
                      {pixel.g.toString(16).padStart(2, '0').toUpperCase()}
                      {pixel.b.toString(16).padStart(2, '0').toUpperCase()}
                    </span>
                  </div>
                ) : (
                  <span>鼠标悬停查看像素值</span>
                )}
              </div>
            </div>

            {/* ─── 元信息 ─── */}
            <div className={styles.metaPanel}>
              <h3 className={styles.metaTitle}>基本信息</h3>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>分辨率</span>
                <span className={styles.metaValue}>{imgInfo.width} × {imgInfo.height}</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>格式</span>
                <span className={styles.metaValue}>{imgInfo.format}</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>位深</span>
                <span className={styles.metaValue}>{imgInfo.bitDepth}-bit</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>通道数</span>
                <span className={styles.metaValue}>
                  {imgInfo.channels}{imgInfo.hasAlpha ? ' (含Alpha)' : ''}
                </span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>文件大小</span>
                <span className={styles.metaValue}>{formatFileSize(imgInfo.fileSize)}</span>
              </div>
              {imgInfo.colorSpace && imgInfo.colorSpace !== 'unknown' && (
                <div className={styles.metaRow}>
                  <span className={styles.metaLabel}>色彩空间</span>
                  <span className={styles.metaValue}>{imgInfo.colorSpace}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {!loading && !filePath && (
          <div className={styles.placeholder}>
            <div className={styles.placeholderIcon}>🔍</div>
            <p className={styles.placeholderText}>拖入贴图开始预览</p>
          </div>
        )}
      </div>
    </ToolShell>
  )
}
