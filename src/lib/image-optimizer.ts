/**
 * Client-Side Image Optimizer
 * 
 * Downscales raw camera / phone / scanner photos (often 5MB - 15MB)
 * to high-resolution 2048px textures (typically 300KB - 800KB).
 * 
 * This ensures:
 * 1. Never exceeds Vercel 4.5MB serverless body size limit (413 Payload Too Large)
 * 2. Uploads 10x faster over cellular / home internet
 * 3. Prevents WebGL texture allocation crashes & GPU VRAM exhaustion
 */

export async function optimizeTextureImage(
  file: File,
  maxDim = 2048,
  quality = 0.88
): Promise<File> {
  // If already small and in efficient format, keep as is
  if (file.size < 800 * 1024 && (file.type === 'image/jpeg' || file.type === 'image/webp')) {
    return file;
  }

  return new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      resolve(file);
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      
      const isPng = file.type === 'image/png';
      const outputMime = isPng ? 'image/png' : 'image/jpeg';
      const outputExt = isPng ? '.png' : '.jpg';
      const baseName = file.name.replace(/\.[^/.]+$/, '');

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          const optimized = new File([blob], `${baseName}${outputExt}`, {
            type: outputMime,
          });
          resolve(optimized);
        },
        outputMime,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}
