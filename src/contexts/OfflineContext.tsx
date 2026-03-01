import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react'
import {
  isOnline,
  useOnlineStatus,
  getQueue,
  syncQueue,
} from '../lib/offline'

interface OfflineContextValue {
  isOnline: boolean
  pendingCount: number
  isSyncing: boolean
  syncError: string | null
  sync: () => Promise<void>
  refreshPendingCount: () => Promise<void>
}

const OfflineContext = createContext<OfflineContextValue | null>(null)

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const [online, setOnline] = useState(isOnline())
  const [pendingCount, setPendingCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)

  const refreshPendingCount = useCallback(async () => {
    const queue = await getQueue()
    setPendingCount(queue.length)
  }, [])


  useEffect(() => {
    refreshPendingCount()
  }, [refreshPendingCount])

  const sync = useCallback(async () => {
    setIsSyncing(true)
    setSyncError(null)
    const result = await syncQueue()
    setIsSyncing(false)
    if (result.ok) {
      await refreshPendingCount()
    } else {
      setSyncError(result.error ?? 'Sync failed')
    }
  }, [refreshPendingCount])

  const syncRef = useRef(sync)
  syncRef.current = sync

  useOnlineStatus((on) => {
    setOnline(on)
    if (on) {
      refreshPendingCount().then(() => {})
      getQueue().then((q) => {
        if (q.length > 0) syncRef.current()
      })
    }
  })

  const value: OfflineContextValue = {
    isOnline: online,
    pendingCount,
    isSyncing,
    syncError,
    sync,
    refreshPendingCount,
  }

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  )
}

export function useOffline() {
  const ctx = useContext(OfflineContext)
  return ctx
}
