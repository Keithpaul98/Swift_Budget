-- =============================================================================
-- Add budget column to projects table
-- =============================================================================

ALTER TABLE projects ADD COLUMN IF NOT EXISTS budget NUMERIC(10,2);
