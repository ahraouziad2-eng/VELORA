export async function launchCameraAsync(_options?: any) {
  return new Promise<{ canceled: boolean; assets?: any[] }>((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return resolve({ canceled: true });
      const uri = URL.createObjectURL(file);
      resolve({ canceled: false, assets: [{ uri, type: file.type, fileName: file.name, fileSize: file.size, width: 0, height: 0 }] });
    };
    input.click();
  });
}

export async function launchImageLibraryAsync(_options?: any) {
  return new Promise<{ canceled: boolean; assets?: any[] }>((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = _options?.allowsMultipleSelection || false;
    input.onchange = async () => {
      const files = Array.from(input.files || []);
      if (files.length === 0) return resolve({ canceled: true });
      const assets = files.map((file) => ({
        uri: URL.createObjectURL(file),
        type: file.type,
        fileName: file.name,
        fileSize: file.size,
        width: 0,
        height: 0,
      }));
      resolve({ canceled: false, assets });
    };
    input.click();
  });
}

export async function requestCameraPermissionsAsync() {
  return { status: 'granted' };
}
export async function requestMediaLibraryPermissionsAsync() {
  return { status: 'granted' };
}
export const MediaTypeOptions = { Images: 'Images' };
