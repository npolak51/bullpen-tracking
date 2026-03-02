import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import type { Player } from '../types/database'
import type { Pitch } from '../types/database'

export interface SessionToResume {
  sessionId: string
  player: Player
  pitches: Pick<Pitch, 'id' | 'pitch_type' | 'intended_cells' | 'actual_x' | 'actual_y' | 'velocity' | 'sequence_order'>[]
  notes: string
}

interface ResumableSessionContextValue {
  sessionToResume: SessionToResume | null
  resumeSession: (data: SessionToResume) => void
  clearSessionToResume: () => void
  setActiveTab: (tab: 'roster' | 'session' | 'history') => void
}

const ResumableSessionContext = createContext<ResumableSessionContextValue | null>(
  null
)

export function ResumableSessionProvider({
  children,
  onTabChange,
}: {
  children: ReactNode
  onTabChange: (tab: 'roster' | 'session' | 'history') => void
}) {
  const [sessionToResume, setSessionToResume] = useState<SessionToResume | null>(null)

  const resumeSession = useCallback(
    (data: SessionToResume) => {
      setSessionToResume(data)
      onTabChange('session')
    },
    [onTabChange]
  )

  const clearSessionToResume = useCallback(() => {
    setSessionToResume(null)
  }, [])

  const setActiveTab = useCallback(
    (tab: 'roster' | 'session' | 'history') => {
      onTabChange(tab)
    },
    [onTabChange]
  )

  return (
    <ResumableSessionContext.Provider
      value={{
        sessionToResume,
        resumeSession,
        clearSessionToResume,
        setActiveTab,
      }}
    >
      {children}
    </ResumableSessionContext.Provider>
  )
}

export function useResumableSession() {
  const ctx = useContext(ResumableSessionContext)
  return ctx
}
