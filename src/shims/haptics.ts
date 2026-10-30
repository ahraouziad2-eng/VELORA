export const ImpactFeedbackStyle = { Light: 'light', Medium: 'medium', Heavy: 'heavy' } as const;
export const NotificationFeedbackType = { Success: 'success', Warning: 'warning', Error: 'error' } as const;

export async function impactAsync(_style?: string) {
  if (navigator.vibrate) navigator.vibrate(10);
}
export async function notificationAsync(_type?: string) {
  if (navigator.vibrate) navigator.vibrate([10, 30, 10]);
}
export async function selectionAsync() {
  if (navigator.vibrate) navigator.vibrate(5);
}
