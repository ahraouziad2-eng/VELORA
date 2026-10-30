import { useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';

const LETTER_COLORS = ['#15803d', '#2563eb', '#d97706', '#0f766e', '#b45309', '#1d4ed8'];

type AvatarProps = {
  name: string | null | undefined;
  uri?: string | null;
  size?: number;
};

export function Avatar({ name, uri, size = 40 }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const letter = (name?.trim().charAt(0) || '?').toUpperCase();
  const bg = LETTER_COLORS[(name?.charCodeAt(0) ?? 0) % LETTER_COLORS.length];
  const shape = { width: size, height: size, borderRadius: size / 2 };

  if (uri && !failed) {
    return <Image source={{ uri }} style={[styles.image, shape]} onError={() => setFailed(true)} />;
  }

  return (
    <View style={[styles.letterBox, shape, { backgroundColor: bg }]}>
      <Text style={[styles.letter, { fontSize: size * 0.42 }]}>{letter}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: { backgroundColor: Colors.neutral.surface },
  letterBox: { alignItems: 'center', justifyContent: 'center' },
  letter: { color: Colors.neutral.white, fontWeight: '700', fontFamily: 'System' },
});
