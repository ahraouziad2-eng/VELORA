export type FallbackKind = 'lands' | 'equipment' | 'services' | 'partnership';

export const FALLBACK_IMAGE: Record<FallbackKind, string> = {
  lands: '/images/banner-lands.webp',
  equipment: '/images/banner-equipment.webp',
  services: '/images/banner-services.webp',
  partnership: '/images/banner-partnership.webp',
};
