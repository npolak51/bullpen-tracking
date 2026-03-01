import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Player } from '../types/database'

interface PlayerPickerProps {
  onSelect: (player: Player) => void
  selectedId: string | null
}

export function PlayerPicker({ onSelect, selectedId }: PlayerPickerProps) {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      setError('Supabase not configured.')
      return
    }

    async function fetchPlayers() {
      const { data, error: err } = await supabase!
        .from('players')
        .select('id, name, created_at')
        .order('name')

      setLoading(false)
      if (err) {
        setError(err.message)
        return
      }
      setPlayers(data ?? [])
    }

    fetchPlayers()
  }, [])

  if (loading) {
    return <div style={{ color: '#94a3b8' }}>Loading players…</div>
  }

  if (error) {
    return <div style={{ color: '#f87171' }}>{error}</div>
  }

  if (players.length === 0) {
    return (
      <div style={{ color: '#94a3b8' }}>
        No players in roster. Add players on the Roster tab first.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label style={{ fontSize: 14, color: '#94a3b8' }}>Select player</label>
      <select
        value={selectedId ?? ''}
        onChange={(e) => {
          const id = e.target.value
          const player = players.find((p) => p.id === id)
          if (player) onSelect(player)
        }}
        style={{
          padding: '12px 16px',
          borderRadius: 8,
          backgroundColor: '#1e293b',
          border: '1px solid #475569',
          color: 'white',
          fontSize: 16,
          cursor: 'pointer',
        }}
      >
        <option value="">Choose a player…</option>
        {players.map((player) => (
          <option key={player.id} value={player.id}>
            {player.name}
          </option>
        ))}
      </select>
    </div>
  )
}
