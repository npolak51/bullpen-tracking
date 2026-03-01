-- Pitch type enum (skip if already exists)
DO $$
BEGIN
  CREATE TYPE pitch_type AS ENUM (
    'four_seam',
    'two_seam',
    'curveball',
    'slider',
    'splitter',
    'changeup'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

-- Players table
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  CONSTRAINT valid_completion CHECK (completed_at IS NULL OR completed_at >= started_at)
);

-- Pitches table
-- Grid: 9x9 strike zone (rows/cols 1-9) + outer ring for balls (rows/cols 0 and 10)
-- intended: always in strike zone (1-9)
-- actual: can be in strike zone (1-9) or ball zone (0 or 10)
CREATE TABLE IF NOT EXISTS pitches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  pitch_type pitch_type NOT NULL,
  intended_row SMALLINT NOT NULL CHECK (intended_row BETWEEN 1 AND 9),
  intended_col SMALLINT NOT NULL CHECK (intended_col BETWEEN 1 AND 9),
  actual_row SMALLINT NOT NULL CHECK (actual_row BETWEEN 0 AND 10),
  actual_col SMALLINT NOT NULL CHECK (actual_col BETWEEN 0 AND 10),
  velocity NUMERIC(4, 1),
  sequence_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_sessions_player_id ON sessions(player_id);
CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_pitches_session_id ON pitches(session_id);
CREATE INDEX IF NOT EXISTS idx_pitches_sequence ON pitches(session_id, sequence_order);

-- Enable Row Level Security (RLS)
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pitches ENABLE ROW LEVEL SECURITY;

-- Policies: drop if exists, then create (allows re-run)
DROP POLICY IF EXISTS "Allow all on players" ON players;
CREATE POLICY "Allow all on players" ON players
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on sessions" ON sessions;
CREATE POLICY "Allow all on sessions" ON sessions
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on pitches" ON pitches;
CREATE POLICY "Allow all on pitches" ON pitches
  FOR ALL USING (true) WITH CHECK (true);
