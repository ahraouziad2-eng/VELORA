import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'react-native': 'react-native-web',
      'react-native-web': resolve(__dirname, 'node_modules/react-native-web'),
      'react-native-web/Libraries/Utilities/codegenNativeComponent': resolve(__dirname, 'src/shims/codegen-native-component.ts'),
      'react-native-svg': resolve(__dirname, 'src/shims/react-native-svg.tsx'),
      'expo-linear-gradient': resolve(__dirname, 'src/shims/linear-gradient.tsx'),
      'expo-router': resolve(__dirname, 'src/shims/expo-router.tsx'),
      'expo-status-bar': resolve(__dirname, 'src/shims/status-bar.tsx'),
      'expo-haptics': resolve(__dirname, 'src/shims/haptics.ts'),
      'expo-image-picker': resolve(__dirname, 'src/shims/image-picker.ts'),
      'expo-document-picker': resolve(__dirname, 'src/shims/document-picker.ts'),
      'expo-camera': resolve(__dirname, 'src/shims/camera.ts'),
      'expo-font': resolve(__dirname, 'src/shims/font.ts'),
      'expo-splash-screen': resolve(__dirname, 'src/shims/splash-screen.ts'),
      'expo-system-ui': resolve(__dirname, 'src/shims/system-ui.ts'),
      'expo-constants': resolve(__dirname, 'src/shims/constants.ts'),
      'expo-linking': resolve(__dirname, 'src/shims/linking.ts'),
      'expo-web-browser': resolve(__dirname, 'src/shims/web-browser.ts'),
      '@react-native-async-storage/async-storage': resolve(__dirname, 'src/shims/async-storage.ts'),
      '@expo/vector-icons': resolve(__dirname, 'src/shims/vector-icons.tsx'),
      '@lucide/lab': resolve(__dirname, 'src/shims/lucide-lab.ts'),
      '@': resolve(__dirname),
    },
  },
  optimizeDeps: {
    include: ['react-native-web', 'react-dom', 'react'],
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    target: 'es2020',
    rollupOptions: {
      input: resolve(__dirname, 'index.html'),
    },
  },
  server: {
    port: 8081,
    host: true,
  },
});
