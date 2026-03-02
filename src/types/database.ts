export type BuiltInPitchType =
  | 'four_seam'
  | 'two_seam'
  | 'curveball'
  | 'slider'
  | 'splitter'
  | 'changeup'

export type PitchType = BuiltInPitchType | string

export interface CustomPitchType {
  id: string
  name: string
  color: string
  created_at: string
}

export interface Player {
  id: string
  name: string
  created_at: string
}

export interface Session {
  id: string
  player_id: string
  started_at: string
  completed_at: string | null
  notes: string | null
}

export interface IntendedCell {
  row: number
  col: number
}

export interface Pitch {
  id: string
  session_id: string
  pitch_type: PitchType
  intended_cells: IntendedCell[]
  actual_x: number
  actual_y: number
  velocity: number | null
  sequence_order: number
  created_at: string
}

export interface SessionWithPlayer extends Session {
  players: Pick<Player, 'id' | 'name'> | null
}

export interface PitchWithSession extends Pitch {
  sessions: Pick<Session, 'id' | 'player_id' | 'started_at' | 'completed_at'> | null
}

// Built-in pitch type display colors
export const PITCH_TYPE_COLORS: Record<BuiltInPitchType, string> = {
  four_seam: '#ef4444',   // red
  two_seam: '#ec4899',    // pink
  curveball: '#22c55e',   // green
  slider: '#eab308',      // yellow
  splitter: '#a855f7',    // purple
  changeup: '#3b82f6',    // blue
}

export const PITCH_LABELS: Record<BuiltInPitchType, string> = {
  four_seam: '4-Seam',
  two_seam: '2-Seam',
  curveball: 'Curve',
  slider: 'Slider',
  splitter: 'Splitter',
  changeup: 'Changeup',
}
