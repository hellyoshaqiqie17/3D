/**
 * Client-Side Image Optimizer
 * 
 * Downscales raw camera / phone / scanner photos (often 5MB - 15MB)
 * to high-resolution 2048px textures (typically 300KB - 800KB).
 * 
 * Automatically crops out empty catalog margins (transparent PNG padding
 * or solid black/white JPEG borders) so the actual ceramic tile fills 100% of the surface
 * with zero black border artifacts.
 */

import { detectTileBounds } from './tile-autotrim';

export async function optimizeTextureImage(
  file: File,
  maxDim = 2048,
  quality = 0.90
): Promise<File> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      resolve(file);
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const origW = img.naturalWidth || img.width;
      const origH = img.naturalHeight || img.height;

      if (origW <= 0 || origH <= 0) {
        resolve(file);
        return;
      }

      // 1. Detect content bounding box (auto-crop transparent / solid margins)
      const bounds = detectTileBounds(img, origW, origH);
      const { cropX, cropY, cropW, cropH } = bounds;

      // 2. Calculate target dimensions based on the cropped tile content
      let targetW = cropW;
      let targetH = cropH;

      if (targetW > maxDim || targetH > maxDim) {
        if (targetW > targetH) {
          targetH = Math.round((targetH * maxDim) / targetW);
          targetW = maxDim;
        } else {
          targetW = Math.round((targetW * maxDim) / targetH);
          targetH = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }

      // Draw neutral stone background first to guarantee zero black alpha artifacts
      ctx.fillStyle = '#EBE7DF';
      ctx.fillRect(0, 0, targetW, targetH);

      // Draw ONLY the cropped tile content (skipping any empty packaging margins)
      ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, targetW, targetH);

      // Output as high-quality JPEG for optimal WebGL performance and fast CDN upload
      const outputMime = 'image/jpeg';
      const outputExt = '.jpg';
      const baseName = file.name.replace(/\.[^/.]+$/, '');

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          const optimized = new File([blob], `${baseName}${outputExt}`, {
            type: outputMime,
            lastModified: Date.now(),
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
