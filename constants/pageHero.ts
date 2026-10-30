export type PageHeroKey = 'lands' | 'explore' | 'map' | 'equipment' | 'services' | 'partnership' | 'ads' | 'jobs' | 'requests' | 'account';

export type PageHeroConfig = {
  image?: string;
  objectPosition?: string;
  pattern?: boolean;
};

export const PAGE_HERO_CONFIG: Record<PageHeroKey, PageHeroConfig> = {
  lands: { image: '/images/banner-lands.webp' },
  explore: { image: '/images/banner-lands.webp' },
  map: { image: '/images/banner-services.webp' },
  equipment: { image: '/images/banner-equipment.webp' },
  services: { image: '/images/banner-services.webp' },
  partnership: { image: '/images/banner-partnership.webp', objectPosition: 'center 30%' },
  ads: { pattern: true },
  jobs: { pattern: true },
  requests: { pattern: true },
  account: { pattern: true },
};
