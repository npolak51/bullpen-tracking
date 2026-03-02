-- Custom pitch types table (user-defined pitch types with assigned colors)
CREATE TABLE IF NOT EXISTS custom_pitch_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Change pitches.pitch_type from enum to TEXT
ALTER TABLE pitches ADD COLUMN pitch_type_text TEXT;
UPDATE pitches SET pitch_type_text = pitch_type::text;
ALTER TABLE pitches ALTER COLUMN pitch_type_text SET NOT NULL;
ALTER TABLE pitches DROP COLUMN pitch_type;
ALTER TABLE pitches RENAME COLUMN pitch_type_text TO pitch_type;

DROP TYPE IF EXISTS pitch_type;

-- RLS for custom_pitch_types
ALTER TABLE custom_pitch_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on custom_pitch_types" ON custom_pitch_types
  FOR ALL USING (true) WITH CHECK (true);
