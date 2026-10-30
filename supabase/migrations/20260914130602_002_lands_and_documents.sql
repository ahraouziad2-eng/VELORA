/*
# Lands, Land Images, Land Documents

1. New Tables
- `lands` — agricultural land listings with owner, name, wilaya, commune, area, land_type, offer_type, verification_status, description, agricultural_info, price, latitude, longitude, is_published, region.
- `land_images` — images for each land (image_url, is_primary).
- `land_documents` — documents for each land (doc_type, doc_url, doc_name, verification_status).

2. Security
- RLS enabled on all tables.
- lands: public SELECT for published+verified lands; owners can CRUD their own; admin can SELECT/UPDATE all.
- land_images: public SELECT for published lands; owners can CRUD images for their own lands; admin can SELECT all.
- land_documents: only owner and admin can access (not public — documents are private).

3. Notes
- All owner columns default to auth.uid().
- Indexes on frequently searched columns (wilaya, commune, land_type, offer_type, verification_status, is_published).
*/

-- Lands table
CREATE TABLE IF NOT EXISTS public.lands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  wilaya text NOT NULL,
  commune text NOT NULL,
  region text,
  area numeric NOT NULL CHECK (area > 0),
  land_type text NOT NULL CHECK (land_type IN ('AGRICULTURAL', 'GRAZING', 'ARABLE', 'IRRIGATED', 'GREENHOUSE', 'ORCHARD', 'OTHER')),
  offer_type text NOT NULL DEFAULT 'NONE' CHECK (offer_type IN ('FOR_RENT', 'FOR_PARTNERSHIP', 'FOR_INVESTMENT', 'NONE')),
  verification_status text NOT NULL DEFAULT 'PENDING_REVIEW' CHECK (verification_status IN ('PENDING_REVIEW', 'VERIFIED', 'REJECTED', 'NEEDS_INFO', 'UNVERIFIED')),
  description text,
  agricultural_info text,
  price numeric,
  latitude double precision,
  longitude double precision,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Land images table
CREATE TABLE IF NOT EXISTS public.land_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  land_id uuid NOT NULL REFERENCES public.lands(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Land documents table
CREATE TABLE IF NOT EXISTS public.land_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  land_id uuid NOT NULL REFERENCES public.lands(id) ON DELETE CASCADE,
  doc_type text NOT NULL,
  doc_url text NOT NULL,
  doc_name text NOT NULL,
  verification_status text NOT NULL DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING', 'VERIFIED', 'REJECTED', 'NEEDS_REVISION')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.land_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.land_documents ENABLE ROW LEVEL SECURITY;

-- Lands policies
DROP POLICY IF EXISTS "select_published_lands" ON public.lands;
CREATE POLICY "select_published_lands" ON public.lands FOR SELECT
  TO authenticated USING (is_published = true AND verification_status = 'VERIFIED');

DROP POLICY IF EXISTS "select_own_lands" ON public.lands;
CREATE POLICY "select_own_lands" ON public.lands FOR SELECT
  TO authenticated USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "select_all_lands_admin" ON public.lands;
CREATE POLICY "select_all_lands_admin" ON public.lands FOR SELECT
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "insert_own_lands" ON public.lands;
CREATE POLICY "insert_own_lands" ON public.lands FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "update_own_lands" ON public.lands;
CREATE POLICY "update_own_lands" ON public.lands FOR UPDATE
  TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "update_lands_admin" ON public.lands;
CREATE POLICY "update_lands_admin" ON public.lands FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "delete_own_lands" ON public.lands;
CREATE POLICY "delete_own_lands" ON public.lands FOR DELETE
  TO authenticated USING (auth.uid() = owner_id);

-- Land images policies
DROP POLICY IF EXISTS "select_land_images_published" ON public.land_images;
CREATE POLICY "select_land_images_published" ON public.land_images FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.lands WHERE lands.id = land_images.land_id AND lands.is_published = true AND lands.verification_status = 'VERIFIED')
  );

DROP POLICY IF EXISTS "select_own_land_images" ON public.land_images;
CREATE POLICY "select_own_land_images" ON public.land_images FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.lands WHERE lands.id = land_images.land_id AND lands.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "select_all_land_images_admin" ON public.land_images;
CREATE POLICY "select_all_land_images_admin" ON public.land_images FOR SELECT
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "insert_own_land_images" ON public.land_images;
CREATE POLICY "insert_own_land_images" ON public.land_images FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.lands WHERE lands.id = land_images.land_id AND lands.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_land_images" ON public.land_images;
CREATE POLICY "delete_own_land_images" ON public.land_images FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.lands WHERE lands.id = land_images.land_id AND lands.owner_id = auth.uid())
  );

-- Land documents policies (private — only owner and admin)
DROP POLICY IF EXISTS "select_own_land_documents" ON public.land_documents;
CREATE POLICY "select_own_land_documents" ON public.land_documents FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.lands WHERE lands.id = land_documents.land_id AND lands.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "select_all_land_documents_admin" ON public.land_documents;
CREATE POLICY "select_all_land_documents_admin" ON public.land_documents FOR SELECT
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "insert_own_land_documents" ON public.land_documents;
CREATE POLICY "insert_own_land_documents" ON public.land_documents FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.lands WHERE lands.id = land_documents.land_id AND lands.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_land_documents" ON public.land_documents;
CREATE POLICY "delete_own_land_documents" ON public.land_documents FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.lands WHERE lands.id = land_documents.land_id AND lands.owner_id = auth.uid())
  );

-- Auto-update updated_at for lands
DROP TRIGGER IF EXISTS lands_updated_at ON public.lands;
CREATE TRIGGER lands_updated_at
  BEFORE UPDATE ON public.lands
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lands_owner_id ON public.lands(owner_id);
CREATE INDEX IF NOT EXISTS idx_lands_wilaya ON public.lands(wilaya);
CREATE INDEX IF NOT EXISTS idx_lands_commune ON public.lands(commune);
CREATE INDEX IF NOT EXISTS idx_lands_land_type ON public.lands(land_type);
CREATE INDEX IF NOT EXISTS idx_lands_offer_type ON public.lands(offer_type);
CREATE INDEX IF NOT EXISTS idx_lands_verification_status ON public.lands(verification_status);
CREATE INDEX IF NOT EXISTS idx_lands_is_published ON public.lands(is_published);
CREATE INDEX IF NOT EXISTS idx_lands_created_at ON public.lands(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_land_images_land_id ON public.land_images(land_id);
CREATE INDEX IF NOT EXISTS idx_land_documents_land_id ON public.land_documents(land_id);
