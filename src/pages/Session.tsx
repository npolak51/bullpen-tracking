import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import {
  isOnline,
  addToQueue,
} from '../lib/offline'
import { useOffline } from '../contexts/OfflineContext'
import { useResumableSession } from '../contexts/ResumableSessionContext'
import { PlayerPicker } from '../components/PlayerPicker'
import { AddPitchForm } from '../components/AddPitchForm'
import { PitchListItem } from '../components/PitchListItem'
import type { Player } from '../types/database'
import type { PitchType } from '../types/database'

interface LoggedPitch {
  id: string
  pitch_type: PitchType
  intended_cells: { row: number; col: number }[]
  actual_x: number
  actual_y: number
  velocity: number | null
  sequence_order: number
}

export function Session() {
  const offline = useOffline()
  const { sessionToResume, clearSessionToResume } = useResumableSession() ?? {}
  const [player, setPlayer] = useState<Player | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [pitches, setPitches] = useState<LoggedPitch[]>([])
  const [notes, setNotes] = useState('')
  const [starting, setStarting] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resuming, setResuming] = useState(false)

  // Load and continue a session from History
  useEffect(() => {
    if (!sessionToResume || !supabase || !offline?.isOnline) return

    const toResume = sessionToResume
    const db = supabase

    void (async () => {
      setResuming(true)
      setError(null)
      const { error: err } = await db
        .from('sessions')
        .update({ completed_at: null })
        .eq('id', toResume.sessionId)

      setResuming(false)
      if (err) {
        setError(err.message)
        return
      }

      setPlayer(toResume.player)
      setSessionId(toResume.sessionId)
      setPitches(
        toResume.pitches.map((p) => ({
          id: p.id,
          pitch_type: p.pitch_type,
          intended_cells: p.intended_cells ?? [],
          actual_x: Number(p.actual_x),
          actual_y: Number(p.actual_y),
          velocity: p.velocity,
          sequence_order: p.sequence_order,
        }))
      )
      setNotes(toResume.notes ?? '')
      clearSessionToResume?.()
    })()
  }, [sessionToResume, clearSessionToResume, offline?.isOnline])

  async function handleStartSession() {
    if (!player) return

    setStarting(true)
    setError(null)

    async function startOffline() {
      if (!player) return
      const tempSessionId = crypto.randomUUID()
      await addToQueue({
        type: 'start_session',
        tempId: tempSessionId,
        data: { player_id: player.id },
      })
      setStarting(false)
      setSessionId(tempSessionId)
      setPitches([])
      setNotes('')
      offline?.refreshPendingCount()
    }

    if (!isOnline()) {
      await startOffline()
      return
    }

    if (!supabase) return
    try {
      const { data, error: err } = await supabase
        .from('sessions')
        .insert({ player_id: player.id })
        .select('id')
        .single()

      setStarting(false)
      if (err) {
        setError(err.message)
        return
      }
      setSessionId(data.id)
      setPitches([])
      setNotes('')
    } catch (e) {
      if (e instanceof TypeError && (e.message === 'Load failed' || e.message === 'Failed to fetch')) {
        await startOffline()
      } else {
        setStarting(false)
        setError(e instanceof Error ? e.message : 'Something went wrong')
      }
    }
  }

  async function handleAddPitch(pitch: {
    pitch_type: PitchType
    intended_cells: { row: number; col: number }[]
    actual_x: number
    actual_y: number
    velocity: number | null
  }) {
    if (!sessionId) return

    const sequence_order = pitches.length + 1
    const pitchData = {
      session_id: sessionId,
      pitch_type: pitch.pitch_type,
      intended_cells: pitch.intended_cells,
      actual_x: pitch.actual_x,
      actual_y: pitch.actual_y,
      velocity: pitch.velocity,
      sequence_order,
    }

    async function addPitchOffline() {
      await addToQueue({ type: 'add_pitch', data: pitchData })
      setPitches((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          pitch_type: pitch.pitch_type,
          intended_cells: pitch.intended_cells,
          actual_x: pitch.actual_x,
          actual_y: pitch.actual_y,
          velocity: pitch.velocity,
          sequence_order,
        },
      ])
      offline?.refreshPendingCount()
    }

    if (!isOnline()) {
      await addPitchOffline()
      return
    }

    if (!supabase) return
    try {
      const { data, error: err } = await supabase
        .from('pitches')
        .insert(pitchData)
        .select('id, pitch_type, intended_cells, actual_x, actual_y, velocity, sequence_order')
        .single()

      if (err) {
        setError(err.message)
        return
      }
      setPitches((prev) => [...prev, { ...data, id: data.id }])
    } catch (e) {
      if (e instanceof TypeError && (e.message === 'Load failed' || e.message === 'Failed to fetch')) {
        await addPitchOffline()
      } else {
        setError(e instanceof Error ? e.message : 'Something went wrong')
      }
    }
  }

  async function handleDeletePitch(pitchId: string) {
    if (!supabase || !isOnline()) return
    await supabase.from('pitches').delete().eq('id', pitchId)
    setPitches((prev) => prev.filter((p) => p.id !== pitchId))
  }

  async function handleUpdatePitchVelocity(pitchId: string, velocity: number | null) {
    if (!supabase || !isOnline()) return
    const { error: err } = await supabase
      .from('pitches')
      .update({ velocity })
      .eq('id', pitchId)
    if (!err) {
      setPitches((prev) =>
        prev.map((p) => (p.id === pitchId ? { ...p, velocity } : p))
      )
    }
  }

  async function handleUpdatePitchLocation(
    pitchId: string,
    actual_x: number,
    actual_y: number
  ) {
    if (!supabase || !isOnline()) return
    const { error: err } = await supabase
      .from('pitches')
      .update({ actual_x, actual_y })
      .eq('id', pitchId)
    if (!err) {
      setPitches((prev) =>
        prev.map((p) =>
          p.id === pitchId ? { ...p, actual_x, actual_y } : p
        )
      )
    }
  }

  async function handleUpdatePitchType(pitchId: string, pitch_type: PitchType) {
    if (!supabase || !isOnline()) return
    const { error: err } = await supabase
      .from('pitches')
      .update({ pitch_type })
      .eq('id', pitchId)
    if (!err) {
      setPitches((prev) =>
        prev.map((p) => (p.id === pitchId ? { ...p, pitch_type } : p))
      )
    }
  }

  async function handleCompleteSession() {
    if (!sessionId) return

    setCompleting(true)
    setError(null)

    async function completeOffline() {
      if (!sessionId) return
      await addToQueue({
        type: 'complete_session',
        data: { session_id: sessionId, notes: notes.trim() || null },
      })
      setCompleting(false)
      setSessionId(null)
      setPlayer(null)
      setPitches([])
      setNotes('')
      offline?.refreshPendingCount()
    }

    if (!isOnline()) {
      await completeOffline()
      return
    }

    if (!supabase) return
    try {
      const { error: err } = await supabase
        .from('sessions')
        .update({
          completed_at: new Date().toISOString(),
          notes: notes.trim() || null,
        })
        .eq('id', sessionId)

      setCompleting(false)
      if (err) {
        setError(err.message)
        return
      }

      setSessionId(null)
      setPlayer(null)
      setPitches([])
      setNotes('')
    } catch (e) {
      if (e instanceof TypeError && (e.message === 'Load failed' || e.message === 'Failed to fetch')) {
        await completeOffline()
      } else {
        setCompleting(false)
        setError(e instanceof Error ? e.message : 'Something went wrong')
      }
    }
  }

  if (!supabase) {
    return (
      <div style={{ maxWidth: 512, margin: '0 auto' }}>
        <p style={{ color: '#f87171' }}>
          Configure Supabase in .env to use sessions.
        </p>
      </div>
    )
  }

  if (!sessionId) {
    if (sessionToResume && resuming) {
      return (
        <div style={{ maxWidth: 512, margin: '0 auto', color: '#94a3b8' }}>
          Resuming session…
        </div>
      )
    }
    return (
      <div style={{ maxWidth: 512, margin: '0 auto' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: 16 }}>
          New Session
        </h2>
        <div style={{ marginBottom: 16 }}>
          <PlayerPicker
            selectedId={player?.id ?? null}
            onSelect={setPlayer}
          />
        </div>
        {error && (
          <p style={{ color: '#f87171', marginBottom: 16 }}>{error}</p>
        )}
        <button
          type="button"
          onClick={handleStartSession}
          disabled={!player || starting}
          style={{
            padding: '12px 24px',
            borderRadius: 8,
            backgroundColor: player && !starting ? '#059669' : '#334155',
            color: 'white',
            fontWeight: 600,
            border: 'none',
            cursor: player && !starting ? 'pointer' : 'not-allowed',
            opacity: player && !starting ? 1 : 0.6,
          }}
        >
          {starting ? 'Starting…' : 'Start Session'}
        </button>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <h2 style={{ fontSize: '20px', fontWeight: 600 }}>
          Session: {player?.name}
        </h2>
        <button
          type="button"
          onClick={handleCompleteSession}
          disabled={completing}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            backgroundColor: completing ? '#334155' : '#dc2626',
            color: 'white',
            fontWeight: 600,
            border: 'none',
            cursor: completing ? 'not-allowed' : 'pointer',
          }}
        >
          {completing ? 'Completing…' : 'Complete Session'}
        </button>
      </div>

      {error && (
        <p style={{ color: '#f87171', marginBottom: 16 }}>{error}</p>
      )}

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 14, marginBottom: 6, color: '#94a3b8' }}>
          Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional session notes…"
          rows={3}
          style={{
            width: '100%',
            maxWidth: 400,
            padding: '10px 12px',
            borderRadius: 8,
            backgroundColor: '#1e293b',
            border: '1px solid #475569',
            color: 'white',
            fontSize: 14,
            resize: 'vertical',
            boxSizing: 'border-box',
          }}
        />
      </div>

      <AddPitchForm onAdd={handleAddPitch} />

      {pitches.length > 0 && (
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
            Pitches ({pitches.length})
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {pitches.map((pitch) => (
              <PitchListItem
                key={pitch.id}
                pitch={pitch}
                onDelete={() => handleDeletePitch(pitch.id)}
                onUpdateVelocity={(v) => handleUpdatePitchVelocity(pitch.id, v)}
                onUpdateLocation={(x, y) =>
                  handleUpdatePitchLocation(pitch.id, x, y)
                }
                onUpdatePitchType={(type) =>
                  handleUpdatePitchType(pitch.id, type)
                }
                offline={!isOnline()}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
