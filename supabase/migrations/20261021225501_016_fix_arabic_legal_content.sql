/*
# Fix non-Arabic text in Arabic legal documents

## Problem
The seeded Arabic legal documents contained:
1. Chinese characters "欢迎使用" in the Terms intro line (should be pure Arabic)
2. A mixed-language typo "ت facilit التواصل" in the Privacy Policy section 2

## Fix
This migration UPDATEs the affected rows in `legal_documents` to replace
the corrupted text with correct Arabic. Only the Arabic ('ar') rows are
touched; French and English rows remain unchanged.

## Safety
- No schema changes, no new tables, no RLS changes.
- Only updates two rows (PRIVACY_POLICY ar, TERMS_AND_STANDARDS ar).
- Idempotent: re-running produces the same correct content.
*/

-- Fix Arabic Privacy Policy: remove "ت facilit التواصل" → "تسهيل التواصل"
UPDATE legal_documents
SET content = replace(content, 'ت facilit التواصل', 'تسهيل التواصل'),
    updated_at = now()
WHERE document_type = 'PRIVACY_POLICY'
  AND locale = 'ar'
  AND content LIKE '%ت facilit%';

-- Fix Arabic Terms: replace the Chinese intro line with correct Arabic
UPDATE legal_documents
SET content = replace(content, '欢迎使用 منصة VELORA. باستخدامك للمنصة فإنك توافق على الشروط التالية.', 'مرحبًا بك في منصة VELORA. باستخدامك للمنصة، فإنك توافق على شروط الاستخدام التالية:'),
    updated_at = now()
WHERE document_type = 'TERMS_AND_STANDARDS'
  AND locale = 'ar'
  AND content LIKE '%欢迎使用%';