import { useOffline } from '../contexts/OfflineContext'

export function OfflineBanner() {
  const ctx = useOffline()
  if (!ctx) return null
  const { isOnline, pendingCount, isSyncing, syncError, sync } = ctx

  if (isOnline && pendingCount === 0) return null

  return (
    <div
      style={{
        padding: '8px 16px',
        backgroundColor: isOnline ? '#334155' : '#1e293b',
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
        {!isOnline ? (
          <>You're offline. Changes will sync when you're back online.</>
        ) : pendingCount > 0 ? (
          <>{pendingCount} change{pendingCount !== 1 ? 's' : ''} waiting to sync</>
        ) : null}
      </span>
      {!isOnline ? null : pendingCount > 0 ? (
        <button
          type="button"
          onClick={sync}
          disabled={isSyncing}
          style={{
            padding: '4px 12px',
            fontSize: 12,
            backgroundColor: '#059669',
            border: 'none',
            borderRadius: 4,
            color: 'white',
            cursor: isSyncing ? 'not-allowed' : 'pointer',
          }}
        >
          {isSyncing ? 'Syncing…' : 'Sync now'}
        </button>
      ) : null}
      {syncError && (
        <span style={{ color: '#f87171', flexBasis: '100%' }}>{syncError}</span>
      )}
    </div>
  )
}
