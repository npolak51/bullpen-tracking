import type { PitchType } from '../types/database'
import { PITCH_TYPE_COLORS } from '../types/database'
import { BatterSilhouette } from './BatterSilhouette'
import {
  GRID_SIZE,
  STRIKE_SIZE,
  STRIKE_OFFSET,
  CELL_WIDTH,
  CELL_HEIGHT,
  GAP,
} from '../lib/strikeZoneConstants'

const CIRCLE_SIZE_RATIO = 0.48
const CIRCLE_DIAMETER = Math.min(CELL_WIDTH, CELL_HEIGHT) * CIRCLE_SIZE_RATIO

interface PitchDisplay {
  pitch_type: PitchType
  actual_x: number
  actual_y: number
}

interface StrikeZoneViewProps {
  pitches: PitchDisplay[]
}

export function StrikeZoneView({ pitches }: StrikeZoneViewProps) {
  const strikeZoneWidth = STRIKE_SIZE * CELL_WIDTH + (STRIKE_SIZE - 1) * GAP
  const strikeZoneHeight = STRIKE_SIZE * CELL_HEIGHT + (STRIKE_SIZE - 1) * GAP
  const strikeZoneLeft = STRIKE_OFFSET * CELL_WIDTH + STRIKE_OFFSET * GAP + 2
  const strikeZoneTop = STRIKE_OFFSET * CELL_HEIGHT + STRIKE_OFFSET * GAP + 2

  const gridWidth = GRID_SIZE * CELL_WIDTH + (GRID_SIZE - 1) * GAP + 4
  const gridHeight = GRID_SIZE * CELL_HEIGHT + (GRID_SIZE - 1) * GAP + 4

  return (
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
      <div
        style={{
          position: 'relative',
          display: 'inline-block',
          width: gridWidth,
          height: gridHeight,
          marginTop: 28,
          marginLeft: 7,
        }}
      >
      {/* 5x5 grid - rectangular cells (taller than wide) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${GRID_SIZE}, ${CELL_WIDTH}px)`,
          gridTemplateRows: `repeat(${GRID_SIZE}, ${CELL_HEIGHT}px)`,
          gap: GAP,
          backgroundColor: '#1e293b',
          borderRadius: 8,
          padding: 2,
        }}
      >
        {Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => {
          const row = Math.floor(i / GRID_SIZE)
          const col = i % GRID_SIZE
          const isStrike =
            row >= STRIKE_OFFSET &&
            row < STRIKE_OFFSET + STRIKE_SIZE &&
            col >= STRIKE_OFFSET &&
            col < STRIKE_OFFSET + STRIKE_SIZE
          return (
            <div
              key={`${row}-${col}`}
              style={{
                width: CELL_WIDTH - 2,
                height: CELL_HEIGHT - 2,
                border: '1px solid #475569',
                borderRadius: 4,
                backgroundColor: isStrike ? '#334155' : '#475569',
              }}
            />
          )
        })}
      </div>

      {/* White border around center 3x3 strike zone */}
      <div
        style={{
          position: 'absolute',
          left: strikeZoneLeft,
          top: strikeZoneTop,
          width: strikeZoneWidth,
          height: strikeZoneHeight,
          border: '3px solid white',
          borderRadius: 2,
          pointerEvents: 'none',
          boxSizing: 'border-box',
        }}
      />

      {/* Pitch circles */}
      {pitches.map((pitch, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `calc(${(pitch.actual_x / GRID_SIZE) * 100}% - ${CIRCLE_DIAMETER / 2}px)`,
            top: `calc(${(pitch.actual_y / GRID_SIZE) * 100}% - ${CIRCLE_DIAMETER / 2}px)`,
            width: CIRCLE_DIAMETER,
            height: CIRCLE_DIAMETER,
            borderRadius: '50%',
            backgroundColor: PITCH_TYPE_COLORS[pitch.pitch_type],
            border: '2px solid white',
            pointerEvents: 'none',
          }}
        />
      ))}
      </div>
      <BatterSilhouette height={gridHeight} />
    </div>
  )
}
