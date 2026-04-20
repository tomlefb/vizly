ALTER TABLE portfolios
  ADD COLUMN IF NOT EXISTS contact_form_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS contact_form_title text NOT NULL DEFAULT 'Me contacter',
  ADD COLUMN IF NOT EXISTS contact_form_description text NOT NULL DEFAULT 'Intéressé par mon profil ? N''hésite pas à m''écrire.';
