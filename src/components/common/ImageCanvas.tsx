import { useRef, useCallback, useEffect } from 'react'
import styles from './ImageCanvas.module.css'

export interface PixelInfo {
  r: number
  g: number
  b: number
  a: number
  x: number
  y: number
}

interface ImageCanvasProps {
  /** 图片 data URL */
  src: string | null
  /** 图片原始宽度 */
  imgWidth?: number
  /** 图片原始高度 */
  imgHeight?: number
  /** 缩放级别 (默认 1) */
  zoom?: number
  /** 容器 CSS 宽度 */
  containerWidth?: string
  /** 容器 CSS 高度 */
  containerHeight?: string
  /** 像素悬停回调 */
  onPixelHover?: (pixel: PixelInfo | null) => void
}

export default function ImageCanvas({
  src,
  imgWidth,
  imgHeight,
  zoom = 1,
  containerWidth = '100%',
  containerHeight = '400px',
  onPixelHover
}: ImageCanvasProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const sampleCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const lastPixelRef = useRef<{ x: number; y: number } | null>(null)

  // 当 src 变化时，将图片绘制到采样 canvas
  useEffect(() => {
    if (!src || !onPixelHover) return
    const img = new Image()
    img.onload = () => {
      if (!sampleCanvasRef.current) {
        sampleCanvasRef.current = document.createElement('canvas')
      }
      const c = sampleCanvasRef.current
      c.width = img.naturalWidth
      c.height = img.naturalHeight
      const ctx = c.getContext('2d')!
      ctx.drawImage(img, 0, 0)
    }
    img.src = src
  }, [src, onPixelHover])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!onPixelHover || !imgWidth || !imgHeight) return
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return

      const relX = e.clientX - rect.left
      const relY = e.clientY - rect.top
      const imgX = relX / zoom
      const imgY = relY / zoom
      const px = Math.floor(imgX)
      const py = Math.floor(imgY)

      // 只在像素坐标变化时更新
      const prev = lastPixelRef.current
      if (prev && prev.x === px && prev.y === py) return
      lastPixelRef.current = { x: px, y: py }

      if (px < 0 || px >= imgWidth || py < 0 || py >= imgHeight) {
        onPixelHover(null)
        return
      }

      const c = sampleCanvasRef.current
      if (!c) return
      const ctx = c.getContext('2d')!
      const data = ctx.getImageData(px, py, 1, 1).data
      onPixelHover({ r: data[0], g: data[1], b: data[2], a: data[3], x: px, y: py })
    },
    [imgWidth, imgHeight, zoom, onPixelHover]
  )

  const handleMouseLeave = useCallback(() => {
    lastPixelRef.current = null
    onPixelHover?.(null)
  }, [onPixelHover])

  if (!src) {
    return (
      <div
        className={styles.container}
        style={{ width: containerWidth, height: containerHeight }}
      >
        <span className={styles.empty}>拖入图片以预览</span>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={styles.container}
      style={{ width: containerWidth, height: containerHeight, overflow: 'hidden' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <img
        className={styles.image}
        src={src}
        alt="预览"
        draggable={false}
        style={{
          width: imgWidth ? imgWidth * zoom : 'auto',
          height: imgHeight ? imgHeight * zoom : 'auto',
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: 'contain'
        }}
      />
    </div>
  )
}
