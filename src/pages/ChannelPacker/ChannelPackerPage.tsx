import { useState, useCallback } from 'react'
import ToolShell from '../../components/ToolShell'
import DropZone from '../../components/common/DropZone'
import ImageCanvas from '../../components/common/ImageCanvas'
import { useToast } from '../../components/common/Toast'
import styles from './ChannelPackerPage.module.css'

export default function ChannelPackerPage(): JSX.Element {
  const [aoPath, setAoPath] = useState<string | null>(null)
  const [metallicPath, setMetallicPath] = useState<string | null>(null)
  const [roughnessPath, setRoughnessPath] = useState<string | null>(null)

  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewSize, setPreviewSize] = useState<{ width: number; height: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [outputFormat, setOutputFormat] = useState('png')
  const [linearizeMetallic, setLinearizeMetallic] = useState(false)
  const [linearizeRoughness, setLinearizeRoughness] = useState(false)

  const { toast } = useToast()

  const packOptions = { linearizeMetallic, linearizeRoughness }

  // 生成预览
  const handlePreview = useCallback(async () => {
    setError(null)
    setSuccessMsg(null)
    setPreviewing(true)

    try {
      const result = await window.taAPI.packORM(
        aoPath, metallicPath, roughnessPath, '', packOptions
      )

      if (result.success && result.dataUrl) {
        setPreviewUrl(result.dataUrl)
        if (result.width && result.height) {
          setPreviewSize({ width: result.width, height: result.height })
        }
      } else {
        const msg = result.error || '预览失败'
        // 分辨率不匹配：同时显示内联错误和 toast 警告
        if (msg.includes('分辨率') || msg.includes('resolution')) {
          setError(msg)
          toast('warning', msg)
        } else {
          toast('error', '预览失败: ' + msg)
        }
        setPreviewUrl(null)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '预览出错'
      toast('error', '预览失败: ' + msg)
      setPreviewUrl(null)
    } finally {
      setPreviewing(false)
    }
  }, [aoPath, metallicPath, roughnessPath, linearizeMetallic, linearizeRoughness, toast])

  // 导出 ORM
  const handleExport = useCallback(async () => {
    if (!aoPath && !metallicPath && !roughnessPath) {
      setError('至少需要提供一张输入图')
      return
    }

    setError(null)
    setSuccessMsg(null)
    setExporting(true)

    try {
      const savePath = await window.taAPI.saveFileDialog({
        defaultPath: 'ORM.png',
        filters: [{ name: outputFormat.toUpperCase(), extensions: [outputFormat] }]
      })

      if (!savePath) {
        setExporting(false)
        return
      }

      const result = await window.taAPI.packORM(
        aoPath, metallicPath, roughnessPath, savePath, packOptions
      )

      if (result.success) {
        const fileName = savePath.split(/[/\\]/).pop()
        toast('success', `导出成功: ${fileName}`)
        setSuccessMsg(`导出成功: ${fileName}`)
      } else {
        const msg = result.error || '导出失败'
        // 分辨率不匹配：同时显示内联错误和 toast 警告
        if (msg.includes('分辨率') || msg.includes('resolution')) {
          setError(msg)
          toast('warning', msg)
        } else {
          toast('error', '导出失败: ' + msg)
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '导出出错'
      toast('error', '导出失败: ' + msg)
    } finally {
      setExporting(false)
    }
  }, [aoPath, metallicPath, roughnessPath, outputFormat, linearizeMetallic, linearizeRoughness, toast])

  const hasAnyInput = !!(aoPath || metallicPath || roughnessPath)

  return (
    <ToolShell toolId="channel-packer">
      <div className={styles.page}>
        {/* ─── 三列输入区 ─── */}
        <div className={styles.inputs}>
          <DropZone
            label="AO 贴图"
            sublabel="B 通道"
            value={aoPath}
            onChange={(p) => { setAoPath(p); setError(null); setSuccessMsg(null) }}
          />
          <DropZone
            label="Metallic 贴图"
            sublabel="R 通道"
            value={metallicPath}
            onChange={(p) => { setMetallicPath(p); setError(null); setSuccessMsg(null) }}
          />
          <DropZone
            label="Roughness 贴图"
            sublabel="G 通道"
            value={roughnessPath}
            onChange={(p) => { setRoughnessPath(p); setError(null); setSuccessMsg(null) }}
          />
        </div>

        {/* ─── 错误 / 成功提示 ─── */}
        {error && <div className={styles.error}>{error}</div>}
        {successMsg && <div className={styles.successMsg}>{successMsg}</div>}

        {/* ─── 预览区 ─── */}
        <div className={styles.previewSection}>
          <div className={styles.previewCanvas}>
            <ImageCanvas
              src={previewUrl}
              imgWidth={previewSize?.width}
              imgHeight={previewSize?.height}
              containerHeight="360px"
            />
            <div style={{ marginTop: 12, textAlign: 'center' }}>
              <button
                onClick={handlePreview}
                disabled={!hasAnyInput || previewing}
                style={{
                  padding: '8px 24px',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--color-bg-surface)',
                  color: hasAnyInput ? 'var(--color-accent)' : 'var(--color-text-tertiary)',
                  fontSize: '13px',
                  cursor: hasAnyInput ? 'pointer' : 'default',
                  fontFamily: 'inherit'
                }}
              >
                {previewing ? '生成中...' : '生成预览'}
              </button>
            </div>
          </div>

          {/* ─── 侧栏 ─── */}
          <div className={styles.sidePanel}>
            <div className={styles.channelInfo}>
              <h3 className={styles.channelTitle}>通道映射</h3>
              <div className={styles.channelRow}>
                <span className={`${styles.channelDot} ${styles.r}`} />
                <span>R → Metallic</span>
              </div>
              <div className={styles.channelRow}>
                <span className={`${styles.channelDot} ${styles.g}`} />
                <span>G → Roughness</span>
              </div>
              <div className={styles.channelRow}>
                <span className={`${styles.channelDot} ${styles.b}`} />
                <span>B → AO</span>
              </div>
            </div>

            {/* ─── 色彩空间选项 ─── */}
            <div className={styles.colorSpace}>
              <h3 className={styles.channelTitle}>色彩空间</h3>
              <label className={styles.checkRow}>
                <input
                  type="checkbox"
                  checked={linearizeMetallic}
                  onChange={(e) => setLinearizeMetallic(e.target.checked)}
                />
                <span>Metallic sRGB→Linear</span>
              </label>
              <label className={styles.checkRow}>
                <input
                  type="checkbox"
                  checked={linearizeRoughness}
                  onChange={(e) => setLinearizeRoughness(e.target.checked)}
                />
                <span>Roughness sRGB→Linear</span>
              </label>
              <p className={styles.checkHint}>
                Metallic / Roughness 数据通常应为线性空间。
                若源贴图是 sRGB，勾选后自动做 gamma 2.2 校正。
              </p>
            </div>

            <label style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
              输出格式
            </label>
            <select
              className={styles.formatSelect}
              value={outputFormat}
              onChange={(e) => setOutputFormat(e.target.value)}
            >
              <option value="png">PNG</option>
              <option value="tiff">TIFF</option>
              <option value="webp">WebP</option>
            </select>

            <button
              className={styles.exportBtn}
              onClick={handleExport}
              disabled={!hasAnyInput || exporting}
            >
              {exporting ? '导出中...' : '导出 ORM'}
            </button>
          </div>
        </div>
      </div>
    </ToolShell>
  )
}
