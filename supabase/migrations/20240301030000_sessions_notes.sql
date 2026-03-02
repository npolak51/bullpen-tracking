-- Add notes column to sessions
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS notes TEXT;
