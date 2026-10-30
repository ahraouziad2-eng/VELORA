/*
# Require contact information on every listing

1. Modified tables
- `lands`: adds `contact_phone`, `contact_whatsapp`, `contact_name` (all optional text columns).
- `advertisements`: adds the same three columns.

2. Format rules (CHECK constraints)
- `contact_phone` must be an Algerian number in international form, +213 followed by 9 digits (landline or mobile). Empty is allowed for older listings.
- `contact_whatsapp` must be an Algerian mobile number, +213 followed by 9 digits starting with 5, 6 or 7.

3. Presence rule (trigger)
- A new listing, or an existing listing whose contact fields are changed, must have a phone number or a WhatsApp number. The database rejects the save otherwise, so the rule cannot be bypassed from the app.
- Older listings that never had a number are not touched. They keep working and show a "no contact provided" message.

4. Demo data
- Demo listings receive their owner's demo phone number in international form, so the contact buttons work on demo pages.

5. Security
- The trigger function is not callable by app roles.
- No existing rows are deleted or rewritten except the demo contact backfill.
*/

ALTER TABLE public.lands
  ADD COLUMN IF NOT EXISTS contact_phone text,
  ADD COLUMN IF NOT EXISTS contact_whatsapp text,
  ADD COLUMN IF NOT EXISTS contact_name text;

ALTER TABLE public.advertisements
  ADD COLUMN IF NOT EXISTS contact_phone text,
  ADD COLUMN IF NOT EXISTS contact_whatsapp text,
  ADD COLUMN IF NOT EXISTS contact_name text;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lands_contact_phone_format') THEN
    ALTER TABLE public.lands ADD CONSTRAINT lands_contact_phone_format
      CHECK (contact_phone IS NULL OR contact_phone ~ '^\+213[2-7][0-9]{8}$');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lands_contact_whatsapp_format') THEN
    ALTER TABLE public.lands ADD CONSTRAINT lands_contact_whatsapp_format
      CHECK (contact_whatsapp IS NULL OR contact_whatsapp ~ '^\+213[5-7][0-9]{8}$');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'advertisements_contact_phone_format') THEN
    ALTER TABLE public.advertisements ADD CONSTRAINT advertisements_contact_phone_format
      CHECK (contact_phone IS NULL OR contact_phone ~ '^\+213[2-7][0-9]{8}$');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'advertisements_contact_whatsapp_format') THEN
    ALTER TABLE public.advertisements ADD CONSTRAINT advertisements_contact_whatsapp_format
      CHECK (contact_whatsapp IS NULL OR contact_whatsapp ~ '^\+213[5-7][0-9]{8}$');
  END IF;
END $$;

UPDATE public.lands l
SET contact_phone = '+213' || substring(regexp_replace(p.phone, '\D', '', 'g') from 2),
    contact_whatsapp = '+213' || substring(regexp_replace(p.phone, '\D', '', 'g') from 2),
    contact_name = p.full_name
FROM public.profiles p
WHERE p.id = l.owner_id
  AND l.is_demo
  AND l.contact_phone IS NULL
  AND p.phone IS NOT NULL;

UPDATE public.advertisements a
SET contact_phone = '+213' || substring(regexp_replace(p.phone, '\D', '', 'g') from 2),
    contact_whatsapp = '+213' || substring(regexp_replace(p.phone, '\D', '', 'g') from 2),
    contact_name = p.full_name
FROM public.profiles p
WHERE p.id = a.poster_id
  AND a.is_demo
  AND a.contact_phone IS NULL
  AND p.phone IS NOT NULL;

CREATE OR REPLACE FUNCTION public.require_contact_info()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.contact_phone IS NULL AND NEW.contact_whatsapp IS NULL THEN
    RAISE EXCEPTION 'contact_info_required'
      USING ERRCODE = 'check_violation',
            HINT = 'Provide a phone number or a WhatsApp number.';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.require_contact_info() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_lands_require_contact ON public.lands;
CREATE TRIGGER trg_lands_require_contact
  BEFORE INSERT OR UPDATE OF contact_phone, contact_whatsapp ON public.lands
  FOR EACH ROW EXECUTE FUNCTION public.require_contact_info();

DROP TRIGGER IF EXISTS trg_advertisements_require_contact ON public.advertisements;
CREATE TRIGGER trg_advertisements_require_contact
  BEFORE INSERT OR UPDATE OF contact_phone, contact_whatsapp ON public.advertisements
  FOR EACH ROW EXECUTE FUNCTION public.require_contact_info();
