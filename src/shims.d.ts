declare module 'expo-router' {
  import type { ReactNode } from 'react';
  export type Href = string | { pathname: string; params?: Record<string, string> };
  export function useRouter(): any;
  export function useLocalSearchParams<T = Record<string, string>>(): T;
  export function useFocusEffect(effect: () => void | (() => void)): void;
  export function usePathname(): string;
  export function useSegments(): string[];
  export function Redirect({ href }: { href: Href }): null;
  export function Link(props: { href: Href; children: ReactNode } & Record<string, any>): any;
  export function Stack(props: any): any;
  export function Tabs(props: any): any;
  export const router: { push: (href: Href) => void; replace: (href: Href) => void; back: () => void };
  namespace Stack { export function Screen(props: any): null; }
  namespace Tabs { export function Screen(props: any): null; }
}

declare module 'expo-linear-gradient' {
  import type { ReactNode } from 'react';
  interface LinearGradientProps {
    colors: string[];
    start?: { x: number; y: number };
    end?: { x: number; y: number };
    locations?: number[];
    style?: any;
    children?: ReactNode;
  }
  export function LinearGradient(props: LinearGradientProps): any;
}

declare module 'expo-status-bar' {
  export function StatusBar(props: any): null;
}

declare module 'expo-haptics' {
  export const ImpactFeedbackStyle: { Light: string; Medium: string; Heavy: string };
  export const NotificationFeedbackType: { Success: string; Warning: string; Error: string };
  export function impactAsync(style?: string): Promise<void>;
  export function notificationAsync(type?: string): Promise<void>;
  export function selectionAsync(): Promise<void>;
}

declare module 'expo-image-picker' {
  export const MediaTypeOptions: { Images: string; Videos: string; All: string };
  export interface ImagePickerAsset { uri: string; type?: string; fileName?: string; fileSize?: number; width: number; height: number; }
  export interface ImagePickerResult { canceled: boolean; assets: ImagePickerAsset[]; }
  export function launchCameraAsync(options?: any): Promise<ImagePickerResult>;
  export function launchImageLibraryAsync(options?: any): Promise<ImagePickerResult>;
  export function requestCameraPermissionsAsync(): Promise<{ status: string }>;
  export function requestMediaLibraryPermissionsAsync(): Promise<{ status: string }>;
}

declare module 'expo-document-picker' {
  export interface DocumentPickerAsset { uri: string; name?: string; mimeType?: string; size?: number; }
  export interface DocumentPickerResult { canceled: boolean; assets: DocumentPickerAsset[]; }
  export function getDocumentAsync(options?: any): Promise<DocumentPickerResult>;
}

declare module 'expo-camera' {
  export const CameraType: { back: string; front: string };
  export function useCameraPermissions(): [any, () => Promise<any>];
  export function CameraView(props: any): null;
}

declare module 'expo-font' {
  export function useFonts(fonts: Record<string, any>): [boolean, Error | null];
}

declare module 'expo-splash-screen' {
  export function preventAutoHideAsync(): Promise<void>;
  export function hideAsync(): Promise<void>;
}

declare module 'expo-system-ui' {
  export function setBackgroundColorAsync(color: string): Promise<void>;
}

declare module 'expo-constants' {
  export const Constants: { expoConfig: { name: string; slug: string; version: string }; platform: { web: boolean } };
  export default Constants;
}

declare module 'expo-linking' {
  export function openURL(url: string): Promise<void>;
  export function createURL(url: string): string;
  export const Linking: { openURL: (url: string) => Promise<void> };
}

declare module 'expo-web-browser' {
  export function openBrowserAsync(url: string): Promise<void>;
  export function openAuthSessionAsync(url: string): Promise<{ type: string }>;
  export function dismissBrowserAsync(): void;
}

declare module '@react-native-async-storage/async-storage' {
  const AsyncStorage: {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
    getAllKeys(): Promise<string[]>;
    multiGet(keys: string[]): Promise<[string, string | null][]>;
    multiSet(pairs: [string, string][]): Promise<void>;
    multiRemove(keys: string[]): Promise<void>;
    clear(): Promise<void>;
  };
  export default AsyncStorage;
}

declare module '@expo/vector-icons' {
  import type { ComponentType } from 'react';
  const Icon: ComponentType<any>;
  export const Ionicons: ComponentType<any>;
  export const MaterialIcons: ComponentType<any>;
  export const FontAwesome: ComponentType<any>;
  export const Feather: ComponentType<any>;
  export const Entypo: ComponentType<any>;
  export const AntDesign: ComponentType<any>;
  export const MaterialCommunityIcons: ComponentType<any>;
  export const SimpleLineIcons: ComponentType<any>;
  export const Octicons: ComponentType<any>;
  export const Foundation: ComponentType<any>;
  export const EvilIcons: ComponentType<any>;
  export const Zocial: ComponentType<any>;
  export const Fontisto: ComponentType<any>;
  export default { Ionicons, MaterialIcons, FontAwesome, Feather, Entypo, AntDesign, MaterialCommunityIcons, SimpleLineIcons, Octicons, Foundation, EvilIcons, Zocial, Fontisto };
}

declare module '@lucide/lab' {
  export const burger: string;
  import type { ComponentType } from 'react';
  export const Icon: ComponentType<any>;
}

declare module 'react-native-web' {
  export * from 'react-native';
  export { default } from 'react-native';
}
