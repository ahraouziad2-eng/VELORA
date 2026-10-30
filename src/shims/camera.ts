export const CameraType = { back: 'back', front: 'front' } as const;
export function useCameraPermissions() {
  return [{ granted: true }, async () => ({ granted: true })];
}
export function CameraView(_props: any) {
  return null;
}
