import ToolShell from '../../components/ToolShell'

export default function TexturePreviewPage(): JSX.Element {
  return (
    <ToolShell toolId="texture-preview">
      <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--color-text-tertiary)' }}>
        <p style={{ fontSize: 48, margin: '0 0 16px' }}>🔍</p>
        <p style={{ fontSize: 16, margin: 0 }}>贴图预览将在 Phase 2 实现</p>
        <p style={{ fontSize: 13, margin: '8px 0 0' }}>
          支持查看 RGBA 各通道、分辨率、格式、位深等基本信息
        </p>
      </div>
    </ToolShell>
  )
}
