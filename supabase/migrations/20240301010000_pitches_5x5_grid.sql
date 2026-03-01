-- Update pitches for 5x5 grid with center 3x3 strike zone
-- intended_cells: row/col 0-4 (5x5)
-- actual_x, actual_y: 0-5 coordinate space

DROP TABLE IF EXISTS pitches;

CREATE TABLE pitches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  pitch_type pitch_type NOT NULL,
  intended_cells JSONB NOT NULL DEFAULT '[]' CHECK (jsonb_array_length(intended_cells) > 0),
  actual_x NUMERIC(4, 2) NOT NULL CHECK (actual_x >= 0 AND actual_x <= 5),
  actual_y NUMERIC(4, 2) NOT NULL CHECK (actual_y >= 0 AND actual_y <= 5),
  velocity NUMERIC(4, 1),
  sequence_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pitches_session_id ON pitches(session_id);
CREATE INDEX IF NOT EXISTS idx_pitches_sequence ON pitches(session_id, sequence_order);

ALTER TABLE pitches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on pitches" ON pitches
  FOR ALL USING (true) WITH CHECK (true);
