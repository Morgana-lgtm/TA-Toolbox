import { useState, useCallback, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { tools } from '../../tools'
import styles from './Sidebar.module.css'

function getTheme(): 'light' | 'dark' {
  if (typeof document === 'undefined') return 'light'
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'
}

function setTheme(theme: 'light' | 'dark'): void {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark')
  } else {
    document.documentElement.removeAttribute('data-theme')
  }
  localStorage.setItem('ta-toolbox-theme', theme)
}

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps): JSX.Element {
  const [theme, setThemeState] = useState<'light' | 'dark'>(getTheme)
  const [version, setVersion] = useState('')

  useEffect(() => {
    window.taAPI.getVersion().then(setVersion).catch(() => setVersion(''))
  }, [])

  const navTools = tools.filter((t) => t.id !== 'home')

  const toggleTheme = useCallback(() => {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    setThemeState(next)
  }, [theme])

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
      {/* Logo 区 */}
      <div className={styles.brand}>
        <span className={styles.logo}>🛠</span>
        {!collapsed && (
          <div className={styles.brandText}>
            <span className={styles.brandName}>Momo's TA Toolbox</span>
            <span className={styles.brandDesc}>技术美术工具集</span>
          </div>
        )}
      </div>

      {/* 导航菜单 */}
      <nav className={styles.nav}>
        <NavLink
          to="/"
          className={({ isActive }) =>
            `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
          }
          title="首页"
        >
          <span className={styles.navIcon}>🏠</span>
          {!collapsed && <span className={styles.navLabel}>首页</span>}
        </NavLink>

        <div className={styles.divider} />

        {navTools.map((tool) => (
          <NavLink
            key={tool.id}
            to={tool.path}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
            }
            title={tool.name}
          >
            <span className={styles.navIcon}>{tool.icon}</span>
            {!collapsed && (
              <div className={styles.navText}>
                <span className={styles.navLabel}>{tool.name}</span>
                <span className={styles.navDesc}>{tool.description}</span>
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* 底部操作区 */}
      <div className={styles.footer}>
        <button
          className={styles.collapseBtn}
          onClick={onToggle}
          title={collapsed ? '展开侧边栏' : '收起侧边栏'}
        >
          {collapsed ? '▶' : '◀'}
        </button>

        <button
          className={styles.themeBtn}
          onClick={toggleTheme}
          title={theme === 'light' ? '切换暗色主题' : '切换亮色主题'}
        >
          {theme === 'light' ? '🌙' : '☀'}
        </button>

        {!collapsed && (
          <div className={styles.footerInfo}>
            <span className={styles.version}>v{version || '0.1.0'}</span>
          </div>
        )}
      </div>
    </aside>
  )
}
