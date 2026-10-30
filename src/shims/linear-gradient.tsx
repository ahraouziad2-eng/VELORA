import React from 'react';
import { View, StyleSheet } from 'react-native-web';

interface LinearGradientProps {
  colors: string[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  locations?: number[];
  style?: any;
  children?: React.ReactNode;
}

export function LinearGradient({ colors, start, end, locations, style, children }: LinearGradientProps) {
  const angle = (() => {
    const s = start || { x: 0, y: 0 };
    const e = end || { x: 1, y: 1 };
    return Math.atan2(e.y - s.y, e.x - s.x) * (180 / Math.PI);
  })();

  const stops = (locations || colors.map((_, i) => i / (colors.length - 1)))
    .map((loc, i) => `${colors[i]} ${loc * 100}%`)
    .join(', ');

  return React.createElement(View, {
    style: [
      style,
      {
        backgroundImage: `linear-gradient(${angle}deg, ${stops})`,
        backgroundRepeat: 'no-repeat',
      },
    ],
  }, children);
}
