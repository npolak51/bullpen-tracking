import { usePwaUpdate } from '../contexts/PwaUpdateContext'

export function UpdateBanner() {
  const ctx = usePwaUpdate()
  if (!ctx?.updateAvailable) return null

  return (
    <div
      style={{
        padding: '8px 16px',
        backgroundColor: '#334155',
        borderBottom: '1px solid #475569',
        fontSize: 14,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        flexWrap: 'wrap',
      }}
    >
      <span style={{ color: '#94a3b8' }}>
        Update available. Reload to get the latest version.
      </span>
      <button
        type="button"
        onClick={ctx.reload}
        style={{
          padding: '6px 14px',
          fontSize: 13,
          backgroundColor: '#059669',
          border: 'none',
          borderRadius: 4,
          color: 'white',
          cursor: 'pointer',
          fontWeight: 600,
        }}
      >
        Reload
      </button>
    </div>
  )
}
