import React from 'react';
import { Image, View, StyleSheet, type ImageStyle } from 'react-native';
import iconSvg from '@/src/assets/brand/velora-icon.svg';
import markSvg from '@/src/assets/brand/velora-mark.svg';
import horizontalSvg from '@/src/assets/brand/velora-logo-horizontal.svg';
import horizontalDarkSvg from '@/src/assets/brand/velora-logo-horizontal-dark.svg';
import stackedSvg from '@/src/assets/brand/velora-logo-stacked.svg';

export type BrandLogoVariant = 'icon' | 'mark' | 'horizontal' | 'horizontalDark' | 'stacked';

const SOURCES: Record<BrandLogoVariant, string> = {
  icon: iconSvg,
  mark: markSvg,
  horizontal: horizontalSvg,
  horizontalDark: horizontalDarkSvg,
  stacked: stackedSvg,
};

const ASPECT_RATIOS: Record<BrandLogoVariant, number> = {
  icon: 1,
  mark: 1,
  horizontal: 1400 / 440,
  horizontalDark: 1400 / 440,
  stacked: 1,
};

interface BrandLogoProps {
  variant?: BrandLogoVariant;
  size?: number;
  style?: ImageStyle;
}

export function BrandLogo({ variant = 'icon', size = 80, style }: BrandLogoProps) {
  const height = size;
  const width = height * ASPECT_RATIOS[variant];
  return (
    <View style={[styles.container, { width, height }]} accessibilityRole="image" accessibilityLabel="VELORA">
      <Image source={{ uri: SOURCES[variant] }} style={[styles.image, style]} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  image: { width: '100%', height: '100%' },
});
