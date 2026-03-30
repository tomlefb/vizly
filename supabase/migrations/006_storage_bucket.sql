-- Migration: Create portfolio-images storage bucket with policies
-- Applied via Supabase MCP on 2026-03-30

-- Create the portfolio-images bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'portfolio-images',
  'portfolio-images',
  true,
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Policy: Authenticated users can upload to their own folder
-- Path pattern: {user_id}/{filename}
CREATE POLICY "Users can upload to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'portfolio-images'
  AND (storage.foldername(name))[1] = (select auth.uid()::text)
);

-- Policy: Anyone can read (public bucket)
CREATE POLICY "Public read access for portfolio images"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'portfolio-images'
);

-- Policy: Authenticated users can delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'portfolio-images'
  AND (storage.foldername(name))[1] = (select auth.uid()::text)
);

-- Policy: Authenticated users can update their own files
CREATE POLICY "Users can update own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'portfolio-images'
  AND (storage.foldername(name))[1] = (select auth.uid()::text)
)
WITH CHECK (
  bucket_id = 'portfolio-images'
  AND (storage.foldername(name))[1] = (select auth.uid()::text)
);
