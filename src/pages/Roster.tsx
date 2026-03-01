import { useState } from 'react'
import { AddPlayerForm } from '../components/AddPlayerForm'
import { PlayerList } from '../components/PlayerList'

export function Roster() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  return (
    <div style={{ maxWidth: 512, margin: '0 auto' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: 16 }}>
        Roster
      </h2>
      <div style={{ marginBottom: 24 }}>
        <AddPlayerForm onSuccess={() => setRefreshTrigger((n) => n + 1)} />
      </div>
      <PlayerList
        refreshTrigger={refreshTrigger}
        onPlayerDeleted={() => setRefreshTrigger((n) => n + 1)}
      />
    </div>
  )
}
