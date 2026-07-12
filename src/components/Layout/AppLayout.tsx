import { useState, type ReactNode } from 'react'
import Sidebar from './Sidebar'
import styles from './AppLayout.module.css'

interface AppLayoutProps {
  children: ReactNode
}

export default function AppLayout({ children }: AppLayoutProps): JSX.Element {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className={styles.layout}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <main className={`${styles.content} ${collapsed ? styles.contentExpanded : ''}`}>
        {children}
      </main>
    </div>
  )
}
