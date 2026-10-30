export async function openURL(url: string) {
  window.open(url, '_blank');
}
export function createURL(url: string) {
  return url;
}
export const Linking = {
  openURL: async (url: string) => { window.open(url, '_blank'); },
};
