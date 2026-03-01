import { useState } from 'react'
import { supabase } from '../lib/supabase'

interface AddPlayerFormProps {
  onSuccess: () => void
}

export function AddPlayerForm({ onSuccess }: AddPlayerFormProps) {
  if (!supabase) {
    return (
      <p style={{ color: '#f87171' }}>
        Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to a .env file in the
        project root, then restart the dev server.
      </p>
    )
  }

  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return

    setLoading(true)
    setError(null)

    if (!supabase) return
    const { error: err } = await supabase.from('players').insert({ name: trimmed })

    setLoading(false)
    if (err) {
      setError(err.message)
      return
    }

    setName('')
    onSuccess()
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
    >
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Player name"
        style={{
          flex: 1,
          padding: '8px 16px',
          borderRadius: 8,
          backgroundColor: '#1e293b',
          border: '1px solid #475569',
          color: 'white',
        }}
        disabled={loading}
      />
      <button
        type="submit"
        disabled={loading || !name.trim()}
        style={{
          padding: '8px 16px',
          borderRadius: 8,
          backgroundColor: '#059669',
          color: 'white',
          fontWeight: 500,
          border: 'none',
          cursor: loading || !name.trim() ? 'not-allowed' : 'pointer',
          opacity: loading || !name.trim() ? 0.5 : 1,
        }}
      >
        {loading ? 'Adding…' : 'Add Player'}
      </button>
      {error && (
        <p style={{ color: '#f87171', fontSize: 14 }}>{error}</p>
      )}
    </form>
  )
}
