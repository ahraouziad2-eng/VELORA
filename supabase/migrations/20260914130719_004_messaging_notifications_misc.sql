/*
# Messaging, Notifications, Legal Services, Favorites, Reports, Reviews, Payments, Admin Actions, Audit Logs

1. New Tables
- `conversations` — conversation threads (type, related_id).
- `conversation_participants` — users in a conversation (composite PK: conversation_id + user_id).
- `messages` — messages in conversations (sender_id, content, attachment_url, is_read).
- `notifications` — user notifications (type, title, body, data, is_read).
- `legal_services` — catalog of legal service types.
- `legal_requests` — user legal assistance requests.
- `favorites` — user favorite lands.
- `reports` — user reports for lands, accounts, content.
- `reviews` — user reviews (rating 1-5, comment).
- `payments` — payment records (abstraction layer for future payment gateway).
- `admin_actions` — admin action log.
- `audit_logs` — system audit trail.

2. Security
- RLS on all tables. Users can only access their own notifications, conversations, favorites, legal requests, reports, reviews, payments.
- Admins can access all data. Legal services are public read.
- Conversation participants can only see conversations they're part of. Messages only visible to conversation participants.
- Reports: reporter can see own; admin can see all. Reviews: public read for published lands.

3. Notes
- All user_id/requester_id/reporter_id/reviewer_id columns default to auth.uid().
- Audit logs are insert-only (no update/delete policy for regular users).
*/

-- Conversations
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('INVESTMENT', 'RENTAL', 'PARTNERSHIP', 'GENERAL', 'LEGAL')),
  related_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Conversation participants
CREATE TABLE IF NOT EXISTS public.conversation_participants (
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);

-- Messages
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  attachment_url text,
  attachment_type text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('ACCOUNT_APPROVED', 'REQUEST_UPDATE', 'LAND_APPROVED', 'LAND_REJECTED', 'DOC_UPDATE', 'NEW_MESSAGE', 'CONTRACT_UPDATE', 'CONTRACT_EXPIRING', 'LEGAL_REPLY', 'ADMIN_ALERT')),
  title text NOT NULL,
  body text NOT NULL,
  data jsonb,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Legal services
CREATE TABLE IF NOT EXISTS public.legal_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('PROPERTY_CONSULTATION', 'DOC_REVIEW', 'RENT_CONTRACT_HELP', 'PARTNERSHIP_CONTRACT_HELP', 'LEGAL_GUIDANCE', 'DISPUTE_REPORT')),
  title text NOT NULL,
  description text NOT NULL,
  icon text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Legal requests
CREATE TABLE IF NOT EXISTS public.legal_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  service_type text NOT NULL CHECK (service_type IN ('PROPERTY_CONSULTATION', 'DOC_REVIEW', 'RENT_CONTRACT_HELP', 'PARTNERSHIP_CONTRACT_HELP', 'LEGAL_GUIDANCE', 'DISPUTE_REPORT')),
  description text NOT NULL,
  land_id uuid REFERENCES public.lands(id) ON DELETE SET NULL,
  priority text NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'COMPLETED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Favorites
CREATE TABLE IF NOT EXISTS public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  land_id uuid NOT NULL REFERENCES public.lands(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, land_id)
);

-- Reports
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  report_type text NOT NULL CHECK (report_type IN ('INCORRECT_LAND', 'SUSPICIOUS_DOC', 'FALSE_INFO', 'SUSPICIOUS_ACCOUNT', 'INAPPROPRIATE_CONTENT', 'FRAUD_ATTEMPT', 'OTHER')),
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Reviews
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(reviewer_id, target_type, target_id)
);

-- Payments
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount >= 0),
  currency text NOT NULL DEFAULT 'DZD',
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED')),
  reference text NOT NULL,
  related_type text,
  related_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Admin actions
CREATE TABLE IF NOT EXISTS public.admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Audit logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Conversation policies
DROP POLICY IF EXISTS "select_own_conversations" ON public.conversations;
CREATE POLICY "select_own_conversations" ON public.conversations FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.conversation_participants WHERE conversation_participants.conversation_id = conversations.id AND conversation_participants.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_conversations" ON public.conversations;
CREATE POLICY "insert_conversations" ON public.conversations FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_own_conversations" ON public.conversations;
CREATE POLICY "update_own_conversations" ON public.conversations FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.conversation_participants WHERE conversation_participants.conversation_id = conversations.id AND conversation_participants.user_id = auth.uid())
  );

-- Conversation participants policies
DROP POLICY IF EXISTS "select_own_conversation_participants" ON public.conversation_participants;
CREATE POLICY "select_own_conversation_participants" ON public.conversation_participants FOR SELECT
  TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = conversation_participants.conversation_id AND cp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "insert_conversation_participants" ON public.conversation_participants;
CREATE POLICY "insert_conversation_participants" ON public.conversation_participants FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- Messages policies
DROP POLICY IF EXISTS "select_own_messages" ON public.messages;
CREATE POLICY "select_own_messages" ON public.messages FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_participants.conversation_id = messages.conversation_id
      AND conversation_participants.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "insert_own_messages" ON public.messages;
CREATE POLICY "insert_own_messages" ON public.messages FOR INSERT
  TO authenticated WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_participants.conversation_id = messages.conversation_id
      AND conversation_participants.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "update_own_messages" ON public.messages;
CREATE POLICY "update_own_messages" ON public.messages FOR UPDATE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_participants.conversation_id = messages.conversation_id
      AND conversation_participants.user_id = auth.uid()
    )
  );

-- Notifications policies
DROP POLICY IF EXISTS "select_own_notifications" ON public.notifications;
CREATE POLICY "select_own_notifications" ON public.notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_notifications" ON public.notifications;
CREATE POLICY "update_own_notifications" ON public.notifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_notifications" ON public.notifications;
CREATE POLICY "insert_own_notifications" ON public.notifications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_notifications" ON public.notifications;
CREATE POLICY "delete_own_notifications" ON public.notifications FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Legal services (public read)
DROP POLICY IF EXISTS "select_legal_services" ON public.legal_services;
CREATE POLICY "select_legal_services" ON public.legal_services FOR SELECT
  TO authenticated USING (true);

-- Legal requests
DROP POLICY IF EXISTS "select_own_legal_requests" ON public.legal_requests;
CREATE POLICY "select_own_legal_requests" ON public.legal_requests FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "select_all_legal_requests_admin" ON public.legal_requests;
CREATE POLICY "select_all_legal_requests_admin" ON public.legal_requests FOR SELECT
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "insert_own_legal_requests" ON public.legal_requests;
CREATE POLICY "insert_own_legal_requests" ON public.legal_requests FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_legal_requests" ON public.legal_requests;
CREATE POLICY "update_own_legal_requests" ON public.legal_requests FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_legal_requests_admin" ON public.legal_requests;
CREATE POLICY "update_legal_requests_admin" ON public.legal_requests FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Favorites
DROP POLICY IF EXISTS "select_own_favorites" ON public.favorites;
CREATE POLICY "select_own_favorites" ON public.favorites FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_favorites" ON public.favorites;
CREATE POLICY "insert_own_favorites" ON public.favorites FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_favorites" ON public.favorites;
CREATE POLICY "delete_own_favorites" ON public.favorites FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Reports
DROP POLICY IF EXISTS "select_own_reports" ON public.reports;
CREATE POLICY "select_own_reports" ON public.reports FOR SELECT
  TO authenticated USING (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "select_all_reports_admin" ON public.reports;
CREATE POLICY "select_all_reports_admin" ON public.reports FOR SELECT
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "insert_own_reports" ON public.reports;
CREATE POLICY "insert_own_reports" ON public.reports FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "update_reports_admin" ON public.reports;
CREATE POLICY "update_reports_admin" ON public.reports FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Reviews
DROP POLICY IF EXISTS "select_reviews" ON public.reviews;
CREATE POLICY "select_reviews" ON public.reviews FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_reviews" ON public.reviews;
CREATE POLICY "insert_own_reviews" ON public.reviews FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = reviewer_id);

DROP POLICY IF EXISTS "delete_own_reviews" ON public.reviews;
CREATE POLICY "delete_own_reviews" ON public.reviews FOR DELETE
  TO authenticated USING (auth.uid() = reviewer_id);

-- Payments
DROP POLICY IF EXISTS "select_own_payments" ON public.payments;
CREATE POLICY "select_own_payments" ON public.payments FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_payments" ON public.payments;
CREATE POLICY "insert_own_payments" ON public.payments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- Admin actions
DROP POLICY IF EXISTS "select_admin_actions" ON public.admin_actions;
CREATE POLICY "select_admin_actions" ON public.admin_actions FOR SELECT
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "insert_admin_actions" ON public.admin_actions;
CREATE POLICY "insert_admin_actions" ON public.admin_actions FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

-- Audit logs
DROP POLICY IF EXISTS "select_audit_logs_admin" ON public.audit_logs;
CREATE POLICY "select_audit_logs_admin" ON public.audit_logs FOR SELECT
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "insert_audit_logs" ON public.audit_logs;
CREATE POLICY "insert_audit_logs" ON public.audit_logs FOR INSERT
  TO authenticated WITH CHECK (true);

-- Auto-update triggers
DROP TRIGGER IF EXISTS conversations_updated_at ON public.conversations;
CREATE TRIGGER conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS legal_requests_updated_at ON public.legal_requests;
CREATE TRIGGER legal_requests_updated_at
  BEFORE UPDATE ON public.legal_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS reports_updated_at ON public.reports;
CREATE TRIGGER reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON public.conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON public.conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_legal_requests_user_id ON public.legal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_legal_requests_status ON public.legal_requests(status);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_land_id ON public.favorites(land_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON public.reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reviews_target ON public.reviews(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON public.reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_id ON public.admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
