export const PHONE_EXAMPLE = '0555 12 34 56';

export interface ContactDraft {
  phone: string;
  whatsapp: string;
  sameAsPhone: boolean;
  name: string;
  saveToAccount: boolean;
}

export interface ContactErrors {
  general?: string;
  phone?: string;
  whatsapp?: string;
}

export interface ContactValues {
  contact_phone: string | null;
  contact_whatsapp: string | null;
  contact_name: string | null;
}

export function normalizeAlgerianPhone(input: string, kind: 'any' | 'mobile' = 'any'): string | null {
  const compact = input.replace(/[\s\-.()]/g, '');
  let national: string;
  if (compact.startsWith('+213')) national = compact.slice(4);
  else if (compact.startsWith('00213')) national = compact.slice(5);
  else if (/^0\d{9}$/.test(compact)) national = compact.slice(1);
  else return null;
  if (!/^\d{9}$/.test(national)) return null;
  const isMobile = /^[567]/.test(national);
  const isLandline = /^[234]/.test(national);
  if (kind === 'mobile' && !isMobile) return null;
  if (!isMobile && !isLandline) return null;
  return `+213${national}`;
}

export function isMobileNumber(e164: string): boolean {
  return /^\+213[567]\d{8}$/.test(e164);
}

export function formatLocalPhone(e164: string): string {
  const n = e164.slice(4);
  return `0${n.slice(0, 3)} ${n.slice(3, 5)} ${n.slice(5, 7)} ${n.slice(7)}`;
}

export function maskPhone(e164: string): string {
  return `0${e164.slice(4, 7)} ** ** **`;
}

export function telUrl(e164: string): string {
  return `tel:${e164}`;
}

export function whatsappUrl(e164: string, message: string): string {
  return `https://wa.me/${e164.slice(1)}?text=${encodeURIComponent(message)}`;
}

export function validateContact(draft: ContactDraft): { errors: ContactErrors; values: ContactValues } {
  const phoneRaw = draft.phone.trim();
  const whatsappRaw = (draft.sameAsPhone ? draft.phone : draft.whatsapp).trim();
  const errors: ContactErrors = {};

  if (!phoneRaw && !whatsappRaw) {
    errors.general = 'أدخل رقم هاتف أو رقم واتساب على الأقل';
  }

  let phone: string | null = null;
  if (phoneRaw) {
    phone = normalizeAlgerianPhone(phoneRaw);
    if (!phone) errors.phone = `رقم الهاتف غير صحيح، مثال: ${PHONE_EXAMPLE}`;
  }

  let whatsapp: string | null = null;
  if (whatsappRaw) {
    whatsapp = normalizeAlgerianPhone(whatsappRaw, 'mobile');
    if (!whatsapp) errors.whatsapp = 'رقم الواتساب يجب أن يكون رقم جوال يبدأ بـ 05 أو 06 أو 07';
  }

  const name = draft.name.trim();
  return {
    errors,
    values: {
      contact_phone: phone,
      contact_whatsapp: whatsapp,
      contact_name: name || null,
    },
  };
}

export function hasContactErrors(errors: ContactErrors): boolean {
  return Boolean(errors.general || errors.phone || errors.whatsapp);
}

export function initialContactDraft(profile: { phone?: string | null; full_name?: string | null } | null | undefined): ContactDraft {
  const normalized = profile?.phone ? normalizeAlgerianPhone(profile.phone) : null;
  return {
    phone: normalized ? formatLocalPhone(normalized) : '',
    whatsapp: '',
    sameAsPhone: false,
    name: profile?.full_name ?? '',
    saveToAccount: false,
  };
}

export function unsavedPhoneFor(draft: ContactDraft, profilePhone: string | null | undefined): string | null {
  const typed = normalizeAlgerianPhone(draft.phone);
  if (!typed) return null;
  const saved = profilePhone ? normalizeAlgerianPhone(profilePhone) : null;
  return typed === saved ? null : typed;
}
