import ToolShell from '../../components/ToolShell'

export default function RampGeneratorPage(): JSX.Element {
  return (
    <ToolShell toolId="ramp-generator">
      <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--color-text-tertiary)' }}>
        <p style={{ fontSize: 48, margin: '0 0 16px' }}>🎨</p>
        <p style={{ fontSize: 16, margin: 0 }}>Ramp 生成器将在 Phase 2 实现</p>
        <p style={{ fontSize: 13, margin: '8px 0 0' }}>
          支持通过滑块调节 Shadow Position、Softness、Contrast 生成 Toon Ramp 纹理
        </p>
      </div>
    </ToolShell>
  )
}
