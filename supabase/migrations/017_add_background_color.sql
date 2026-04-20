ALTER TABLE portfolios
  ADD COLUMN IF NOT EXISTS background_color text NOT NULL DEFAULT '#FFFFFF';
