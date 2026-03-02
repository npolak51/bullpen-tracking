import { useState } from 'react'
import { StrikeZone } from './StrikeZone'
import { BatterSilhouette } from './BatterSilhouette'
import { GRID_HEIGHT } from '../lib/strikeZoneConstants'
import { PitchTypeSelector } from './PitchTypeSelector'
import type { PitchType } from '../types/database'
import { PITCH_TYPE_COLORS } from '../types/database'

interface AddPitchFormProps {
  onAdd: (pitch: {
    pitch_type: PitchType
    intended_cells: { row: number; col: number }[]
    actual_x: number
    actual_y: number
    velocity: number | null
  }) => void
}

export function AddPitchForm({ onAdd }: AddPitchFormProps) {
  const [pitchType, setPitchType] = useState<PitchType>('four_seam')
  const [intendedCells, setIntendedCells] = useState<{ row: number; col: number }[]>([])
  const [actualPosition, setActualPosition] = useState<{ x: number; y: number } | null>(null)
  const [velocity, setVelocity] = useState('')
  const [selecting, setSelecting] = useState<'intended' | 'actual'>('intended')

  function handleAdd() {
    if (intendedCells.length === 0 || !actualPosition) return

    onAdd({
      pitch_type: pitchType,
      intended_cells: intendedCells,
      actual_x: actualPosition.x,
      actual_y: actualPosition.y,
      velocity: velocity.trim() ? parseFloat(velocity) : null,
    })

    setIntendedCells([])
    setActualPosition(null)
    setVelocity('')
    setSelecting('intended')
  }

  const canAdd = intendedCells.length > 0 && actualPosition

  return (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
        Log pitch
      </h3>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', fontSize: 14, marginBottom: 6, color: '#94a3b8' }}>
          Pitch type
        </label>
        <PitchTypeSelector value={pitchType} onChange={setPitchType} />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', fontSize: 14, marginBottom: 6, color: '#94a3b8' }}>
          {selecting === 'intended'
            ? '1. Drag across strike zone to select intended location'
            : '2. Tap or drag to place actual pitch (circle)'}
        </label>
        <div style={{ marginBottom: 8 }}>
          <button
            type="button"
            onClick={() => setSelecting('intended')}
            style={{
              padding: '4px 8px',
              marginRight: 8,
              fontSize: 12,
              backgroundColor: selecting === 'intended' ? '#334155' : 'transparent',
              border: '1px solid #475569',
              borderRadius: 4,
              color: 'white',
              cursor: 'pointer',
            }}
          >
            Intended
          </button>
          <button
            type="button"
            onClick={() => setSelecting('actual')}
            style={{
              padding: '4px 8px',
              fontSize: 12,
              backgroundColor: selecting === 'actual' ? '#334155' : 'transparent',
              border: '1px solid #475569',
              borderRadius: 4,
              color: 'white',
              cursor: 'pointer',
            }}
          >
            Actual
          </button>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: 12,
            backgroundColor: '#1e293b',
            borderRadius: 12,
            position: 'relative',
          }}
        >
          <StrikeZone
            intendedCells={intendedCells}
            actualPosition={actualPosition}
            onIntendedSet={setIntendedCells}
            onActualPlace={(x, y) => setActualPosition({ x, y })}
            selecting={selecting}
            pitchColor={PITCH_TYPE_COLORS[pitchType]}
          />
          <BatterSilhouette height={GRID_HEIGHT} />
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', fontSize: 14, marginBottom: 6, color: '#94a3b8' }}>
          Velocity (mph)
        </label>
        <input
          type="text"
          inputMode="decimal"
          value={velocity}
          onChange={(e) => {
            const v = e.target.value
            if (v === '' || /^\d*\.?\d*$/.test(v)) setVelocity(v)
          }}
          placeholder="Optional"
          style={{
            width: 100,
            padding: '8px 12px',
            borderRadius: 8,
            backgroundColor: '#1e293b',
            border: '1px solid #475569',
            color: 'white',
            fontSize: 16,
          }}
        />
      </div>

      <button
        type="button"
        onClick={handleAdd}
        disabled={!canAdd}
        style={{
          padding: '10px 20px',
          borderRadius: 8,
          backgroundColor: canAdd ? '#059669' : '#334155',
          color: 'white',
          fontWeight: 600,
          border: 'none',
          cursor: canAdd ? 'pointer' : 'not-allowed',
          opacity: canAdd ? 1 : 0.6,
        }}
      >
        Add pitch
      </button>
    </div>
  )
}
