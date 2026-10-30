import React from 'react';
import { BrandLogo } from '@/components/BrandLogo';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Logo({ size = 'md' }: LogoProps) {
  const dims = {
    sm: 32,
    md: 72,
    lg: 80,
    xl: 120,
  }[size];

  return <BrandLogo variant="icon" size={dims} />;
}
