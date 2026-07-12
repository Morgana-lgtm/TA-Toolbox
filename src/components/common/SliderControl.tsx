import styles from './SliderControl.module.css'

interface SliderControlProps {
  /** 标签文字 */
  label: string
  /** 当前值 */
  value: number
  /** 值变化回调 */
  onChange: (value: number) => void
  /** 最小值 */
  min?: number
  /** 最大值 */
  max?: number
  /** 步长 */
  step?: number
  /** 自定义显示格式 */
  formatValue?: (value: number) => string
}

export default function SliderControl({
  label,
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.01,
  formatValue
}: SliderControlProps): JSX.Element {
  const display = formatValue ? formatValue(value) : value.toFixed(2)

  return (
    <div className={styles.control}>
      <label className={styles.label}>{label}</label>
      <input
        className={styles.slider}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
      <span className={styles.value}>{display}</span>
    </div>
  )
}
