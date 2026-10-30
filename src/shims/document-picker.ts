export async function getDocumentAsync(_opts?: any) {
  return new Promise<{ canceled: boolean; assets?: any[] }>((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = _opts?.multiple || false;
    input.onchange = async () => {
      const files = Array.from(input.files || []);
      if (files.length === 0) return resolve({ canceled: true });
      const assets = files.map((file) => ({
        uri: URL.createObjectURL(file),
        name: file.name,
        mimeType: file.type,
        size: file.size,
      }));
      resolve({ canceled: false, assets });
    };
    input.click();
  });
}
