import { useNavigate } from 'react-router-dom'
import { getTool } from '../tools'
import styles from './ToolShell.module.css'

interface ToolShellProps {
  /** 工具 ID，用于获取名称和描述 */
  toolId: string
  /** 标题栏右侧操作按钮 */
  actions?: React.ReactNode
  children: React.ReactNode
}

/**
 * 工具页面统一外壳
 * 提供标题栏 + 返回按钮，保证所有工具页面视觉一致
 */
export default function ToolShell({ toolId, actions, children }: ToolShellProps): JSX.Element {
  const navigate = useNavigate()
  const tool = getTool(toolId)

  const handleBack = () => {
    navigate('/')
  }

  return (
    <div className={styles.shell}>
      {/* 标题栏 */}
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={handleBack} title="返回首页">
          ← 返回
        </button>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>{tool?.name ?? toolId}</h1>
          {tool?.description && (
            <span className={styles.subtitle}>{tool.description}</span>
          )}
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </header>

      {/* 内容区 */}
      <div className={styles.body}>{children}</div>
    </div>
  )
}
