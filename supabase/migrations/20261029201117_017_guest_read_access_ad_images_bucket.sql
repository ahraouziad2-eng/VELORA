/*
# Guest Read Access, Ad Images Bucket, and Profile Display

## Purpose
Enable guests (unauthenticated visitors) to view all published content (lands, ads, jobs, profiles),
while keeping all write operations restricted to authenticated users only.
Also adds an `ad-images` storage bucket for image uploads in ads, and makes profile/land images
readable by anon so guest visitors can see avatars and land photos.

## Changes

### 1. Public Content Tables — Add anon SELECT policies
Guests can now view published content on these tables:
- `lands`: SELECT where is_published = true AND verification_status = 'VERIFIED'
- `advertisements`: SELECT where status = 'PUBLISHED'
- `job_listings`: SELECT where status = 'PUBLISHED'
- `profiles`: SELECT id, full_name, avatar_url, wilaya, commune (public display columns only)

### 2. Storage Bucket — ad-images
New public bucket `ad-images` for ad image uploads, with INSERT/UPDATE/DELETE/SELECT policies
for authenticated users (write) and anon (read).

### 3. Storage Policies — anon read access on public buckets
Add anon SELECT policies on `storage.objects` for `profile-images`, `land-images`, and `ad-images`
buckets so guest visitors can see uploaded photos via public URLs.

### 4. Grants
- GRANT SELECT on lands, advertisements, job_listings TO anon (public content only)
- GRANT SELECT on profiles TO anon (for public display — avatar + name on published content)
- Storage objects: already have anon SELECT grants via bucket policies

## Security Notes
1. All INSERT/UPDATE/DELETE operations remain authenticated-only — guests cannot publish or modify anything.
2. Profile SELECT for anon is column-restricted to only public display fields (id, full_name, avatar_url, wilaya, commune).
3. Storage write policies enforce folder ownership (user_id in path) for authenticated uploads.
4. No changes to ownership or verification flow — admin approval still required for all published content.
*/

-- ============================================================
-- 1. GRANT SELECT TO anon on public content tables
-- ============================================================

GRANT SELECT ON lands TO anon;
GRANT SELECT ON advertisements TO anon;
GRANT SELECT ON job_listings TO anon;
-- Column-restricted SELECT for profiles: only public display columns
GRANT SELECT (id, full_name, avatar_url, wilaya, commune) ON profiles TO anon;

-- ============================================================
-- 2. Add anon SELECT policies on public content tables
-- ============================================================

-- Lands: guests can see published + verified lands only
DROP POLICY IF EXISTS "select_published_lands_anon" ON lands;
CREATE POLICY "select_published_lands_anon"
  ON lands FOR SELECT
  TO anon
  USING (is_published = true AND verification_status = 'VERIFIED');

-- Advertisements: guests can see published ads only
DROP POLICY IF EXISTS "select_published_ads_anon" ON advertisements;
CREATE POLICY "select_published_ads_anon"
  ON advertisements FOR SELECT
  TO anon
  USING (status = 'PUBLISHED');

-- Job listings: guests can see published jobs only
DROP POLICY IF EXISTS "select_published_jobs_anon" ON job_listings;
CREATE POLICY "select_published_jobs_anon"
  ON job_listings FOR SELECT
  TO anon
  USING (status = 'PUBLISHED');

-- Profiles: guests can see public display columns only (column grant already restricts)
DROP POLICY IF EXISTS "select_public_profiles_anon" ON profiles;
CREATE POLICY "select_public_profiles_anon"
  ON profiles FOR SELECT
  TO anon
  USING (true);

-- ============================================================
-- 3. Create ad-images storage bucket (public for read)
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('ad-images', 'ad-images', true, 5242880)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 4. Storage policies for ad-images bucket
-- ============================================================

-- INSERT: authenticated users can upload to their own folder
DROP POLICY IF EXISTS "insert_ad_images_storage" ON storage.objects;
CREATE POLICY "insert_ad_images_storage"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'ad-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- SELECT: anyone can read ad images (public bucket)
DROP POLICY IF EXISTS "select_ad_images_storage" ON storage.objects;
CREATE POLICY "select_ad_images_storage"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'ad-images');

-- UPDATE: authenticated users can update their own folder
DROP POLICY IF EXISTS "update_ad_images_storage" ON storage.objects;
CREATE POLICY "update_ad_images_storage"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'ad-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- DELETE: authenticated users can delete from their own folder
DROP POLICY IF EXISTS "delete_ad_images_storage" ON storage.objects;
CREATE POLICY "delete_ad_images_storage"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'ad-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================
-- 5. Add anon SELECT on profile-images and land-images storage
--    (so guests can see avatars and land photos)
-- ============================================================

DROP POLICY IF EXISTS "select_profile_images_anon" ON storage.objects;
CREATE POLICY "select_profile_images_anon"
  ON storage.objects FOR SELECT
  TO anon
  USING (bucket_id = 'profile-images');

DROP POLICY IF EXISTS "select_land_images_anon" ON storage.objects;
CREATE POLICY "select_land_images_anon"
  ON storage.objects FOR SELECT
  TO anon
  USING (bucket_id = 'land-images');
