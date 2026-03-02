import { useState } from 'react'
import type { PitchType } from '../types/database'
import { PITCH_TYPE_COLORS } from '../types/database'
import { getAccuracy, isStrike } from '../lib/pitchUtils'
import { StrikeZone } from './StrikeZone'
import { BatterSilhouette } from './BatterSilhouette'
import { GRID_HEIGHT } from '../lib/strikeZoneConstants'

const PITCH_LABELS: Record<PitchType, string> = {
  four_seam: '4-Seam',
  two_seam: '2-Seam',
  curveball: 'Curve',
  slider: 'Slider',
  splitter: 'Splitter',
  changeup: 'Changeup',
}

interface PitchListItemProps {
  pitch: {
    id: string
    pitch_type: PitchType
    intended_cells: { row: number; col: number }[]
    actual_x: number
    actual_y: number
    velocity: number | null
    sequence_order: number
  }
  onDelete: () => void
  onUpdateVelocity: (velocity: number | null) => void
  onUpdateLocation: (actual_x: number, actual_y: number) => void
  offline?: boolean
}

export function PitchListItem({
  pitch,
  onDelete,
  onUpdateVelocity,
  onUpdateLocation,
  offline = false,
}: PitchListItemProps) {
  const [editing, setEditing] = useState(false)
  const [editingLocation, setEditingLocation] = useState(false)
  const [locationPosition, setLocationPosition] = useState({
    x: Number(pitch.actual_x),
    y: Number(pitch.actual_y),
  })
  const [velocityInput, setVelocityInput] = useState(
    pitch.velocity != null ? String(pitch.velocity) : ''
  )

  const actualX = Number(pitch.actual_x)
  const actualY = Number(pitch.actual_y)
  const accuracy = getAccuracy(pitch.intended_cells, actualX, actualY)
  const strike = isStrike(actualX, actualY)

  function handleSaveVelocity() {
    const val = velocityInput.trim()
    onUpdateVelocity(val === '' ? null : parseFloat(val))
    setEditing(false)
  }

  return (
    <li
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        padding: '10px 12px',
        backgroundColor: 'rgba(30, 41, 59, 0.5)',
        borderRadius: 8,
        marginBottom: 8,
        fontSize: 14,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      <span
        style={{
          width: 12,
          height: 12,
          borderRadius: 4,
          backgroundColor: PITCH_TYPE_COLORS[pitch.pitch_type],
          flexShrink: 0,
        }}
      />
      <span style={{ minWidth: 70 }}>{PITCH_LABELS[pitch.pitch_type]}</span>
      <span style={{ minWidth: 60 }}>{accuracy}%</span>
      <span
        style={{
          minWidth: 50,
          fontWeight: 600,
          color: strike ? '#22c55e' : '#ef4444',
        }}
      >
        {strike ? 'Strike' : 'Ball'}
      </span>
      {editing ? (
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <input
            type="text"
            inputMode="decimal"
            value={velocityInput}
            onChange={(e) => {
              const v = e.target.value
              if (v === '' || /^\d*\.?\d*$/.test(v)) setVelocityInput(v)
            }}
            placeholder="mph"
            style={{
              width: 60,
              padding: '4px 8px',
              borderRadius: 4,
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              color: 'white',
              fontSize: 14,
            }}
            autoFocus
          />
          <button
            type="button"
            onClick={handleSaveVelocity}
            style={{
              padding: '4px 8px',
              fontSize: 12,
              backgroundColor: '#059669',
              border: 'none',
              borderRadius: 4,
              color: 'white',
              cursor: 'pointer',
            }}
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => {
              setVelocityInput(pitch.velocity != null ? String(pitch.velocity) : '')
              setEditing(false)
            }}
            style={{
              padding: '4px 8px',
              fontSize: 12,
              backgroundColor: 'transparent',
              border: '1px solid #475569',
              borderRadius: 4,
              color: '#94a3b8',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </span>
      ) : (
        <span style={{ color: '#94a3b8', minWidth: 50 }}>
          {pitch.velocity != null ? `${pitch.velocity} mph` : '—'}
        </span>
      )}
      {!editing && !offline && (
        <button
          type="button"
          onClick={() => setEditing(true)}
          style={{
            padding: '4px 8px',
            fontSize: 12,
            backgroundColor: 'transparent',
            border: '1px solid #475569',
            borderRadius: 4,
            color: '#94a3b8',
            cursor: 'pointer',
          }}
        >
          Edit
        </button>
      )}
      {!editing && !editingLocation && !offline && (
        <button
          type="button"
          onClick={() => {
            setEditingLocation(true)
            setLocationPosition({ x: actualX, y: actualY })
          }}
          style={{
            padding: '4px 8px',
            fontSize: 12,
            backgroundColor: 'transparent',
            border: '1px solid #475569',
            borderRadius: 4,
            color: '#94a3b8',
            cursor: 'pointer',
          }}
        >
          Edit location
        </button>
      )}
      <button
        type="button"
        onClick={onDelete}
        disabled={offline}
        style={{
          padding: '4px 8px',
          fontSize: 12,
          backgroundColor: 'transparent',
          border: '1px solid #dc2626',
          borderRadius: 4,
          color: '#dc2626',
          marginLeft: 'auto',
          cursor: offline ? 'not-allowed' : 'pointer',
          opacity: offline ? 0.5 : 1,
        }}
      >
        Delete
      </button>
      </div>
      {editingLocation && (
        <div>
          <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>
            Drag the ball to reposition, release to save
          </p>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: 12,
              backgroundColor: '#1e293b',
              borderRadius: 12,
            }}
          >
          <StrikeZone
            intendedCells={pitch.intended_cells}
            actualPosition={locationPosition}
            onIntendedSet={() => {}}
            onActualPlace={(x, y) => setLocationPosition({ x, y })}
            onActualCommit={(x, y) => {
              onUpdateLocation(x, y)
              setEditingLocation(false)
            }}
            selecting="actual"
            pitchColor={PITCH_TYPE_COLORS[pitch.pitch_type]}
          />
          <BatterSilhouette height={GRID_HEIGHT} />
          <button
            type="button"
            onClick={() => setEditingLocation(false)}
            style={{
              padding: '4px 8px',
              fontSize: 12,
              backgroundColor: 'transparent',
              border: '1px solid #475569',
              borderRadius: 4,
              color: '#94a3b8',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          </div>
        </div>
      )}
    </li>
  )
}
