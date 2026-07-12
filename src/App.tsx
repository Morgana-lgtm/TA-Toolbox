import { Suspense, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import AppLayout from './components/Layout/AppLayout'
import { ToastProvider } from './components/common/Toast'
import { tools } from './tools'

/** 初始化主题 */
function useTheme(): void {
  useEffect(() => {
    const saved = localStorage.getItem('ta-toolbox-theme')
    if (saved === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark')
    } else if (!saved) {
      // 跟随系统偏好
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.setAttribute('data-theme', 'dark')
      }
    }
  }, [])
}

export default function App(): JSX.Element {
  useTheme()

  return (
    <ToastProvider>
      <AppLayout>
        <Suspense fallback={<div className="page-loading">加载中...</div>}>
          <Routes>
            {tools.map((tool) => (
              <Route
                key={tool.id}
                path={tool.path}
                element={<tool.component />}
              />
            ))}
          </Routes>
        </Suspense>
      </AppLayout>
    </ToastProvider>
  )
}
