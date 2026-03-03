import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useResumableSession } from '../contexts/ResumableSessionContext'
import { StrikeZoneView } from '../components/StrikeZoneView'
import { getAccuracy, isStrike } from '../lib/pitchUtils'
import {
  BUILT_IN_TYPES,
  getPitchTypeColor,
  getPitchTypeLabel,
} from '../lib/pitchTypes'
import { useCustomPitchTypes } from '../contexts/CustomPitchTypesContext'
import type { Player } from '../types/database'
import type { Session } from '../types/database'
import type { Pitch, PitchType } from '../types/database'

type ViewMode = 'sessions' | 'composite' | 'combine'

const FASTBALL_TYPES: PitchType[] = ['four_seam', 'two_seam']

function isFastball(pitch_type: PitchType): boolean {
  return FASTBALL_TYPES.includes(pitch_type)
}

interface PitchTypeStats {
  pitch_type: PitchType
  count: number
  accuracyPct: number
  avgVelocity: number | null
  topVelocity: number | null
  strikePct: number
}

function computePitchTypeStats(pitches: Pitch[]): PitchTypeStats[] {
  const byType = new Map<PitchType, Pitch[]>()
  for (const p of pitches) {
    const list = byType.get(p.pitch_type) ?? []
    list.push(p)
    byType.set(p.pitch_type, list)
  }

  // Built-in first, then custom (alphabetically)
  const customTypes = Array.from(byType.keys()).filter(
    (t) => !BUILT_IN_TYPES.includes(t as (typeof BUILT_IN_TYPES)[number])
  )
  customTypes.sort()
  const types: PitchType[] = [
    ...BUILT_IN_TYPES.filter((t) => byType.has(t)),
    ...customTypes,
  ]

  return types
    .map((pitch_type) => {
      const list = byType.get(pitch_type)!
      const accuracies = list.map((p) =>
        getAccuracy(p.intended_cells ?? [], Number(p.actual_x), Number(p.actual_y))
      )
      const velocities = list
        .map((p) => p.velocity)
        .filter((v): v is number => v != null)
      const strikes = list.filter((p) =>
        isStrike(Number(p.actual_x), Number(p.actual_y))
      )

      const topVelocity =
        velocities.length > 0
          ? Math.round(Math.max(...velocities) * 10) / 10
          : null

      return {
        pitch_type,
        count: list.length,
        accuracyPct:
          accuracies.length > 0
            ? Math.round(
                accuracies.reduce((a, b) => a + b, 0) / accuracies.length
              )
            : 0,
        avgVelocity:
          velocities.length > 0
            ? Math.round(
                (velocities.reduce((a, b) => a + b, 0) / velocities.length) * 10
              ) / 10
            : null,
        topVelocity,
        strikePct:
          list.length > 0
            ? Math.round((strikes.length / list.length) * 100)
            : 0,
      }
    })
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function History() {
  const { customTypes } = useCustomPitchTypes()
  const { resumeSession } = useResumableSession() ?? {}
  const [players, setPlayers] = useState<Player[]>([])
  const [sessions, setSessions] = useState<(Session & { player_name: string })[]>([])
  const [pitches, setPitches] = useState<Pitch[]>([])
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [combinedSessionIds, setCombinedSessionIds] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<ViewMode>('sessions')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch players who have completed sessions
  useEffect(() => {
    if (!supabase) return

    async function fetchPlayers() {
      const { data: sessionsData } = await supabase!
        .from('sessions')
        .select('player_id')
        .not('completed_at', 'is', null)

      const playerIds = [...new Set((sessionsData ?? []).map((s) => s.player_id))]

      if (playerIds.length === 0) {
        setPlayers([])
        setLoading(false)
        return
      }

      const { data: playersData } = await supabase!
        .from('players')
        .select('id, name, created_at')
        .in('id', playerIds)
        .order('name')

      setPlayers(playersData ?? [])
      setLoading(false)
    }

    fetchPlayers()
  }, [])

  // Fetch sessions when player selected
  useEffect(() => {
    if (!supabase || !selectedPlayerId) {
      setSessions([])
      return
    }

    async function fetchSessions() {
      const { data: sessionsData, error: err } = await supabase!
        .from('sessions')
        .select('id, player_id, started_at, completed_at, notes')
        .eq('player_id', selectedPlayerId)
        .not('completed_at', 'is', null)
        .order('started_at', { ascending: false })

      if (err) {
        setError(err.message)
        return
      }

      const player = players.find((p) => p.id === selectedPlayerId)
      setSessions(
        (sessionsData ?? []).map((s) => ({
          ...s,
          player_name: player?.name ?? '',
        }))
      )
    }

    fetchSessions()
  }, [selectedPlayerId, players])

  // Fetch pitches for selected session or combined sessions
  useEffect(() => {
    if (!supabase) return

    const idsToFetch =
      viewMode === 'combine'
        ? Array.from(combinedSessionIds)
        : selectedSessionId
          ? [selectedSessionId]
          : viewMode === 'composite' && selectedPlayerId
            ? sessions.map((s) => s.id)
            : []

    if (idsToFetch.length === 0) {
      setPitches([])
      return
    }

    async function fetchPitches() {
      const { data, error: err } = await supabase!
        .from('pitches')
        .select('id, session_id, pitch_type, intended_cells, actual_x, actual_y, velocity, sequence_order, created_at')
        .in('session_id', idsToFetch)
        .order('sequence_order')

      if (err) {
        setError(err.message)
        return
      }
      setPitches(data ?? [])
    }

    fetchPitches()
  }, [selectedSessionId, combinedSessionIds, viewMode, selectedPlayerId, sessions])

  const pitchTypeStats = useMemo(
    () => computePitchTypeStats(pitches),
    [pitches]
  )

  function toggleCombineSession(sessionId: string) {
    setCombinedSessionIds((prev) => {
      const next = new Set(prev)
      if (next.has(sessionId)) next.delete(sessionId)
      else next.add(sessionId)
      return next
    })
  }

  async function handleDeleteSession(sessionId: string, e?: React.MouseEvent) {
    e?.stopPropagation()
    if (!supabase) return
    if (!confirm('Delete this session? All pitches in it will be permanently deleted.')) return

    const { error: err } = await supabase.from('sessions').delete().eq('id', sessionId)
    if (err) {
      setError(err.message)
      return
    }
    setSessions((prev) => prev.filter((s) => s.id !== sessionId))
    if (selectedSessionId === sessionId) setSelectedSessionId(null)
    setCombinedSessionIds((prev) => {
      const next = new Set(prev)
      next.delete(sessionId)
      return next
    })
  }

  if (!supabase) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <p style={{ color: '#f87171' }}>Configure Supabase to view history.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', color: '#94a3b8' }}>
        Loading…
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: 16 }}>
        History
      </h2>

      {/* Player picker */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 14, marginBottom: 6, color: '#94a3b8' }}>
          Player
        </label>
        <select
          value={selectedPlayerId ?? ''}
          onChange={(e) => {
            setSelectedPlayerId(e.target.value || null)
            setSelectedSessionId(null)
            setCombinedSessionIds(new Set())
          }}
          style={{
            padding: '10px 14px',
            borderRadius: 8,
            backgroundColor: '#1e293b',
            border: '1px solid #475569',
            color: 'white',
            fontSize: 16,
            cursor: 'pointer',
            minWidth: 200,
          }}
        >
          <option value="">Select a player…</option>
          {players.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {players.length === 0 && (
        <p style={{ color: '#94a3b8' }}>
          No completed sessions yet. Complete a session on the Session tab first.
        </p>
      )}

      {error && (
        <p style={{ color: '#f87171', marginBottom: 16 }}>{error}</p>
      )}

      {selectedPlayerId && sessions.length === 0 && (
        <p style={{ color: '#94a3b8', fontSize: 14 }}>
          No sessions for this player.
        </p>
      )}

      {selectedPlayerId && sessions.length > 0 && (
        <>
          {/* View mode tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button
              type="button"
              onClick={() => {
                setViewMode('sessions')
                setSelectedSessionId(null)
              }}
              style={{
                padding: '8px 16px',
                fontSize: 14,
                backgroundColor: viewMode === 'sessions' ? '#334155' : 'transparent',
                border: '1px solid #475569',
                borderRadius: 8,
                color: 'white',
                cursor: 'pointer',
              }}
            >
              Sessions
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode('composite')
                setSelectedSessionId(null)
              }}
              style={{
                padding: '8px 16px',
                fontSize: 14,
                backgroundColor: viewMode === 'composite' ? '#334155' : 'transparent',
                border: '1px solid #475569',
                borderRadius: 8,
                color: 'white',
                cursor: 'pointer',
              }}
            >
              Composite
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode('combine')
                setCombinedSessionIds(new Set())
              }}
              style={{
                padding: '8px 16px',
                fontSize: 14,
                backgroundColor: viewMode === 'combine' ? '#334155' : 'transparent',
                border: '1px solid #475569',
                borderRadius: 8,
                color: 'white',
                cursor: 'pointer',
              }}
            >
              Combine
            </button>
          </div>

          {/* Combine mode: session checkboxes */}
          {viewMode === 'combine' && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 8 }}>
                Select sessions to combine:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {sessions.map((s) => (
                  <div
                    key={s.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                      padding: '8px 12px',
                      backgroundColor: combinedSessionIds.has(s.id)
                        ? 'rgba(51, 65, 85, 0.5)'
                        : 'transparent',
                      borderRadius: 8,
                    }}
                  >
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        cursor: 'pointer',
                        flex: 1,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={combinedSessionIds.has(s.id)}
                        onChange={() => toggleCombineSession(s.id)}
                      />
                      {s.notes && s.notes.trim() && (
                        <span title="Has notes" style={{ fontSize: 14, opacity: 0.8 }}>📝</span>
                      )}
                      <span>{formatDate(s.started_at)}</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleDeleteSession(s.id)}
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
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sessions mode: session list */}
          {viewMode === 'sessions' && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 8 }}>
                Click a session to view:
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {sessions.map((s) => (
                  <li
                    key={s.id}
                    onClick={() =>
                      setSelectedSessionId(selectedSessionId === s.id ? null : s.id)
                    }
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      backgroundColor:
                        selectedSessionId === s.id ? 'rgba(51, 65, 85, 0.8)' : 'rgba(30, 41, 59, 0.5)',
                      borderRadius: 8,
                      marginBottom: 8,
                      cursor: 'pointer',
                      border:
                        selectedSessionId === s.id
                          ? '2px solid #34d399'
                          : '1px solid transparent',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {s.notes && s.notes.trim() && (
                        <span
                          title="Has notes"
                          style={{ fontSize: 14, opacity: 0.8 }}
                          aria-hidden
                        >
                          📝
                        </span>
                      )}
                      {formatDate(s.started_at)}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteSession(s.id, e)}
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
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Strike zone visualization - when we have pitches to show */}
          {pitches.length > 0 && (
            <div>
              {/* Session notes - when viewing a single session */}
              {viewMode === 'sessions' && selectedSessionId && (() => {
                const session = sessions.find((s) => s.id === selectedSessionId)
                const sessionNotes = session?.notes?.trim()
                return sessionNotes ? (
                  <div
                    style={{
                      marginBottom: 16,
                      padding: 12,
                      backgroundColor: 'rgba(30, 41, 59, 0.5)',
                      borderRadius: 12,
                      border: '1px solid #334155',
                    }}
                  >
                    <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#94a3b8' }}>
                      Notes
                    </h4>
                    <p style={{ margin: 0, fontSize: 14, whiteSpace: 'pre-wrap' }}>
                      {sessionNotes}
                    </p>
                  </div>
                ) : null
              })()}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                  flexWrap: 'wrap',
                  gap: 8,
                }}
              >
                <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
                  {viewMode === 'sessions' && selectedSessionId
                    ? 'Session'
                    : viewMode === 'composite'
                      ? 'All sessions'
                      : 'Combined sessions'}{' '}
                  ({pitches.length} pitches)
                </h3>
                {viewMode === 'sessions' && selectedSessionId && (
                  <>
                  <button
                    type="button"
                    onClick={() => {
                      const session = sessions.find((s) => s.id === selectedSessionId)
                      const player = players.find((p) => p.id === session?.player_id)
                      if (session && player && resumeSession) {
                        resumeSession({
                          sessionId: session.id,
                          player: { id: player.id, name: player.name, created_at: player.created_at },
                          pitches: pitches.map((p) => ({
                            id: p.id,
                            pitch_type: p.pitch_type,
                            intended_cells: p.intended_cells ?? [],
                            actual_x: p.actual_x,
                            actual_y: p.actual_y,
                            velocity: p.velocity,
                            sequence_order: p.sequence_order,
                          })),
                          notes: session.notes?.trim() ?? '',
                        })
                      }
                    }}
                    style={{
                      padding: '6px 12px',
                      fontSize: 12,
                      backgroundColor: '#059669',
                      border: 'none',
                      borderRadius: 4,
                      color: 'white',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    Continue session
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteSession(selectedSessionId)}
                    style={{
                      padding: '6px 12px',
                      fontSize: 12,
                      backgroundColor: 'transparent',
                      border: '1px solid #dc2626',
                      borderRadius: 4,
                      color: '#dc2626',
                      cursor: 'pointer',
                    }}
                  >
                    Delete session
                  </button>
                  </>
                )}
              </div>

              {/* Pitch type stats */}
              <div
                style={{
                  marginBottom: 16,
                  padding: 12,
                  backgroundColor: 'rgba(30, 41, 59, 0.5)',
                  borderRadius: 12,
                  border: '1px solid #334155',
                }}
              >
                <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#94a3b8' }}>
                  Stats by pitch type
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {pitchTypeStats.map((stat) => (
                    <div
                      key={stat.pitch_type}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                        flexWrap: 'wrap',
                        padding: '8px 12px',
                        backgroundColor: '#1e293b',
                        borderRadius: 8,
                      }}
                    >
                      <span
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: 4,
                          backgroundColor: getPitchTypeColor(stat.pitch_type, customTypes),
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ minWidth: 70, fontWeight: 500 }}>
                        {getPitchTypeLabel(stat.pitch_type, customTypes)}
                      </span>
                      <span style={{ minWidth: 50, color: '#94a3b8' }}>
                        {stat.count} pitches
                      </span>
                      <span style={{ minWidth: 70 }}>
                        Accuracy: <strong>{stat.accuracyPct}%</strong>
                      </span>
                      <span style={{ minWidth: isFastball(stat.pitch_type) ? 140 : 90 }}>
                        {isFastball(stat.pitch_type) ? (
                          <>
                            Top:{' '}
                            <strong>
                              {stat.topVelocity != null
                                ? `${stat.topVelocity} mph`
                                : '—'}
                            </strong>
                            {' / '}
                            Avg:{' '}
                            <strong>
                              {stat.avgVelocity != null
                                ? `${stat.avgVelocity} mph`
                                : '—'}
                            </strong>
                          </>
                        ) : (
                          <>
                            Avg vel:{' '}
                            <strong>
                              {stat.avgVelocity != null
                                ? `${stat.avgVelocity} mph`
                                : '—'}
                            </strong>
                          </>
                        )}
                      </span>
                      <span style={{ minWidth: 80 }}>
                        Strikes: <strong>{stat.strikePct}%</strong>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <StrikeZoneView
                pitches={pitches.map((p) => ({
                  pitch_type: p.pitch_type,
                  actual_x: Number(p.actual_x),
                  actual_y: Number(p.actual_y),
                }))}
              />
            </div>
          )}

          {viewMode === 'combine' && combinedSessionIds.size === 0 && (
            <p style={{ color: '#94a3b8', fontSize: 14 }}>
              Select at least one session above to view combined pitches.
            </p>
          )}
        </>
      )}
    </div>
  )
}
