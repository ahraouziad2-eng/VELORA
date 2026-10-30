/*
# Demo data support: extra columns, ad gallery, banners, and purge command

1. Plain-English summary
- Adds an is_demo flag to every table that receives sample data, so all sample rows can be removed in one step.
- Adds the detail columns the app needs to show realistic listings (soil, water, road, electricity, documents, views, partnership terms, equipment brand/model/condition, service experience and ratings).
- Adds a gallery table for advertisements (3 to 5 photos per ad).
- Adds a banners table for the home page slider.
- Adds a public read policy for land photos so visitors who are not signed in can see them.
- Adds the function purge_demo_data() that deletes every row marked is_demo.

2. Modified tables (only new nullable or defaulted columns; no existing data changed)
- profiles: is_demo.
- lands: is_demo, soil_type, water_source, road_type, has_electricity, document_type, views_count, partnership_share_percent, partnership_duration_months.
- advertisements: is_demo, price_unit, brand, model, item_condition, with_driver, years_experience, rating_avg, rating_count, views_count.
- land_images, job_listings, favorites, notifications, rental_requests, partnership_requests, land_investment_requests: is_demo.

3. New tables
- advertisement_images: gallery photos linked to an advertisement.
- banners: slider slides for the home page.

4. Security
- Both new tables have row level security enabled.
- advertisement_images: visitors and signed-in users can read photos of published advertisements only. No write access is granted to app roles.
- banners: visitors and signed-in users can read active banners only.
- land_images: visitors can read photos of published, verified lands (same rule as the lands table).
- purge_demo_data(): execute permission is removed from public, anon and authenticated. It runs only from the database SQL editor.

5. Notes
- Every statement is idempotent (IF NOT EXISTS, DROP POLICY IF EXISTS, CREATE OR REPLACE).
- Deleting demo profiles also removes their accounts in the authentication table; those accounts have no password and cannot sign in.
*/

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

ALTER TABLE lands ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;
ALTER TABLE lands ADD COLUMN IF NOT EXISTS soil_type text;
ALTER TABLE lands ADD COLUMN IF NOT EXISTS water_source text;
ALTER TABLE lands ADD COLUMN IF NOT EXISTS road_type text;
ALTER TABLE lands ADD COLUMN IF NOT EXISTS has_electricity boolean NOT NULL DEFAULT false;
ALTER TABLE lands ADD COLUMN IF NOT EXISTS document_type text;
ALTER TABLE lands ADD COLUMN IF NOT EXISTS views_count integer NOT NULL DEFAULT 0;
ALTER TABLE lands ADD COLUMN IF NOT EXISTS partnership_share_percent integer;
ALTER TABLE lands ADD COLUMN IF NOT EXISTS partnership_duration_months integer;

ALTER TABLE advertisements ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;
ALTER TABLE advertisements ADD COLUMN IF NOT EXISTS price_unit text;
ALTER TABLE advertisements ADD COLUMN IF NOT EXISTS brand text;
ALTER TABLE advertisements ADD COLUMN IF NOT EXISTS model text;
ALTER TABLE advertisements ADD COLUMN IF NOT EXISTS item_condition text;
ALTER TABLE advertisements ADD COLUMN IF NOT EXISTS with_driver boolean;
ALTER TABLE advertisements ADD COLUMN IF NOT EXISTS years_experience integer;
ALTER TABLE advertisements ADD COLUMN IF NOT EXISTS rating_avg numeric(2,1);
ALTER TABLE advertisements ADD COLUMN IF NOT EXISTS rating_count integer NOT NULL DEFAULT 0;
ALTER TABLE advertisements ADD COLUMN IF NOT EXISTS views_count integer NOT NULL DEFAULT 0;

ALTER TABLE land_images ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;
ALTER TABLE job_listings ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;
ALTER TABLE favorites ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;
ALTER TABLE rental_requests ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;
ALTER TABLE partnership_requests ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;
ALTER TABLE land_investment_requests ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS advertisement_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  advertisement_id uuid NOT NULL REFERENCES advertisements(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  is_primary boolean NOT NULL DEFAULT false,
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS advertisement_images_ad_idx ON advertisement_images (advertisement_id);

ALTER TABLE advertisement_images ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON advertisement_images TO anon, authenticated;

DROP POLICY IF EXISTS "select_published_ad_images" ON advertisement_images;
CREATE POLICY "select_published_ad_images" ON advertisement_images FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM advertisements a
    WHERE a.id = advertisement_images.advertisement_id AND a.status = 'PUBLISHED'
  )
);

CREATE TABLE IF NOT EXISTS banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  image_url text NOT NULL,
  link_url text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON banners TO anon, authenticated;

DROP POLICY IF EXISTS "select_active_banners" ON banners;
CREATE POLICY "select_active_banners" ON banners FOR SELECT
TO anon, authenticated
USING (is_active = true);

GRANT SELECT ON land_images TO anon;

DROP POLICY IF EXISTS "select_published_land_images_anon" ON land_images;
CREATE POLICY "select_published_land_images_anon" ON land_images FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM lands l
    WHERE l.id = land_images.land_id AND l.is_published = true AND l.verification_status = 'VERIFIED'
  )
);

CREATE OR REPLACE FUNCTION public.purge_demo_data()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM notifications WHERE is_demo;
  DELETE FROM favorites WHERE is_demo;
  DELETE FROM rental_requests WHERE is_demo;
  DELETE FROM partnership_requests WHERE is_demo;
  DELETE FROM land_investment_requests WHERE is_demo;
  DELETE FROM job_listings WHERE is_demo;
  DELETE FROM advertisements WHERE is_demo;
  DELETE FROM banners WHERE is_demo;
  DELETE FROM lands WHERE is_demo;
  DELETE FROM auth.users WHERE id IN (SELECT id FROM profiles WHERE is_demo);
  DELETE FROM profiles WHERE is_demo;
  RETURN 'Demo data removed';
END;
$$;

REVOKE EXECUTE ON FUNCTION public.purge_demo_data() FROM PUBLIC, anon, authenticated;
