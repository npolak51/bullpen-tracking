import type { PitchType } from '../types/database'
import { PITCH_TYPE_COLORS } from '../types/database'

const PITCH_LABELS: Record<PitchType, string> = {
  four_seam: '4-Seam',
  two_seam: '2-Seam',
  curveball: 'Curve',
  slider: 'Slider',
  splitter: 'Splitter',
  changeup: 'Changeup',
}

interface PitchTypeSelectorProps {
  value: PitchType
  onChange: (type: PitchType) => void
}

export function PitchTypeSelector({ value, onChange }: PitchTypeSelectorProps) {
  const types: PitchType[] = [
    'four_seam',
    'two_seam',
    'curveball',
    'slider',
    'splitter',
    'changeup',
  ]

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {types.map((type) => (
        <button
          key={type}
          type="button"
          onClick={() => onChange(type)}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: `2px solid ${value === type ? PITCH_TYPE_COLORS[type] : '#475569'}`,
            backgroundColor: value === type ? PITCH_TYPE_COLORS[type] : 'transparent',
            color: value === type ? 'white' : '#94a3b8',
            fontWeight: value === type ? 600 : 400,
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          {PITCH_LABELS[type]}
        </button>
      ))}
    </div>
  )
}
