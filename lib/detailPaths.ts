export function adDetailPath(ad: { id: string; category: string }): string {
  if (ad.category === 'EQUIPMENT') return `/equipment/${ad.id}`;
  if (ad.category === 'SERVICES') return `/services/${ad.id}`;
  return `/ad/${ad.id}`;
}

export function landDetailPath(land: { id: string; offer_type?: string | null }): string {
  if (land.offer_type === 'FOR_PARTNERSHIP' || land.offer_type === 'FOR_INVESTMENT') {
    return `/partnerships/${land.id}`;
  }
  return `/land/${land.id}`;
}
