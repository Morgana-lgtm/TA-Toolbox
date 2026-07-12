import { useState, useCallback, useRef, useEffect } from 'react'
import ToolShell from '../../components/ToolShell'
import SliderControl from '../../components/common/SliderControl'
import { useToast } from '../../components/common/Toast'
import styles from './RampGeneratorPage.module.css'

/** 颜色节点 */
interface ColorStop {
  position: number  // 0-1
  color: string     // #RRGGBB
}

/** 默认色阶：深靛蓝 → 紫 → 暖橙 */
const DEFAULT_STOPS: ColorStop[] = [
  { position: 0.0, color: '#0f0c29' },
  { position: 0.5, color: '#7b2d8b' },
  { position: 1.0, color: '#f7971e' }
]

/** 解析 hex 颜色字符串为 RGB */
function parseHex(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '')
  const num = parseInt(clean, 16)
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  }
}

/** 生成多色阶 ramp 像素数据 */
function generateRampPixels(
  width: number,
  height: number,
  softness: number,
  stops: ColorStop[]
): ImageData {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  const imgData = ctx.createImageData(width, height)

  // 按 position 排序
  const sorted = [...stops].sort((a, b) => a.position - b.position)
  // 解析所有颜色
  const parsed = sorted.map((s) => ({ position: s.position, rgb: parseHex(s.color) }))

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

      // 在区间内做 smoothstep
      let value: number
      if (leftIdx === rightIdx) {
        value = leftIdx === 0 ? 0 : 1
      } else {
        const segLen = parsed[rightIdx].position - parsed[leftIdx].position
        const localT = (t - parsed[leftIdx].position) / segLen

        // smoothstep with softness
        const halfSoft = Math.max(softness * 0.5, 0.001)
        const low = Math.max(0, -halfSoft / segLen)
        const high = Math.min(1, 1 + halfSoft / segLen)
        // clamp softness to segment
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
      const offset = (y * width + x) * 4
      imgData.data[offset] = Math.round(left.r + (right.r - left.r) * value)
      imgData.data[offset + 1] = Math.round(left.g + (right.g - left.g) * value)
      imgData.data[offset + 2] = Math.round(left.b + (right.b - left.b) * value)
      imgData.data[offset + 3] = 255
    }
  }

  return imgData
}

const RESOLUTIONS = [64, 128, 256, 512]
const RAMP_HEIGHT = 16
const MIN_STOPS = 2
const MAX_STOPS = 8

export default function RampGeneratorPage(): JSX.Element {
  const [stops, setStops] = useState<ColorStop[]>(DEFAULT_STOPS)
  const [softness, setSoftness] = useState(0.3)
  const [width, setWidth] = useState(256)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  const { toast } = useToast()

  const previewCanvasRef = useRef<HTMLCanvasElement>(null)

  // 实时预览
  useEffect(() => {
    const canvas = previewCanvasRef.current
    if (!canvas) return

    const imgData = generateRampPixels(width, RAMP_HEIGHT, softness, stops)
    const offscreen = document.createElement('canvas')
    offscreen.width = width
    offscreen.height = RAMP_HEIGHT
    const offCtx = offscreen.getContext('2d')!
    offCtx.putImageData(imgData, 0, 0)

    const ctx = canvas.getContext('2d')!
    canvas.width = width
    canvas.height = RAMP_HEIGHT
    ctx.drawImage(offscreen, 0, 0)
  }, [width, softness, stops])

  // 添加色阶节点
  const addStop = useCallback(() => {
    setStops((prev) => {
      if (prev.length >= MAX_STOPS) return prev
      // 在中间位置插入新节点
      const newStop: ColorStop = { position: 0.75, color: '#888888' }
      return [...prev, newStop]
    })
  }, [])

  // 删除色阶节点
  const removeStop = useCallback((index: number) => {
    setStops((prev) => {
      if (prev.length <= MIN_STOPS) return prev
      return prev.filter((_, i) => i !== index)
    })
  }, [])

  // 更新节点颜色
  const updateStopColor = useCallback((index: number, color: string) => {
    setStops((prev) => prev.map((s, i) => i === index ? { ...s, color } : s))
  }, [])

  // 更新节点位置
  const updateStopPosition = useCallback((index: number, position: number) => {
    setStops((prev) => prev.map((s, i) => i === index ? { ...s, position } : s))
  }, [])

  // 导出
  const handleExport = useCallback(async () => {
    setError(null)
    setSuccessMsg(null)
    setExporting(true)

    try {
      const savePath = await window.taAPI.saveFileDialog({
        defaultPath: `Ramp_${width}x${RAMP_HEIGHT}.png`,
        filters: [{ name: 'PNG', extensions: ['png'] }]
      })

      if (!savePath) {
        setExporting(false)
        return
      }

      const result = await window.taAPI.generateRamp({
        width,
        height: RAMP_HEIGHT,
        softness,
        stops,
        outputPath: savePath
      })

      if (result.success) {
        const fileName = savePath.split(/[/\\]/).pop()
        toast('success', '导出成功')
        setSuccessMsg(`导出成功: ${fileName}`)
        setTimeout(() => setSuccessMsg(null), 3000)
      } else {
        const msg = result.error || '导出失败'
        toast('error', '导出失败: ' + msg)
        setError(msg)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '导出出错'
      toast('error', '导出失败: ' + msg)
      setError(msg)
    } finally {
      setExporting(false)
    }
  }, [width, softness, stops, toast])

  return (
    <ToolShell toolId="ramp-generator">
      <div className={styles.page}>
        {/* ─── 预览区 ─── */}
        <div className={styles.previewSection}>
          <div className={styles.canvasWrapper}>
            <canvas ref={previewCanvasRef} className={styles.rampCanvas} />
          </div>
          <span className={styles.previewLabel}>
            Ramp 预览 · {width}×{RAMP_HEIGHT}
          </span>
        </div>

        {/* ─── 参数区 ─── */}
        <div className={styles.params}>
          <SliderControl
            label="过渡柔和度"
            value={softness}
            onChange={setSoftness}
            min={0}
            max={1}
            step={0.01}
          />

          {/* ─── 色阶节点列表 ─── */}
          <div className={styles.stopsSection}>
            <div className={styles.stopsHeader}>
              <span className={styles.stopsTitle}>色阶节点</span>
              <button
                className={styles.addBtn}
                onClick={addStop}
                disabled={stops.length >= MAX_STOPS}
              >
                ＋ 添加
              </button>
            </div>

            {stops.map((stop, index) => (
              <div key={index} className={styles.stopRow}>
                <span className={styles.stopIndex}>#{index + 1}</span>
                <input
                  type="color"
                  className={styles.stopColor}
                  value={stop.color}
                  onChange={(e) => updateStopColor(index, e.target.value)}
                />
                <span className={styles.stopHex}>{stop.color}</span>
                <div className={styles.stopPosWrap}>
                  <input
                    type="range"
                    className={styles.stopSlider}
                    min={0}
                    max={1}
                    step={0.01}
                    value={stop.position}
                    onChange={(e) => updateStopPosition(index, parseFloat(e.target.value))}
                  />
                  <span className={styles.stopPosVal}>{Math.round(stop.position * 100)}%</span>
                </div>
                {stops.length > MIN_STOPS && (
                  <button
                    className={styles.removeBtn}
                    onClick={() => removeStop(index)}
                    title="删除此节点"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className={styles.resRow}>
            <span className={styles.resLabel}>分辨率</span>
            <select
              className={styles.resSelect}
              value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
            >
              {RESOLUTIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <span className={styles.resDisplay}>× {RAMP_HEIGHT}</span>
          </div>
        </div>

        {/* ─── 错误 / 成功提示 ─── */}
        {error && <div className={styles.successMsg} style={{ color: 'var(--color-danger)' }}>{error}</div>}
        {successMsg && <div className={styles.successMsg}>{successMsg}</div>}

        {/* ─── 导出区 ─── */}
        <div className={styles.actions}>
          <button
            className={styles.exportBtn}
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? '导出中...' : '导出 Ramp'}
          </button>
        </div>
      </div>
    </ToolShell>
  )
}
