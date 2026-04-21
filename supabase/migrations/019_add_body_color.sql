ALTER TABLE portfolios
  ADD COLUMN IF NOT EXISTS body_color text NOT NULL DEFAULT '#1A1A1A';

-- Existing portfolios : default to the same value as secondary_color (the old
-- single text color). That way users upgrading don't see their body text change
-- until they explicitly pick a different body color.
UPDATE portfolios SET body_color = secondary_color WHERE body_color = '#1A1A1A';
