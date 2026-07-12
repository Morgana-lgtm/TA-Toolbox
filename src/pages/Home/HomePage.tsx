import { useNavigate } from 'react-router-dom'
import { tools } from '../../tools'
import styles from './HomePage.module.css'

export default function HomePage(): JSX.Element {
  const navigate = useNavigate()

  // 过滤掉首页自身
  const toolCards = tools.filter((t) => t.id !== 'home')

  return (
    <div className={styles.home}>
      {/* Hero 区域 */}
      <div className={styles.hero}>
        <h1 className={styles.heroTitle}>Momo's TA Toolbox</h1>
        <p className={styles.heroDesc}>技术美术日常工具集 — 高效、离线、可扩展</p>
      </div>

      {/* 工具卡片网格 */}
      <div className={styles.grid}>
        {toolCards.map((tool) => (
          <button
            key={tool.id}
            className={styles.card}
            onClick={() => navigate(tool.path)}
          >
            <span className={styles.cardIcon}>{tool.icon}</span>
            <div className={styles.cardBody}>
              <span className={styles.cardTitle}>{tool.name}</span>
              <span className={styles.cardDesc}>{tool.description}</span>
            </div>
            <span className={styles.cardArrow}>→</span>
          </button>
        ))}
      </div>

      {/* 底部占位提示 */}
      <p className={styles.hint}>更多工具即将加入…</p>
    </div>
  )
}
