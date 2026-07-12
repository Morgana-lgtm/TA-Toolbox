import { useState, useCallback, useRef } from 'react'
import styles from './DropZone.module.css'

interface DropZoneProps {
  /** 提示文字 —— 拖拽区域的主标签 */
  label: string
  /** 副标签，说明期望的通道等信息 */
  sublabel?: string
  /** 当前文件路径 */
  value: string | null
  /** 缩略图 data URL */
  previewUrl?: string
  /** 文件选择回调 */
  onChange: (filePath: string) => void
}

export default function DropZone({
  label,
  sublabel,
  value,
  previewUrl,
  onChange
}: DropZoneProps): JSX.Element {
  const [dragging, setDragging] = useState(false)
  const dragCounter = useRef(0)

  const handleClick = useCallback(async () => {
    const filePath = await window.taAPI.openFileDialog()
    if (filePath) {
      onChange(filePath)
    }
  }, [onChange])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current++
    if (dragCounter.current === 1) {
      setDragging(true)
    }
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current--
    if (dragCounter.current === 0) {
      setDragging(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragging(false)
      dragCounter.current = 0

      const files = e.dataTransfer.files
      if (files.length > 0) {
        // 在 Electron 中，拖拽文件的 path 属性可用
        const file = files[0]
        const path = (file as any).path as string
        if (path) {
          onChange(path)
        }
      }
    },
    [onChange]
  )

  const fileName = value ? value.split(/[/\\]/).pop() : null

  return (
    <div
      className={`${styles.dropZone} ${dragging ? styles.dropZoneActive : ''} ${value ? styles.hasFile : ''}`}
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      title="点击选择文件或拖拽到此处"
    >
      {value ? (
        <div className={styles.preview}>
          {previewUrl && <img className={styles.thumb} src={previewUrl} alt={label} />}
          <span className={styles.fileName}>{fileName}</span>
          <button
            className={styles.changeBtn}
            onClick={(e) => {
              e.stopPropagation()
              handleClick()
            }}
          >
            更换文件
          </button>
        </div>
      ) : (
        <>
          <span className={styles.icon}>📁</span>
          <span className={styles.label}>{label}</span>
          {sublabel && <span className={styles.sublabel}>{sublabel}</span>}
        </>
      )}
    </div>
  )
}
