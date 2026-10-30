import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = '@agriland_onboarding_complete';

export function useOnboarding() {
  const [hasCompletedOnboarding, setHasCompleted] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((value: string | null) => {
      setHasCompleted(value === 'true');
    });
  }, []);

  const completeOnboarding = useCallback(async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    setHasCompleted(true);
  }, []);

  return { hasCompletedOnboarding, completeOnboarding };
}
