-- Add institution branding columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS institution_name text,
  ADD COLUMN IF NOT EXISTS institution_address text,
  ADD COLUMN IF NOT EXISTS institution_city text,
  ADD COLUMN IF NOT EXISTS institution_logo_url text;

-- Create storage bucket for institution logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('institution-logos', 'institution-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their logo
CREATE POLICY "Users can upload own logo"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'institution-logos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow public read
CREATE POLICY "Public can read logos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'institution-logos');

-- Allow users to update/delete own logos
CREATE POLICY "Users can update own logo"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'institution-logos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own logo"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'institution-logos' AND (storage.foldername(name))[1] = auth.uid()::text);