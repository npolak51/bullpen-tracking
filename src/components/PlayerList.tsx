import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Player } from '../types/database'

interface PlayerListProps {
  refreshTrigger: number
  onPlayerDeleted?: () => void
}

export function PlayerList({ refreshTrigger, onPlayerDeleted }: PlayerListProps) {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      setError('Supabase not configured. Add .env with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
      return
    }

    async function fetchPlayers() {
      setLoading(true)
      setError(null)

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
  }, [refreshTrigger])

  if (loading) {
    return (
      <div style={{ color: '#94a3b8', padding: 32, textAlign: 'center' }}>
        Loading roster…
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ color: '#f87171', padding: 32, textAlign: 'center' }}>
        Failed to load roster: {error}
      </div>
    )
  }

  if (players.length === 0) {
    return (
      <div style={{ color: '#94a3b8', padding: 32, textAlign: 'center' }}>
        No players yet. Add one above to get started.
      </div>
    )
  }

  async function handleDeletePlayer(playerId: string) {
    if (!supabase) return
    if (!confirm('Remove this player from the roster? Their sessions and pitches will also be deleted.')) return

    const { error: err } = await supabase.from('players').delete().eq('id', playerId)
    if (err) {
      setError(err.message)
      return
    }
    onPlayerDeleted?.()
  }

  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {players.map((player) => (
        <li
          key={player.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            backgroundColor: 'rgba(30, 41, 59, 0.5)',
            borderRadius: 8,
            marginBottom: 8,
            fontWeight: 500,
          }}
        >
          <span>{player.name}</span>
          <button
            type="button"
            onClick={() => handleDeletePlayer(player.id)}
            style={{
              padding: '4px 8px',
              fontSize: 12,
              backgroundColor: 'transparent',
              border: '1px solid #dc2626',
              borderRadius: 4,
              color: '#dc2626',
              cursor: 'pointer',
            }}
          >
            Remove
          </button>
        </li>
      ))}
    </ul>
  )
}
