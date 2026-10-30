ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check
  CHECK (type = ANY (ARRAY['ACCOUNT_APPROVED'::text, 'REQUEST_UPDATE'::text, 'LAND_APPROVED'::text, 'LAND_REJECTED'::text, 'DOC_UPDATE'::text, 'NEW_MESSAGE'::text, 'CONTRACT_UPDATE'::text, 'CONTRACT_EXPIRING'::text, 'LEGAL_REPLY'::text, 'ADMIN_ALERT'::text, 'welcome'::text]));
