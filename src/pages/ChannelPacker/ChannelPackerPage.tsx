import ToolShell from '../../components/ToolShell'

export default function ChannelPackerPage(): JSX.Element {
  return (
    <ToolShell toolId="channel-packer">
      <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--color-text-tertiary)' }}>
        <p style={{ fontSize: 48, margin: '0 0 16px' }}>📦</p>
        <p style={{ fontSize: 16, margin: 0 }}>ORM 打包功能将在 Phase 2 实现</p>
        <p style={{ fontSize: 13, margin: '8px 0 0' }}>
          支持将 AO、Metallic、Roughness 合并为单张 ORM 贴图
        </p>
      </div>
    </ToolShell>
  )
}
