import { useState } from 'react';
import { Image, type ImageStyle, type StyleProp } from 'react-native';

type SafeImageProps = {
  uri: string | null | undefined;
  fallback: string;
  style?: StyleProp<ImageStyle>;
};

export function SafeImage({ uri, fallback, style }: SafeImageProps) {
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const source = uri && uri !== failedUri ? uri : fallback;

  return (
    <Image
      source={{ uri: source }}
      style={style}
      resizeMode="cover"
      onError={() => setFailedUri(uri ?? null)}
    />
  );
}
