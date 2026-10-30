/*
# Add AI knowledge base and usage tracking tables

## Overview
This migration adds tables for the VELORA AI assistant:
- `ai_knowledge`: FAQ and knowledge articles the assistant uses for grounding
- `ai_usage_stats`: Aggregated usage metrics (no personal messages stored)

## New Tables

### 1. ai_knowledge
Stores verified FAQ entries and knowledge articles about VELORA features.
- `id` (uuid PK)
- `question` (text) — the question or topic
- `answer` (text) — the verified answer
- `category` (text) — e.g. 'account', 'lands', 'services', 'general'
- `locale` (text) — 'ar', 'fr', 'en', or 'all' for language-independent entries
- `is_published` (boolean, default true)
- `display_order` (int, default 0)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### 2. ai_usage_stats
Aggregated daily usage statistics for the AI assistant. No personal messages are stored.
- `id` (uuid PK)
- `date` (date, unique) — the day
- `total_requests` (int, default 0)
- `successful_requests` (int, default 0)
- `failed_requests` (int, default 0)
- `guest_requests` (int, default 0)
- `authenticated_requests` (int, default 0)
- `created_at` (timestamptz)

## Security (RLS)

### ai_knowledge
- SELECT: public (anon + authenticated) — published entries visible to all
- INSERT/UPDATE/DELETE: admin only (is_admin())

### ai_usage_stats
- SELECT: admin only (is_admin())
- INSERT/UPDATE: admin only — the edge function uses service role which bypasses RLS

## Seed Data
Seeded with verified VELORA FAQs covering account, lands, services, and general questions.
*/

-- ============================================================
-- ai_knowledge
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_knowledge (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  locale text NOT NULL DEFAULT 'all' CHECK (locale IN ('ar', 'fr', 'en', 'all')),
  is_published boolean NOT NULL DEFAULT true,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ai_knowledge ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_ai_knowledge" ON ai_knowledge;
CREATE POLICY "select_ai_knowledge" ON ai_knowledge FOR SELECT
  TO anon, authenticated USING (is_published = true);

DROP POLICY IF EXISTS "insert_ai_knowledge_admin" ON ai_knowledge;
CREATE POLICY "insert_ai_knowledge_admin" ON ai_knowledge FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "update_ai_knowledge_admin" ON ai_knowledge;
CREATE POLICY "update_ai_knowledge_admin" ON ai_knowledge FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "delete_ai_knowledge_admin" ON ai_knowledge;
CREATE POLICY "delete_ai_knowledge_admin" ON ai_knowledge FOR DELETE
  TO authenticated USING (is_admin());

-- ============================================================
-- ai_usage_stats
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_usage_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date UNIQUE NOT NULL DEFAULT CURRENT_DATE,
  total_requests int NOT NULL DEFAULT 0,
  successful_requests int NOT NULL DEFAULT 0,
  failed_requests int NOT NULL DEFAULT 0,
  guest_requests int NOT NULL DEFAULT 0,
  authenticated_requests int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ai_usage_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_ai_usage_stats_admin" ON ai_usage_stats;
CREATE POLICY "select_ai_usage_stats_admin" ON ai_usage_stats FOR SELECT
  TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "insert_ai_usage_stats_admin" ON ai_usage_stats;
CREATE POLICY "insert_ai_usage_stats_admin" ON ai_usage_stats FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "update_ai_usage_stats_admin" ON ai_usage_stats;
CREATE POLICY "update_ai_usage_stats_admin" ON ai_usage_stats FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE INDEX IF NOT EXISTS idx_ai_knowledge_category ON ai_knowledge(category);
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_locale ON ai_knowledge(locale);

-- ============================================================
-- Seed: VELORA FAQs
-- ============================================================
INSERT INTO ai_knowledge (question, answer, category, locale, display_order) VALUES
('كيف أنشئ حساب في VELORA؟', 'لإنشاء حساب: افتح التطبيق، اضغط على "إنشاء حساب"، أدخل الاسم الكامل والبريد الإلكتروني وكلمة المرور والولاية والبلدية. بعد التسجيل يمكنك تسجيل الدخول مباشرة دون الحاجة لتأكيد البريد.', 'account', 'ar', 1),
('كيف أسجل الدخول؟', 'اضغط على "تسجيل الدخول" في صفحة البداية، أدخل بريدك الإلكتروني وكلمة المرور، ثم اضغط دخول.', 'account', 'ar', 2),
('هل يمكنني تصفح التطبيق دون حساب؟', 'نعم، VELORA يدعم وضع الزائر (Guest Mode) الذي يتيح تصفح الأراضي والخدمات دون إنشاء حساب. يمكنك إنشاء حساب في أي وقت للوصول إلى كل الميزات.', 'account', 'ar', 3),
('كيف أستعيد كلمة المرور؟', 'من صفحة تسجيل الدخول، اضغط "نسيت كلمة المرور"، أدخل بريدك الإلكتروني، وسيتم إرسال رابط إعادة التعيين إلى بريدك.', 'account', 'ar', 4),
('كيف أضيف أرضًا؟', 'بعد تسجيل الدخول، اذهب إلى صفحة "أراضي" من القائمة، اضغط على زر "+"، املأ معلومات الأرض (الاسم، الولاية، البلدية، المساحة، النوع، نوع العرض، السعر)، أضف الصور والوثائق، ثم أرسل. سيتم مراجعة الأرض من قبل الإدارة قبل نشرها.', 'lands', 'ar', 5),
('ما هي حالات الأراضي؟', 'الأراضي تمر بأربع حالات: قيد المراجعة (PENDING_REVIEW) عند الإرسال، موثقة (VERIFIED) بعد موافقة الإدارة، مرفوضة (REJECTED)، أو تحتاج معلومات إضافية (NEEDS_INFO).', 'lands', 'ar', 6),
('كيف أبحث عن أراضي؟', 'استخدم صفحة "استكشاف" للبحث عن الأراضي المتاحة. يمكنك التصفية حسب الولاية ونوع العرض (إيجار، شراكة، استثمار). كما يمكنك استخدام الخريطة لتحديد المواقع.', 'lands', 'ar', 7),
('ما هي خدمات VELORA؟', 'VELORA يقدم: إدارة الأراضي العقارية، الاستثمار والشراكات، الإيجار، الوظائف والتوظيف، التأمين الزراعي، الإعلانات والفرص، الخدمات القانونية، والرسائل بين المستخدمين.', 'services', 'ar', 8),
('كيف أتقدم لوظيفة؟', 'اذهب إلى صفحة "الوظائف"، تصفح الوظائف المتاحة، اضغط "تقديم" على الوظيفة المناسبة، اكتب رسالة التقديم وأضف رابط سيرتك الذاتية، ثم أرسل.', 'services', 'ar', 9),
('كيف أطلب تأمينًا؟', 'اذهب إلى صفحة "التأمين"، اضغط "طلب عرض سعر"، اختر نوع التأمين (محاصيل، ماشية، معدات...)، املأ الوصف والولاية ومعلومات الاتصال، ثم أرسل. سيقوم الإدارة بمراجعة طلبك.', 'services', 'ar', 10),
('كيف أنشر إعلانًا؟', 'اذهب إلى صفحة "الإعلانات"، اضغط زر "+"، اختر الفئة (معدات، بذور، أسمدة...)، املأ العنوان والوصف والسعر والولاية، أضف رابط صورة إن وجد، ثم أرسل. سيتم مراجعة الإعلان قبل النشر.', 'services', 'ar', 11),
('كيف أتواصل مع الدعم؟', 'استخدم صفحة "تواصل معنا" المتاحة من الإعدادات أو صفحة "من نحن". املأ النموذج بالاسم والبريد والموضوع والرسالة وسيصل للإدارة.', 'general', 'ar', 12),
('What services does VELORA offer?', 'VELORA offers: land/property management, investment and partnerships, rentals, jobs and recruitment, agricultural insurance, ads and opportunities, legal services, and messaging between users.', 'services', 'en', 13),
('How do I add a land listing?', 'After logging in, go to "My Lands" from the profile menu, tap the "+" button, fill in the land details (name, wilaya, commune, area, type, offer type, price), add images and documents, then submit. The land will be reviewed by administration before publishing.', 'lands', 'en', 14),
('Can I browse without an account?', 'Yes, VELORA supports a Guest Mode that allows browsing lands and services without creating an account. You can create an account at any time to access all features.', 'account', 'en', 15),
('Quels services VELORA propose-t-il?', 'VELORA propose: gestion des terrains, investissement et partenariats, location, emplois et recrutement, assurance agricole, annonces et opportunités, services juridiques, et messagerie entre utilisateurs.', 'services', 'fr', 16),
('Comment ajouter un terrain?', 'Après connexion, allez dans "Mes terrains" depuis le menu profil, appuyez sur le bouton "+", remplissez les détails du terrain (nom, wilaya, commune, superficie, type, type d''offre, prix), ajoutez des images et documents, puis soumettez. Le terrain sera examiné par l''administration avant publication.', 'lands', 'fr', 17),
('Puis-je naviguer sans compte?', 'Oui, VELORA prend en charge un mode invité qui permet de parcourir les terrains et services sans créer de compte. Vous pouvez créer un compte à tout moment pour accéder à toutes les fonctionnalités.', 'account', 'fr', 18)
ON CONFLICT DO NOTHING;
