import { useState } from 'react'
import { Roster } from './pages/Roster'
import { Session } from './pages/Session'
import { History } from './pages/History'

type Tab = 'roster' | 'session' | 'history'

const styles = {
  app: {
    minHeight: '100vh',
    backgroundColor: '#0f172a',
    color: 'white',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  header: {
    borderBottom: '1px solid #334155',
    padding: '12px 16px',
  },
  nav: {
    display: 'flex',
    borderBottom: '1px solid #334155',
  },
  navButton: (active: boolean) => ({
    flex: 1,
    padding: '12px 16px',
    fontSize: '14px',
    fontWeight: 500,
    background: 'none',
    border: 'none',
    borderBottom: active ? '2px solid #34d399' : '2px solid transparent',
    color: active ? '#34d399' : '#94a3b8',
    cursor: 'pointer',
  }),
  main: {
    flex: 1,
    padding: 16,
    overflow: 'auto' as const,
  },
}

export default function App() {
  const [tab, setTab] = useState<Tab>('roster')

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>
          Bullpen Tracker
        </h1>
      </header>

      <nav style={styles.nav}>
        <button
          type="button"
          onClick={() => setTab('roster')}
          style={styles.navButton(tab === 'roster')}
        >
          Roster
        </button>
        <button
          type="button"
          onClick={() => setTab('session')}
          style={styles.navButton(tab === 'session')}
        >
          Session
        </button>
        <button
          type="button"
          onClick={() => setTab('history')}
          style={styles.navButton(tab === 'history')}
        >
          History
        </button>
      </nav>

      <main style={styles.main}>
        {tab === 'roster' && <Roster />}
        {tab === 'session' && <Session />}
        {tab === 'history' && <History />}
      </main>
    </div>
  )
}
