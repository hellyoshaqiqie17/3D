/**
 * Extracts average/dominant color in HEX from an image File or preview URL.
 * Runs efficiently on a small 32x32 offscreen canvas.
 */
export async function extractDominantColor(fileOrUrl: File | string): Promise<string> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      resolve('#E5E7EB');
      return;
    }

    const img = new Image();
    const objectUrl = typeof fileOrUrl === 'string' ? fileOrUrl : URL.createObjectURL(fileOrUrl);

    img.crossOrigin = 'anonymous';

    const cleanup = () => {
      if (typeof fileOrUrl !== 'string') {
        URL.revokeObjectURL(objectUrl);
      }
    };

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const size = 32;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          cleanup();
          resolve('#E5E7EB');
          return;
        }

        ctx.drawImage(img, 0, 0, size, size);
        const imgData = ctx.getImageData(0, 0, size, size).data;

        let rSum = 0;
        let gSum = 0;
        let bSum = 0;
        let count = 0;

        // Skip completely transparent or extremely edge pixels
        for (let i = 0; i < imgData.length; i += 4) {
          const a = imgData[i + 3];
          if (a > 32) {
            rSum += imgData[i];
            gSum += imgData[i + 1];
            bSum += imgData[i + 2];
            count++;
          }
        }

        cleanup();

        if (count === 0) {
          resolve('#E5E7EB');
          return;
        }

        const r = Math.round(rSum / count);
        const g = Math.round(gSum / count);
        const b = Math.round(bSum / count);

        const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
        resolve(hex);
      } catch (err) {
        cleanup();
        resolve('#E5E7EB');
      }
    };

    img.onerror = () => {
      cleanup();
      resolve('#E5E7EB');
    };

    img.src = objectUrl;
  });
}

/**
 * Creates a solid color 1024x1024 PNG Blob/File for color swatches.
 */
export function createColorSwatchFile(hex: string, name: string): File {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = hex;
    ctx.fillRect(0, 0, 512, 512);
  }
  const dataUrl = canvas.toDataURL('image/png');
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  const safeName = (name.trim() || `Paint_${hex.replace('#', '')}`).replace(/[^a-zA-Z0-9_\-]/g, '_');
  return new File([u8arr], `${safeName}.png`, { type: mime });
}
