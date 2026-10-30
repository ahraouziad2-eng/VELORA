export async function openBrowserAsync(url: string) {
  window.open(url, '_blank');
}
export async function openAuthSessionAsync(url: string) {
  window.open(url, '_blank');
  return { type: 'success' };
}
export function dismissBrowserAsync() {}
