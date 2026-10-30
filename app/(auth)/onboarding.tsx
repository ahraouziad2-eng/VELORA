import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Button } from '@/components/ui/Button';
import { BrandLogo } from '@/components/BrandLogo';
import { OnboardingSlide1 } from '@/components/illustrations/OnboardingSlide1';
import { OnboardingSlide2 } from '@/components/illustrations/OnboardingSlide2';
import { OnboardingSlide3 } from '@/components/illustrations/OnboardingSlide3';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const ONBOARDING_KEY = '@agriland_onboarding_complete';

const slides = [
  {
    Illustration: OnboardingSlide1,
    title: 'منصة واحدة لكل احتياجاتك',
    desc: 'اكتشف الأراضي والفرص الاستثمارية، واعثر على ما تحتاجه في مكان واحد.',
  },
  {
    Illustration: OnboardingSlide2,
    title: 'استثمر بثقة',
    desc: 'نظّم معلوماتك ووثائقك وطلباتك، واتخذ قراراتك بثقة ووضوح.',
  },
  {
    Illustration: OnboardingSlide3,
    title: 'إمكانات لا حدود لها',
    desc: 'تواصل مع الشركاء والمستثمرين، وحوّل الأفكار إلى فرص حقيقية على منصة VELORA.',
  },
];

export default function OnboardingScreen() {
  const [index, setIndex] = useState(0);

  const goToSlide = useCallback((i: number) => {
    if (i < 0 || i >= slides.length) return;
    setIndex(i);
  }, []);

  const handleNext = useCallback(() => {
    if (index < slides.length - 1) {
      goToSlide(index + 1);
    } else {
      AsyncStorage.setItem(ONBOARDING_KEY, 'true').then(() => {
        router.replace('/(auth)/welcome');
      });
    }
  }, [index, goToSlide]);

  const handleSkip = useCallback(() => {
    AsyncStorage.setItem(ONBOARDING_KEY, 'true').then(() => {
      router.replace('/(auth)/welcome');
    });
  }, []);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
            <Text style={styles.skipText}>تخطي</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.slidesContainer}>
          {slides.map((slide, i) => {
            const Illustration = slide.Illustration;
            const isActive = i === index;
            return (
              <View
                key={i}
                style={[
                  styles.slide,
                  {
                    opacity: isActive ? 1 : 0,
                    transform: [{ translateX: isActive ? 0 : (i < index ? -width : width) }],
                    zIndex: isActive ? 1 : 0,
                  },
                ]}
              >
                <View style={styles.illustrationWrap}>
                  {i === 0 && <BrandLogo variant="mark" size={90} />}
                  <Illustration size={260} />
                </View>
                <View style={styles.textWrap}>
                  <Text style={styles.title}>{slide.title}</Text>
                  <Text style={styles.desc}>{slide.desc}</Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.footer}>
          <View style={styles.dots}>
            {slides.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    width: i === index ? 24 : 8,
                    backgroundColor: i === index ? Colors.primary.main : Colors.neutral[300],
                    opacity: i === index ? 1 : 0.4,
                  },
                ]}
              />
            ))}
          </View>

          <Button
            title={index === slides.length - 1 ? 'ابدأ الآن' : 'التالي'}
            onPress={handleNext}
            fullWidth
            size="lg"
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral.white } as any,
  safeArea: { flex: 1 } as any,
  header: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 20, paddingTop: 10 } as any,
  skipBtn: { paddingVertical: 8, paddingHorizontal: 12 } as any,
  skipText: { fontSize: 15, fontWeight: '600', fontFamily: 'System', color: Colors.primary.main } as any,
  slidesContainer: { flex: 1, position: 'relative' } as any,
  slide: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 20,
  } as any,
  illustrationWrap: { marginBottom: 20 } as any,
  textWrap: { alignItems: 'center' } as any,
  title: { fontSize: 26, fontWeight: '800', textAlign: 'center', fontFamily: 'System', letterSpacing: -0.5, color: Colors.neutral.text } as any,
  desc: { fontSize: 15, textAlign: 'center', marginTop: 12, lineHeight: 24, fontFamily: 'System', maxWidth: 300, color: Colors.neutral.textMuted } as any,
  footer: { paddingHorizontal: 24, paddingBottom: 24, paddingTop: 16 } as any,
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 24 } as any,
  dot: { height: 8, borderRadius: 4 } as any,
});
