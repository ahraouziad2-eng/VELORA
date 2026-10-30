import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Path, Circle, Rect, G } from 'react-native-svg';
import { Colors } from '@/constants/colors';

export function OnboardingSlide3({ size = 280 }: { size?: number }) {
  return (
    <View style={styles.wrap}>
      <Svg width={size} height={size} viewBox="0 0 280 280" fill="none">
        <Defs>
          <LinearGradient id="s3Bg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor={Colors.primary[100]} />
            <Stop offset="100%" stopColor={Colors.primary[50]} />
          </LinearGradient>
          <LinearGradient id="s3Growth" x1="0" y1="1" x2="0" y2="0">
            <Stop offset="0%" stopColor={Colors.primary[500]} />
            <Stop offset="100%" stopColor={Colors.primary[700]} />
          </LinearGradient>
        </Defs>

        <Circle cx="140" cy="140" r="135" fill="url(#s3Bg)" />

        <G>
          <Rect x="40" y="180" width="50" height="50" rx="8" fill={Colors.warning.bg} fillOpacity="0.6" />
          <Path d="M48 195 L55 188 L62 195 L70 185 L78 195" stroke={Colors.warning[600]} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <Rect x="52" y="205" width="26" height="4" rx="2" fill={Colors.warning[500]} fillOpacity="0.5" />
          <Rect x="52" y="213" width="18" height="4" rx="2" fill={Colors.warning[500]} fillOpacity="0.4" />
        </G>

        <Circle cx="140" cy="140" r="50" fill="none" stroke={Colors.primary[400]} strokeWidth="2" strokeOpacity="0.3" strokeDasharray="4 6" />
        <Circle cx="140" cy="90" r="6" fill={Colors.primary[600]} />
        <Circle cx="190" cy="140" r="6" fill={Colors.primary[600]} />
        <Circle cx="140" cy="190" r="6" fill={Colors.primary[600]} />
        <Circle cx="90" cy="140" r="6" fill={Colors.primary[600]} />

        <Path d="M65 140 L100 140 M100 140 Q110 130 115 140 M115 140 L165 140 M165 140 Q175 130 180 140 M180 140 L215 140" stroke={Colors.primary[500]} strokeWidth="2" strokeLinecap="round" fill="none" strokeOpacity="0.5" />
        <Circle cx="100" cy="140" r="4" fill={Colors.primary[400]} />
        <Circle cx="115" cy="140" r="4" fill={Colors.primary[400]} />
        <Circle cx="165" cy="140" r="4" fill={Colors.primary[400]} />
        <Circle cx="180" cy="140" r="4" fill={Colors.primary[400]} />

        <G>
          <Rect x="190" y="180" width="50" height="50" rx="8" fill={Colors.neutral.white} />
          <Path d="M215 220 L215 200" stroke={Colors.primary[600]} strokeWidth="2.5" strokeLinecap="round" />
          <Path d="M215 205 Q210 202 206 205" stroke={Colors.primary[600]} strokeWidth="2" strokeLinecap="round" fill="none" />
          <Path d="M215 210 Q220 207 224 210" stroke={Colors.primary[600]} strokeWidth="2" strokeLinecap="round" fill="none" />
          <Path d="M200 210 Q210 200 215 205 Q220 200 230 210 L230 225 L200 225 Z" fill="url(#s3Growth)" fillOpacity="0.15" />
          <Path d="M200 210 Q210 200 215 205 Q220 200 230 210" stroke={Colors.primary[600]} strokeWidth="1.5" fill="none" strokeOpacity="0.4" />
          <Circle cx="215" cy="195" r="5" fill={Colors.warning.light} />
          <Path d="M215 190 L215 187 M219 192 L222 189 M211 192 L208 189" stroke={Colors.warning[500]} strokeWidth="1.2" strokeLinecap="round" />
        </G>

        <Circle cx="140" cy="140" r="22" fill={Colors.neutral.white} />
        <Path d="M140 128 L140 152 M128 140 L152 140" stroke={Colors.primary[600]} strokeWidth="2.5" strokeLinecap="round" />
        <Circle cx="140" cy="140" r="14" fill="none" stroke={Colors.primary[400]} strokeWidth="1.5" strokeOpacity="0.4" />

        <Circle cx="60" cy="60" r="8" fill={Colors.primary[300]} fillOpacity="0.5" />
        <Circle cx="220" cy="80" r="6" fill={Colors.primary[400]} fillOpacity="0.4" />
        <Circle cx="50" cy="220" r="5" fill={Colors.primary[300]} fillOpacity="0.4" />
        <Circle cx="240" cy="220" r="7" fill={Colors.primary[300]} fillOpacity="0.5" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' } as any,
});
