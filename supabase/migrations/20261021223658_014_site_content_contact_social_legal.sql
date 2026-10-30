/*
# Add site content, contact messages, social links, and legal documents tables

## Overview
This migration adds 4 new tables to support editable site content, a contact form inbox,
configurable social media links, and editable legal documents (privacy policy & terms).

## New Tables

### 1. site_content
Stores key-value editable content for the About Us page and contact info.
- `id` (uuid PK)
- `key` (text, unique) — e.g. 'about_ar', 'about_fr', 'about_en', 'contact_email', 'contact_phone', 'contact_address'
- `value` (text)
- `updated_at` (timestamptz)
- `updated_by` (uuid, references auth.users)

### 2. legal_documents
Stores editable legal documents (privacy policy, terms & standards) per language.
- `id` (uuid PK)
- `document_type` (text, CHECK in 'PRIVACY_POLICY', 'TERMS_AND_STANDARDS')
- `locale` (text, CHECK in 'ar', 'fr', 'en')
- `content` (text)
- `updated_at` (timestamptz)
- `updated_by` (uuid, references auth.users)
- Unique constraint on (document_type, locale)

### 3. contact_messages
Stores contact form submissions from users/guests.
- `id` (uuid PK)
- `name` (text)
- `email` (text)
- `subject` (text)
- `message` (text)
- `status` (text, CHECK in 'NEW', 'PENDING', 'RESOLVED', 'ARCHIVED', default 'NEW')
- `admin_reply` (text, nullable)
- `user_id` (uuid, nullable — set if submitter is logged in)
- `created_at` (timestamptz)

### 4. social_links
Stores configurable social media links.
- `id` (uuid PK)
- `platform` (text, NOT NULL) — e.g. 'facebook', 'instagram', 'tiktok', 'youtube', 'linkedin', 'whatsapp'
- `url` (text, NOT NULL)
- `display_name` (text, nullable)
- `icon_name` (text, nullable) — lucide icon name
- `display_order` (int, default 0)
- `is_enabled` (boolean, default false)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

## Security (RLS)

### site_content
- SELECT: public (anon + authenticated) — all site visitors can read content
- INSERT/UPDATE/DELETE: admin only (is_admin())

### legal_documents
- SELECT: public (anon + authenticated)
- INSERT/UPDATE/DELETE: admin only (is_admin())

### contact_messages
- SELECT: admin only (is_admin()) — submissions are private
- INSERT: public (anon + authenticated) — anyone can submit a contact message
- UPDATE/DELETE: admin only (is_admin())

### social_links
- SELECT: public (anon + authenticated) — all visitors can see enabled links
- INSERT/UPDATE/DELETE: admin only (is_admin())

## Seed Data
- Default legal documents (privacy policy & terms) seeded for ar/fr/en with placeholder content
- Default site content keys seeded with placeholder text
*/

-- ============================================================
-- site_content
-- ============================================================
CREATE TABLE IF NOT EXISTS site_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_site_content" ON site_content;
CREATE POLICY "select_site_content" ON site_content FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_site_content_admin" ON site_content;
CREATE POLICY "insert_site_content_admin" ON site_content FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "update_site_content_admin" ON site_content;
CREATE POLICY "update_site_content_admin" ON site_content FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "delete_site_content_admin" ON site_content;
CREATE POLICY "delete_site_content_admin" ON site_content FOR DELETE
  TO authenticated USING (is_admin());

-- ============================================================
-- legal_documents
-- ============================================================
CREATE TABLE IF NOT EXISTS legal_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type text NOT NULL CHECK (document_type IN ('PRIVACY_POLICY', 'TERMS_AND_STANDARDS')),
  locale text NOT NULL CHECK (locale IN ('ar', 'fr', 'en')),
  content text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE (document_type, locale)
);

ALTER TABLE legal_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_legal_documents" ON legal_documents;
CREATE POLICY "select_legal_documents" ON legal_documents FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_legal_documents_admin" ON legal_documents;
CREATE POLICY "insert_legal_documents_admin" ON legal_documents FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "update_legal_documents_admin" ON legal_documents;
CREATE POLICY "update_legal_documents_admin" ON legal_documents FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "delete_legal_documents_admin" ON legal_documents;
CREATE POLICY "delete_legal_documents_admin" ON legal_documents FOR DELETE
  TO authenticated USING (is_admin());

-- ============================================================
-- contact_messages
-- ============================================================
CREATE TABLE IF NOT EXISTS contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'PENDING', 'RESOLVED', 'ARCHIVED')),
  admin_reply text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_contact_messages_admin" ON contact_messages;
CREATE POLICY "select_contact_messages_admin" ON contact_messages FOR SELECT
  TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "insert_contact_messages_public" ON contact_messages;
CREATE POLICY "insert_contact_messages_public" ON contact_messages FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_contact_messages_admin" ON contact_messages;
CREATE POLICY "update_contact_messages_admin" ON contact_messages FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "delete_contact_messages_admin" ON contact_messages;
CREATE POLICY "delete_contact_messages_admin" ON contact_messages FOR DELETE
  TO authenticated USING (is_admin());

-- ============================================================
-- social_links
-- ============================================================
CREATE TABLE IF NOT EXISTS social_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL,
  url text NOT NULL,
  display_name text,
  icon_name text,
  display_order int NOT NULL DEFAULT 0,
  is_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE social_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_social_links" ON social_links;
CREATE POLICY "select_social_links" ON social_links FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_social_links_admin" ON social_links;
CREATE POLICY "insert_social_links_admin" ON social_links FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "update_social_links_admin" ON social_links;
CREATE POLICY "update_social_links_admin" ON social_links FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "delete_social_links_admin" ON social_links;
CREATE POLICY "delete_social_links_admin" ON social_links FOR DELETE
  TO authenticated USING (is_admin());

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_links_display_order ON social_links(display_order);
CREATE INDEX IF NOT EXISTS idx_legal_documents_type_locale ON legal_documents(document_type, locale);

-- ============================================================
-- Seed: site_content defaults
-- ============================================================
INSERT INTO site_content (key, value) VALUES
  ('contact_email', ''),
  ('contact_phone', ''),
  ('contact_address_ar', ''),
  ('contact_address_fr', ''),
  ('contact_address_en', ''),
  ('about_ar', 'VELORA هي منصة موحدة تربط بين الاستثمار والخدمات المهنية، وتوفر تجربة رقمية ذكية لاكتشاف الفرص وإدارة الطلبات والوثائق بسهولة وثقة.'),
  ('about_fr', 'VELORA est une plateforme unifiée qui relie investissement et services professionnels, offrant une expérience numérique intelligente pour découvrir les opportunités et gérer les demandes et documents en toute confiance.'),
  ('about_en', 'VELORA is a unified platform connecting investment and professional services, providing a smart digital experience to discover opportunities and manage requests and documents with ease and confidence.')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- Seed: legal_documents defaults
-- ============================================================
INSERT INTO legal_documents (document_type, locale, content) VALUES
  ('PRIVACY_POLICY', 'ar', 'سياسة الخصوصية

تلتزم منصة VELORA بحماية خصوصية مستخدميها وبياناتهم الشخصية. توضح هذه السياسة كيفية جمع بياناتك واستخدامها وحمايتها.

1. البيانات التي نجمعها
- بيانات الحساب: الاسم واللقب، البريد الإلكتروني، رقم الهاتف، الولاية والبلدية.
- بيانات الملف الشخصي: النبذة، الخبرة، الصورة الشخصية.
- الأراضي والوثائق: معلومات الأراضي التي تضيفها والوثائق المرتبطة بها.
- الطلبات والرسائل: طلبات الاستثمار والإيجار والشراكة، الرسائل بين المستخدمين.
- بيانات الموقع: عند استخدام ميزة الخريطة، قد يتم تخزين إحداثيات الأراضي.

2. الغرض من المعالجة
- إنشاء وإدارة حسابك ومصادقتك.
- نشر وإدارة الأراضي والطلبات.
- تسهيل التواصل بين المستخدمين والخدمات.
- تحسين خدمات المنصة وأمانها.

3. الأساس القانوني
- الموافقة: عند إنشاء حسابك وقبولك لشروط الاستخدام.
- تنفيذ العقد: لتقديم الخدمات التي طلبتها.
- الالتزام القانوني: عند اقتضاء ذلك.

4. تخزين البيانات وأمانها
- تُخزن البيانات في قواعد بيانات آمنة مع تفعيل حماية الصلاحيات (RLS).
- لا يتم مشاركة بياناتك مع أطراف ثالثة دون موافقتك.

5. حقوق المستخدم
- حق الوصول إلى بياناتك والاطلاع عليها.
- حق تصحيح أو حذف بياناتك.
- حق طلب حذف حسابك عبر إعدادات التطبيق.
- للتواصل بخصوص الخصوصية: استخدم صفحة "تواصل معنا".

6. مقدمو الخدمات الخارجيون
- نستخدم Supabase لتخزين البيانات والمصادقة.

آخر تحديث: يتم عرض تاريخ آخر تحديث في صفحة سياسة الخصوصية.'),
  ('PRIVACY_POLICY', 'fr', 'Politique de confidentialité

La plateforme VELORA s''engage à protéger la vie privée de ses utilisateurs. Cette politique explique comment vos données sont collectées, utilisées et protégées.

1. Données collectées
- Données de compte: nom, e-mail, téléphone, wilaya, commune.
- Profil: bio, expérience, photo de profil.
- Terrains et documents: informations sur les terrains et documents associés.
- Demandes et messages: demandes d''investissement, location, partenariat, messages.
- Données de localisation: coordonnées des terrains lors de l''utilisation de la carte.

2. Finalité du traitement
- Création et gestion de votre compte.
- Publication et gestion des terrains et demandes.
- Communication entre utilisateurs.
- Amélioration des services et de la sécurité.

3. Base légale
- Consentement: lors de la création du compte.
- Exécution du contrat: pour fournir les services demandés.
- Obligations légales: lorsque requis.

4. Stockage et sécurité
- Données stockées dans des bases de données sécurisées avec RLS.
- Vos données ne sont pas partagées avec des tiers sans votre consentement.

5. Droits des utilisateurs
- Droit d''accès à vos données.
- Droit de rectification ou de suppression.
- Droit de demander la suppression de votre compte via les paramètres.
- Contact privacy: utilisez la page "Contact".

6. Prestataires externes
- Nous utilisons Supabase pour le stockage et l''authentification.

Dernière mise à jour: affichée sur la page de la politique de confidentialité.'),
  ('PRIVACY_POLICY', 'en', 'Privacy Policy

The VELORA platform is committed to protecting the privacy of its users. This policy explains how your data is collected, used, and protected.

1. Data We Collect
- Account data: full name, email, phone, wilaya, commune.
- Profile data: bio, experience, profile photo.
- Lands and documents: land information and associated documents you add.
- Requests and messages: investment, rental, partnership requests, messages between users.
- Location data: land coordinates when using the map feature.

2. Purpose of Processing
- Creating and managing your account and authentication.
- Publishing and managing lands and requests.
- Facilitating communication between users and services.
- Improving platform services and security.

3. Lawful Basis
- Consent: when you create an account and accept the terms.
- Contract performance: to provide the services you requested.
- Legal obligations: when required by law.

4. Data Storage and Security
- Data is stored in secure databases with Row Level Security (RLS) enabled.
- Your data is not shared with third parties without your consent.

5. User Rights
- Right to access your data.
- Right to correct or delete your data.
- Right to request account deletion via app settings.
- For privacy inquiries: use the "Contact Us" page.

6. Third-Party Providers
- We use Supabase for data storage and authentication.

Last updated: displayed on the privacy policy page.'),
  ('TERMS_AND_STANDARDS', 'ar', 'الشروط والمعايير

مرحبًا بك في منصة VELORA. باستخدامك للمنصة، فإنك توافق على شروط الاستخدام التالية:

1. مسؤوليات المستخدم
- تقديم معلومات صحيحة عند إنشاء الحساب.
- الحفاظ على سرية كلمة المرور وأمان حسابك.
- استخدام المنصة بشكل قانوني وأخلاقي.

2. الأراضي والإدراج
- يجب أن تكون المعلومات العقارية صحيحة ومملوكة أو مصرح بها قانونياً.
- تُراجع جميع الأراضي من قبل الإدارة قبل النشر.
- يُمنع نشر أراضٍ وهمية أو مضللة.

3. الوظائف والإعلانات والطلبات
- يجب أن تكون عناوين الوظائف والإعلانات حقيقية وواضحة.
- يُمنع الاحتيال أو انتحال الشخصيات.
- تُراجع الإعلانات والوظائف قبل النشر.

4. المحتوى الممنوع
- الاحتيال أو تقديم معلومات مضللة.
- انتحال شخصية الغير.
- المحتوى المسيء أو المخالف للقانون.
- السلوك المسيء تجاه المستخدمين الآخرين.

5. الإشراف والشكاوى
- تحتفظ الإدارة بحق مراجعة أو حذف أي محتوى مخالف.
- يمكن للمستخدمين الإبلاغ عن المحتوى المخالف عبر ميزة "إبلاغ".
- يمكن للمستخدمين تقديم شكوى أو طعن عبر صفحة "تواصل معنا".
- قد يتم تعليق أو إيقاف الحسابات المخالفة.

6. حدود المنصة
- المنصة وسيط تنظيمي وليست جهة قانونية ملزمة.
- يُنصح بالرجوع للجهات المختصة للتحقق القانوني النهائي.
- لا تضمن المنصة نتائج الصفقات أو العقود.

7. التواصل والإبلاغ
- للبلاغات: استخدم ميزة "إبلاغ" داخل التطبيق.
- للشكاوى أو الاستفسارات: استخدم صفحة "تواصل معنا".

آخر تحديث: يتم عرض تاريخ آخر تحديث في الصفحة.'),
  ('TERMS_AND_STANDARDS', 'fr', 'Conditions et normes

En utilisant la plateforme VELORA, vous acceptez les conditions suivantes.

1. Responsabilités de l''utilisateur
- Fournir des informations exactes lors de la création du compte.
- Maintenir la confidentialité de votre mot de passe.
- Utiliser la plateforme de manière légale et éthique.

2. Terrains et annonces
- Les informations sur les terrains doivent être exactes et légitimes.
- Tous les terrains sont examinés par l''administration avant publication.
- Les annonces fictives ou trompeuses sont interdites.

3. Emplois, annonces et demandes
- Les titres d''emploi et d''annonce doivent être réels et clairs.
- La fraude et l''usurpation d''identité sont interdites.
- Les annonces et emplois sont examinés avant publication.

4. Contenu interdit
- Fraude ou informations trompeuses.
- Usurpation d''identité d''autrui.
- Contenu abusif ou illégal.
- Comportement abusif envers d''autres utilisateurs.

5. Modération et plaintes
- L''administration se réserve le droit de examiner ou supprimer tout contenu non conforme.
- Les utilisateurs peuvent signaler via la fonction "Signaler".
- Les utilisateurs peuvent déposer une plainte via la page "Contact".
- Les comptes non conformes peuvent être suspendus.

6. Limites de la plateforme
- La plateforme est un intermédiaire, pas une autorité légale.
- Consultez les autorités compétentes pour la vérification légale finale.
- La plateforme ne garantit pas les résultats des transactions.

7. Contact et signalement
- Pour les signalements: utilisez la fonction "Signaler".
- Pour les plaintes: utilisez la page "Contact".

Dernière mise à jour: affichée sur la page.'),
  ('TERMS_AND_STANDARDS', 'en', 'Terms and Standards

By using the VELORA platform, you agree to the following terms.

1. User Responsibilities
- Provide accurate information when creating your account.
- Keep your password confidential and secure.
- Use the platform legally and ethically.

2. Lands and Listings
- Property information must be accurate and legally owned or authorized.
- All lands are reviewed by administration before publication.
- Fake or misleading listings are prohibited.

3. Jobs, Ads, and Requests
- Job titles and ads must be real and clear.
- Fraud or impersonation is prohibited.
- Ads and jobs are reviewed before publication.

4. Prohibited Content
- Fraud or misleading information.
- Impersonating others.
- Abusive or illegal content.
- Abusive behavior toward other users.

5. Moderation and Complaints
- Administration reserves the right to review or remove non-compliant content.
- Users can report via the "Report" feature.
- Users can file a complaint via the "Contact" page.
- Non-compliant accounts may be suspended.

6. Platform Limitations
- The platform is an organizational intermediary, not a legal authority.
- Consult competent authorities for final legal verification.
- The platform does not guarantee transaction outcomes.

7. Contact and Reporting
- For reports: use the "Report" feature in the app.
- For complaints: use the "Contact Us" page.

Last updated: displayed on the page.')
ON CONFLICT (document_type, locale) DO NOTHING;
