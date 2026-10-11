import * as THREE from 'three';
import { detectTileBounds } from './tile-autotrim';

// Cache for generated CanvasTextures with grout lines
const groutTextureCache = new Map<string, { map: THREE.Texture; bumpMap: THREE.Texture }>();

export interface GroutTextureOptions {
  url: string;
  tileSizeCm: [number, number];
  groutWidthMm?: number;
  groutColor?: string;
  showGrout?: boolean;
}

/**
 * Creates high-fidelity diffuse and bump textures featuring realistic architectural
 * "Nat Keramik" (grout joints) along the tile borders based on physical tile dimensions.
 * Returns textures synchronously; updates WebGL as soon as canvas rendering completes.
 */
export function getTileTextureWithGrout(
  options: GroutTextureOptions
): { map: THREE.Texture; bumpMap: THREE.Texture } {
  const {
    url,
    tileSizeCm = [60, 60],
    groutWidthMm = 2,
    groutColor = '#8E9297',
    showGrout = true,
  } = options;

  const [wCm, hCm] = tileSizeCm;
  const effectiveGroutMm = showGrout ? Math.max(0, groutWidthMm) : 0;
  const cacheKey = `${url}_${wCm}x${hCm}_grout${effectiveGroutMm}_${groutColor}`;

  if (groutTextureCache.has(cacheKey)) {
    return groutTextureCache.get(cacheKey)!;
  }

  // Create immediate textures with RepeatWrapping
  const map = new THREE.Texture();
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.colorSpace = THREE.SRGBColorSpace;
  map.generateMipmaps = true;
  map.anisotropy = 8;

  const bumpMap = new THREE.Texture();
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.generateMipmaps = true;
  bumpMap.anisotropy = 8;

  const result = { map, bumpMap };
  groutTextureCache.set(cacheKey, result);

  if (typeof window !== 'undefined') {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const origW = img.naturalWidth || img.width;
      const origH = img.naturalHeight || img.height;

      // Automatically crop empty packaging margins (transparent margins or solid borders)
      const bounds = detectTileBounds(img, origW, origH);
      const { cropX, cropY, cropW, cropH } = bounds;

      const size = 1024;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');

      const bumpCanvas = document.createElement('canvas');
      bumpCanvas.width = size;
      bumpCanvas.height = size;
      const bumpCtx = bumpCanvas.getContext('2d');

      if (ctx && bumpCtx) {
        // Base background fill to prevent any transparent alpha turning black in WebGL
        ctx.fillStyle = '#EBE7DF';
        ctx.fillRect(0, 0, size, size);

        // Draw ONLY the cropped tile image (guarantees zero black vertical borders!)
        ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, size, size);

        // Generate bump map base from image grayscale
        bumpCtx.fillStyle = '#C8C8C8';
        bumpCtx.fillRect(0, 0, size, size);
        bumpCtx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, size, size);
        try {
          const imgData = bumpCtx.getImageData(0, 0, size, size);
          const data = imgData.data;
          for (let i = 0; i < data.length; i += 4) {
            const gray = Math.min(255, (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) * 0.85 + 40);
            data[i] = gray;
            data[i + 1] = gray;
            data[i + 2] = gray;
          }
          bumpCtx.putImageData(imgData, 0, 0);
        } catch {
          // If cross-origin image data reading is restricted, fill bump map base
          bumpCtx.fillStyle = '#CCCCCC';
          bumpCtx.fillRect(0, 0, size, size);
        }

        // Draw Nat Keramik along the tile perimeter if grout is enabled
        if (effectiveGroutMm > 0) {
          const fractionX = (effectiveGroutMm / (wCm * 10)) * 0.5;
          const fractionY = (effectiveGroutMm / (hCm * 10)) * 0.5;

          const borderX = Math.max(2, Math.round(fractionX * size));
          const borderY = Math.max(2, Math.round(fractionY * size));

          // Diffuse: Fill grout joint borders with cement grout color
          ctx.fillStyle = groutColor;
          ctx.fillRect(0, 0, size, borderY);
          ctx.fillRect(0, size - borderY, size, borderY);
          ctx.fillRect(0, 0, borderX, size);
          ctx.fillRect(size - borderX, 0, borderX, size);

          // Subtle beveled inner shadow along the tile edge
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
          ctx.lineWidth = Math.max(1, Math.round(borderX * 0.35));
          ctx.strokeRect(borderX, borderY, size - 2 * borderX, size - 2 * borderY);

          // Bump Map: Make grout lines dark (recessed depth in 3D WebGL)
          bumpCtx.fillStyle = '#101010';
          bumpCtx.fillRect(0, 0, size, borderY);
          bumpCtx.fillRect(0, size - borderY, size, borderY);
          bumpCtx.fillRect(0, 0, borderX, size);
          bumpCtx.fillRect(size - borderX, 0, borderX, size);

          bumpCtx.strokeStyle = '#4A4A4A';
          bumpCtx.lineWidth = Math.max(1, Math.round(borderX * 0.5));
          bumpCtx.strokeRect(borderX, borderY, size - 2 * borderX, size - 2 * borderY);
        }

        map.image = canvas;
        map.needsUpdate = true;

        bumpMap.image = bumpCanvas;
        bumpMap.needsUpdate = true;
      }
    };
    img.onerror = () => {
      // Fallback
      const loader = new THREE.TextureLoader();
      loader.load(url, (tex) => {
        map.image = tex.image;
        map.needsUpdate = true;
        bumpMap.image = tex.image;
        bumpMap.needsUpdate = true;
      });
    };
    img.src = url;
  }

  return result;
}
