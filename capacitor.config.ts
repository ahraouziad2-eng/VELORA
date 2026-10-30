import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.smartagriland.app',
  appName: 'VELORA',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  android: {
    backgroundColor: '#15803d',
    allowMixedContent: true,
    webContentsDebuggingEnabled: true,
    hideWebViewScrollbar: true,
  } as CapacitorConfig['android'],
};

export default config;
