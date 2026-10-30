import { Image, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { PageHeroConfig } from '@/constants/pageHero';

type PageHeroProps = {
  title: string;
  subtitle?: string;
  config: PageHeroConfig;
};

export function PageHero({ title, subtitle, config }: PageHeroProps) {
  return (
    <View style={styles.container}>
      {config.image ? (
        <Image
          source={{ uri: config.image }}
          style={[styles.image, config.objectPosition ? { objectPosition: config.objectPosition } : undefined] as any}
        />
      ) : (
        <View style={styles.pattern} />
      )}
      <LinearGradient
        colors={['rgba(13,59,32,.88)', 'rgba(13,59,32,.6)', 'rgba(13,59,32,.15)']}
        locations={[0, 0.45, 1]}
        start={{ x: 1, y: 0.5 }}
        end={{ x: 0, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: 224, minHeight: 224, position: 'relative', overflow: 'hidden', backgroundColor: '#1B5E45' },
  image: { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' as any },
  pattern: { ...StyleSheet.absoluteFillObject, opacity: 0.3, backgroundColor: '#1B5E45', borderWidth: 28, borderColor: 'rgba(255,255,255,.035)' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'flex-end', paddingHorizontal: 24, paddingVertical: 32 },
  title: { maxWidth: 620, color: '#FFFFFF', fontSize: 30, lineHeight: 42, fontWeight: '800', textAlign: 'right', fontFamily: 'Cairo' },
  subtitle: { maxWidth: 620, marginTop: 8, color: 'rgba(255,255,255,.88)', fontSize: 15, lineHeight: 24, textAlign: 'right', fontFamily: 'Cairo' },
});
