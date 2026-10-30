import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Path, Circle, Rect, G } from 'react-native-svg';
import { Colors } from '@/constants/colors';

export function OnboardingSlide1({ size = 280 }: { size?: number }) {
  return (
    <View style={styles.wrap}>
      <Svg width={size} height={size} viewBox="0 0 280 280" fill="none">
        <Defs>
          <LinearGradient id="s1Bg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor={Colors.primary[100]} />
            <Stop offset="100%" stopColor={Colors.primary[50]} />
          </LinearGradient>
          <LinearGradient id="s1Field" x1="0" y1="1" x2="0" y2="0">
            <Stop offset="0%" stopColor={Colors.primary[400]} />
            <Stop offset="100%" stopColor={Colors.primary[600]} />
          </LinearGradient>
          <LinearGradient id="s1Phone" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor={Colors.neutral[800]} />
            <Stop offset="100%" stopColor={Colors.neutral[900]} />
          </LinearGradient>
        </Defs>

        <Circle cx="140" cy="140" r="135" fill="url(#s1Bg)" />

        <Path d="M40 230 Q70 220 100 228 T160 225 T250 220" stroke={Colors.primary[300]} strokeWidth="1.5" strokeOpacity="0.5" fill="none" strokeDasharray="4 4" />

        <Path d="M30 190 Q80 170 140 180 T250 175 L250 280 L30 280 Z" fill="url(#s1Field)" fillOpacity="0.85" />
        <Path d="M30 190 Q80 170 140 180 T250 175" stroke={Colors.neutral.white} strokeWidth="2" strokeOpacity="0.5" fill="none" />
        <Path d="M60 200 L70 190 M100 205 L110 195 M150 200 L160 190 M200 200 L210 190" stroke={Colors.neutral.white} strokeWidth="1.5" strokeOpacity="0.4" strokeLinecap="round" />

        <G>
          <Rect x="88" y="60" width="104" height="180" rx="18" fill="url(#s1Phone)" />
          <Rect x="94" y="68" width="92" height="164" rx="12" fill={Colors.primary[50]} />
          <Path d="M94 68 L186 68 L186 130 L94 130 Z" fill={Colors.primary[200]} fillOpacity="0.6" />
          <Path d="M100 80 L180 80 M100 92 L160 92" stroke={Colors.neutral.white} strokeWidth="2" strokeLinecap="round" strokeOpacity="0.7" />
          <Circle cx="120" cy="110" r="6" fill={Colors.error[500]} />
          <Circle cx="150" cy="105" r="6" fill={Colors.warning[500]} />
          <Circle cx="165" cy="120" r="6" fill={Colors.primary[600]} />
          <Path d="M112 112 L150 107 L165 122" stroke={Colors.neutral.white} strokeWidth="1.5" strokeDasharray="3 3" fill="none" />
          <Rect x="100" y="140" width="80" height="8" rx="4" fill={Colors.primary[300]} fillOpacity="0.5" />
          <Rect x="100" y="155" width="60" height="8" rx="4" fill={Colors.primary[300]} fillOpacity="0.4" />
          <Rect x="100" y="170" width="70" height="8" rx="4" fill={Colors.primary[300]} fillOpacity="0.4" />
          <Rect x="100" y="190" width="76" height="28" rx="8" fill={Colors.primary[600]} />
          <Path d="M120 204 L124 208 L128 200" stroke={Colors.neutral.white} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <Rect x="134" y="200" width="30" height="6" rx="3" fill={Colors.neutral.white} fillOpacity="0.8" />
        </G>

        <Circle cx="200" cy="60" r="18" fill={Colors.neutral.white} />
        <Path d="M200 50 L200 56 M205 55 L209 51 M195 55 L191 51 M205 65 L209 69 M195 65 L191 69" stroke={Colors.primary[600]} strokeWidth="2" strokeLinecap="round" />

        <Circle cx="50" cy="80" r="12" fill={Colors.neutral.white} fillOpacity="0.9" />
        <Path d="M50 74 L50 78 M53 77 L56 74 M47 77 L44 74" stroke={Colors.primary[500]} strokeWidth="1.5" strokeLinecap="round" />

        <Circle cx="230" cy="130" r="8" fill={Colors.primary[400]} fillOpacity="0.6" />
        <Circle cx="45" cy="160" r="6" fill={Colors.primary[400]} fillOpacity="0.5" />
        <Circle cx="250" cy="200" r="5" fill={Colors.primary[300]} fillOpacity="0.5" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' } as any,
});
