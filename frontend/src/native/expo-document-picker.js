// expo-document-picker shim. Mirrors the web result shape the native module produces —
// including the `file` (browser File) field VerifyScreen already reads for uploads.
export function getDocumentAsync({ type, multiple = false } = {}) {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.style.display = 'none';
    if (type && type !== '*/*') input.accept = Array.isArray(type) ? type.join(',') : type;
    if (multiple) input.multiple = true;

    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      input.remove();
      resolve(result);
    };

    input.addEventListener('change', () => {
      const files = Array.from(input.files ?? []);
      if (files.length === 0) return finish({ canceled: true, assets: null });
      finish({
        canceled: false,
        assets: files.map((file) => ({
          uri: URL.createObjectURL(file),
          name: file.name,
          size: file.size,
          mimeType: file.type || 'application/octet-stream',
          lastModified: file.lastModified,
          file,
        })),
      });
    });

    // A cancelled file dialog fires no `change` event in most browsers; `cancel` is the
    // modern signal, and the window-focus fallback covers browsers that lack it.
    input.addEventListener('cancel', () => finish({ canceled: true, assets: null }));
    window.addEventListener(
      'focus',
      () => setTimeout(() => finish({ canceled: true, assets: null }), 500),
      { once: true }
    );

    document.body.appendChild(input);
    input.click();
  });
}

export default { getDocumentAsync };
