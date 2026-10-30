import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Path, Circle, Rect, G } from 'react-native-svg';
import { Colors } from '@/constants/colors';

export function OnboardingSlide2({ size = 280 }: { size?: number }) {
  return (
    <View style={styles.wrap}>
      <Svg width={size} height={size} viewBox="0 0 280 280" fill="none">
        <Defs>
          <LinearGradient id="s2Bg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor={Colors.primary[50]} />
            <Stop offset="100%" stopColor={Colors.neutral[50]} />
          </LinearGradient>
          <LinearGradient id="s2Card" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={Colors.neutral.white} />
            <Stop offset="100%" stopColor={Colors.primary[50]} />
          </LinearGradient>
          <LinearGradient id="s2Chart" x1="0" y1="1" x2="0" y2="0">
            <Stop offset="0%" stopColor={Colors.primary[500]} />
            <Stop offset="100%" stopColor={Colors.primary[700]} />
          </LinearGradient>
        </Defs>

        <Circle cx="140" cy="140" r="135" fill="url(#s2Bg)" />

        <G>
          <Rect x="50" y="50" width="180" height="120" rx="16" fill="url(#s2Card)" />
          <Rect x="50" y="54" width="180" height="120" rx="16" fill={Colors.neutral[200]} fillOpacity="0.3" />
          <Rect x="65" y="65" width="40" height="6" rx="3" fill={Colors.primary[600]} />
          <Rect x="65" y="78" width="60" height="4" rx="2" fill={Colors.neutral[300]} />
          <Rect x="65" y="100" width="16" height="55" rx="4" fill={Colors.primary[300]} fillOpacity="0.5" />
          <Rect x="88" y="110" width="16" height="45" rx="4" fill={Colors.primary[400]} fillOpacity="0.6" />
          <Rect x="111" y="95" width="16" height="60" rx="4" fill="url(#s2Chart)" />
          <Rect x="134" y="85" width="16" height="70" rx="4" fill="url(#s2Chart)" />
          <Rect x="157" y="105" width="16" height="50" rx="4" fill={Colors.primary[500]} fillOpacity="0.7" />
          <Path d="M65 160 L200 160" stroke={Colors.neutral[200]} strokeWidth="1" />
        </G>

        <Circle cx="220" cy="70" r="18" fill={Colors.neutral.white} />
        <Path d="M214 70 L218 74 L226 66" stroke={Colors.success[600]} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />

        <Circle cx="195" cy="72" r="10" fill={Colors.success[500]} fillOpacity="0.2" />
        <Path d="M190 72 L194 76 L200 68" stroke={Colors.success[600]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />

        <G>
          <Rect x="80" y="163" width="120" height="70" rx="12" fill={Colors.neutral[200]} fillOpacity="0.3" />
          <Rect x="80" y="160" width="120" height="70" rx="12" fill={Colors.neutral.white} />
          <Rect x="92" y="172" width="30" height="30" rx="6" fill={Colors.primary[100]} />
          <Path d="M100 190 L104 186 L108 192 L112 184 L116 190" stroke={Colors.primary[600]} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <Rect x="130" y="175" width="56" height="5" rx="2.5" fill={Colors.primary[600]} />
          <Rect x="130" y="185" width="40" height="4" rx="2" fill={Colors.neutral[300]} />
          <Rect x="92" y="210" width="96" height="12" rx="6" fill={Colors.primary[600]} />
          <Path d="M130 216 L134 220 L140 212" stroke={Colors.neutral.white} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </G>

        <Circle cx="55" cy="120" r="10" fill={Colors.warning[100]} />
        <Path d="M55 115 L55 121 M55 123 L55 125" stroke={Colors.warning[600]} strokeWidth="2" strokeLinecap="round" />

        <Circle cx="225" cy="180" r="6" fill={Colors.primary[300]} fillOpacity="0.5" />
        <Circle cx="40" cy="200" r="5" fill={Colors.primary[300]} fillOpacity="0.4" />
        <Circle cx="240" cy="120" r="4" fill={Colors.primary[400]} fillOpacity="0.4" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' } as any,
});
