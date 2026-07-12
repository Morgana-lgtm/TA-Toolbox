import { Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import AppLayout from './components/Layout/AppLayout'
import { tools } from './tools'

export default function App(): JSX.Element {
  return (
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
  )
}
