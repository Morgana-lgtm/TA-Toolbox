import { NavLink } from 'react-router-dom'
import { tools } from '../../tools'
import styles from './Sidebar.module.css'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps): JSX.Element {

  // 过滤掉首页（首页不在侧边栏导航中显示，或根据设计保留）
  const navTools = tools.filter((t) => t.id !== 'home')

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
        {/* 首页链接 */}
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
        <button className={styles.collapseBtn} onClick={onToggle} title={collapsed ? '展开侧边栏' : '收起侧边栏'}>
          {collapsed ? '▶' : '◀'}
        </button>
        {!collapsed && (
          <div className={styles.footerInfo}>
            <span className={styles.version}>v1.0.0</span>
          </div>
        )}
      </div>
    </aside>
  )
}
