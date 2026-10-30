/*
# Storage Buckets and Seed Data

1. Storage Buckets
- profile-images: public read, authenticated write
- land-images: public read, authenticated write
- land-documents: private, authenticated read/write
- project-documents: private, authenticated read/write
- messages: private, authenticated read/write
- contracts: private, authenticated read/write

2. Seed Data
- Legal services catalog (6 services)
*/

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-images', 'profile-images', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('land-images', 'land-images', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('land-documents', 'land-documents', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('project-documents', 'project-documents', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('messages', 'messages', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('contracts', 'contracts', false) ON CONFLICT DO NOTHING;

-- Profile images policies
DROP POLICY IF EXISTS "select_profile_images" ON storage.objects;
CREATE POLICY "select_profile_images" ON storage.objects FOR SELECT
  TO authenticated USING (bucket_id = 'profile-images');

DROP POLICY IF EXISTS "insert_profile_images" ON storage.objects;
CREATE POLICY "insert_profile_images" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'profile-images');

DROP POLICY IF EXISTS "update_profile_images" ON storage.objects;
CREATE POLICY "update_profile_images" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'profile-images');

DROP POLICY IF EXISTS "delete_profile_images" ON storage.objects;
CREATE POLICY "delete_profile_images" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'profile-images');

-- Land images policies (public read, authenticated write)
DROP POLICY IF EXISTS "select_land_images_storage" ON storage.objects;
CREATE POLICY "select_land_images_storage" ON storage.objects FOR SELECT
  TO authenticated USING (bucket_id = 'land-images');

DROP POLICY IF EXISTS "insert_land_images_storage" ON storage.objects;
CREATE POLICY "insert_land_images_storage" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'land-images');

DROP POLICY IF EXISTS "update_land_images_storage" ON storage.objects;
CREATE POLICY "update_land_images_storage" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'land-images');

DROP POLICY IF EXISTS "delete_land_images_storage" ON storage.objects;
CREATE POLICY "delete_land_images_storage" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'land-images');

-- Land documents policies (private)
DROP POLICY IF EXISTS "select_land_documents_storage" ON storage.objects;
CREATE POLICY "select_land_documents_storage" ON storage.objects FOR SELECT
  TO authenticated USING (bucket_id = 'land-documents');

DROP POLICY IF EXISTS "insert_land_documents_storage" ON storage.objects;
CREATE POLICY "insert_land_documents_storage" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'land-documents');

DROP POLICY IF EXISTS "delete_land_documents_storage" ON storage.objects;
CREATE POLICY "delete_land_documents_storage" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'land-documents');

-- Project documents policies (private)
DROP POLICY IF EXISTS "select_project_documents_storage" ON storage.objects;
CREATE POLICY "select_project_documents_storage" ON storage.objects FOR SELECT
  TO authenticated USING (bucket_id = 'project-documents');

DROP POLICY IF EXISTS "insert_project_documents_storage" ON storage.objects;
CREATE POLICY "insert_project_documents_storage" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'project-documents');

-- Messages policies (private)
DROP POLICY IF EXISTS "select_messages_storage" ON storage.objects;
CREATE POLICY "select_messages_storage" ON storage.objects FOR SELECT
  TO authenticated USING (bucket_id = 'messages');

DROP POLICY IF EXISTS "insert_messages_storage" ON storage.objects;
CREATE POLICY "insert_messages_storage" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'messages');

-- Contracts policies (private)
DROP POLICY IF EXISTS "select_contracts_storage" ON storage.objects;
CREATE POLICY "select_contracts_storage" ON storage.objects FOR SELECT
  TO authenticated USING (bucket_id = 'contracts');

DROP POLICY IF EXISTS "insert_contracts_storage" ON storage.objects;
CREATE POLICY "insert_contracts_storage" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'contracts');

-- Seed legal services
INSERT INTO public.legal_services (type, title, description, icon) VALUES
  ('PROPERTY_CONSULTATION', 'استشارة عقارية', 'استشارة حول العقارات والأراضي الفلاحية', 'landmark'),
  ('DOC_REVIEW', 'مراجعة وثيقة', 'مراجعة الوثائق العقارية', 'file-text'),
  ('RENT_CONTRACT_HELP', 'مساعدة في عقد إيجار', 'مساعدة في صياغة ومراجعة عقود الإيجار', 'file-signature'),
  ('PARTNERSHIP_CONTRACT_HELP', 'مساعدة في عقد شراكة', 'مساعدة في عقود الشراكة الفلاحية', 'handshake'),
  ('LEGAL_GUIDANCE', 'توجيه قانوني', 'إرشاد قانوني حول الاستثمار الفلاحي', 'scale'),
  ('DISPUTE_REPORT', 'الإبلاغ عن نزاع', 'الإبلاغ عن نزاع عقاري أو فلاحي', 'alert-triangle')
ON CONFLICT DO NOTHING;
