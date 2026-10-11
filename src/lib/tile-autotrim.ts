/**
 * Tile Auto-Trim Utility
 *
 * Automatically detects and crops empty packaging margins
 * (transparent padding in manufacturer PNG catalog exports or solid black/white padding in converted JPEGs)
 * so that ceramic/granite/marble slabs fill 100% of the tile face with zero black border artifacts.
 */

export interface TileBounds {
  cropX: number;
  cropY: number;
  cropW: number;
  cropH: number;
  hasPadding: boolean;
  aspectRatio: number; // cropW / cropH
}

/**
 * Detects the true content bounding box of a tile texture.
 * Handles:
 * 1. Transparent margins (PNG with alpha < 25)
 * 2. Solid color borders (e.g. black or white padding with rgb variance < 20)
 */
export function detectTileBounds(
  img: HTMLImageElement | HTMLCanvasElement,
  naturalWidth: number,
  naturalHeight: number,
  scanSize = 512
): TileBounds {
  if (naturalWidth <= 0 || naturalHeight <= 0) {
    return { cropX: 0, cropY: 0, cropW: 1, cropH: 1, hasPadding: false, aspectRatio: 1 };
  }

  // Fast scan offscreen canvas
  const scanW = Math.min(naturalWidth, scanSize);
  const scanH = Math.min(naturalHeight, scanSize);

  if (typeof document === 'undefined') {
    return {
      cropX: 0,
      cropY: 0,
      cropW: naturalWidth,
      cropH: naturalHeight,
      hasPadding: false,
      aspectRatio: naturalWidth / naturalHeight,
    };
  }

  const canvas = document.createElement('canvas');
  canvas.width = scanW;
  canvas.height = scanH;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return {
      cropX: 0,
      cropY: 0,
      cropW: naturalWidth,
      cropH: naturalHeight,
      hasPadding: false,
      aspectRatio: naturalWidth / naturalHeight,
    };
  }

  ctx.drawImage(img, 0, 0, scanW, scanH);
  const imgData = ctx.getImageData(0, 0, scanW, scanH);
  const data = imgData.data;

  let minX = 0;
  let maxX = scanW - 1;
  let minY = 0;
  let maxY = scanH - 1;

  // 1. Check for transparency
  let hasTrans = false;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 25) {
      hasTrans = true;
      break;
    }
  }

  if (hasTrans) {
    // Scan transparent columns from left
    while (minX < maxX) {
      let transCount = 0;
      for (let y = minY; y <= maxY; y++) {
        if (data[(y * scanW + minX) * 4 + 3] < 25) transCount++;
      }
      if (transCount / (maxY - minY + 1) > 0.9) minX++;
      else break;
    }

    // Scan transparent columns from right
    while (maxX > minX) {
      let transCount = 0;
      for (let y = minY; y <= maxY; y++) {
        if (data[(y * scanW + maxX) * 4 + 3] < 25) transCount++;
      }
      if (transCount / (maxY - minY + 1) > 0.9) maxX--;
      else break;
    }

    // Scan transparent rows from top
    while (minY < maxY) {
      let transCount = 0;
      for (let x = minX; x <= maxX; x++) {
        if (data[(minY * scanW + x) * 4 + 3] < 25) transCount++;
      }
      if (transCount / (maxX - minX + 1) > 0.9) minY++;
      else break;
    }

    // Scan transparent rows from bottom
    while (maxY > minY) {
      let transCount = 0;
      for (let x = minX; x <= maxX; x++) {
        if (data[(maxY * scanW + x) * 4 + 3] < 25) transCount++;
      }
      if (transCount / (maxX - minX + 1) > 0.9) maxY--;
      else break;
    }
  } else {
    // 2. Check for solid black / white border padding (e.g. from JPEG conversion)
    const getPixel = (x: number, y: number) => {
      const idx = (y * scanW + x) * 4;
      return { r: data[idx], g: data[idx + 1], b: data[idx + 2], a: data[idx + 3] };
    };
    const colorDist = (c: { r: number; g: number; b: number }, target: { r: number; g: number; b: number }) => {
      return Math.hypot(c.r - target.r, c.g - target.g, c.b - target.b);
    };

    const cTL = getPixel(0, 0);
    const cTR = getPixel(scanW - 1, 0);
    const cBL = getPixel(0, scanH - 1);
    const cBR = getPixel(scanW - 1, scanH - 1);

    const isNearBlack = (c: typeof cTL) => c.r < 18 && c.g < 18 && c.b < 18;
    const isNearWhite = (c: typeof cTL) => c.r > 240 && c.g > 240 && c.b > 240;

    const allBlack = isNearBlack(cTL) && isNearBlack(cTR) && isNearBlack(cBL) && isNearBlack(cBR);
    const allWhite = isNearWhite(cTL) && isNearWhite(cTR) && isNearWhite(cBL) && isNearWhite(cBR);

    if (allBlack || allWhite) {
      const targetBg = allBlack ? { r: 0, g: 0, b: 0 } : { r: 255, g: 255, b: 255 };
      const tol = 20;

      while (minX < maxX) {
        let matchCount = 0;
        for (let y = minY; y <= maxY; y++) {
          if (colorDist(getPixel(minX, y), targetBg) < tol) matchCount++;
        }
        if (matchCount / (maxY - minY + 1) > 0.92) minX++;
        else break;
      }

      while (maxX > minX) {
        let matchCount = 0;
        for (let y = minY; y <= maxY; y++) {
          if (colorDist(getPixel(maxX, y), targetBg) < tol) matchCount++;
        }
        if (matchCount / (maxY - minY + 1) > 0.92) maxX--;
        else break;
      }

      while (minY < maxY) {
        let matchCount = 0;
        for (let x = minX; x <= maxX; x++) {
          if (colorDist(getPixel(x, minY), targetBg) < tol) matchCount++;
        }
        if (matchCount / (maxX - minX + 1) > 0.92) minY++;
        else break;
      }

      while (maxY > minY) {
        let matchCount = 0;
        for (let x = minX; x <= maxX; x++) {
          if (colorDist(getPixel(x, maxY), targetBg) < tol) matchCount++;
        }
        if (matchCount / (maxX - minX + 1) > 0.92) maxY--;
        else break;
      }
    }
  }

  // Safety check: ensure content isn't trivially empty (< 10% dimension)
  const trimmedW = maxX - minX + 1;
  const trimmedH = maxY - minY + 1;
  if (trimmedW < scanW * 0.1 || trimmedH < scanH * 0.1) {
    return {
      cropX: 0,
      cropY: 0,
      cropW: naturalWidth,
      cropH: naturalHeight,
      hasPadding: false,
      aspectRatio: naturalWidth / naturalHeight,
    };
  }

  // Check if any actual padding was removed
  const padLeft = minX;
  const padRight = scanW - 1 - maxX;
  const padTop = minY;
  const padBottom = scanH - 1 - maxY;
  const hasPadding = padLeft > 2 || padRight > 2 || padTop > 2 || padBottom > 2;

  if (!hasPadding) {
    return {
      cropX: 0,
      cropY: 0,
      cropW: naturalWidth,
      cropH: naturalHeight,
      hasPadding: false,
      aspectRatio: naturalWidth / naturalHeight,
    };
  }

  // Map scan coordinates back to natural image dimensions
  const scaleX = naturalWidth / scanW;
  const scaleY = naturalHeight / scanH;

  const cropX = Math.round(minX * scaleX);
  const cropY = Math.round(minY * scaleY);
  const cropW = Math.min(naturalWidth - cropX, Math.round(trimmedW * scaleX));
  const cropH = Math.min(naturalHeight - cropY, Math.round(trimmedH * scaleY));

  return {
    cropX,
    cropY,
    cropW,
    cropH,
    hasPadding: true,
    aspectRatio: cropW / cropH,
  };
}

/**
 * Extracts tile dimensions in cm from a file name (e.g. CV90180, 60x120, 30x60).
 */
export function extractSizeFromFilename(fileName: string): [number, number] | null {
  if (!fileName) return null;
  const clean = fileName.toUpperCase();

  // Pattern 1: e.g. "90x180", "60X120", "30*60"
  const matchX = clean.match(/(\d{2,3})\s*[X*x]\s*(\d{2,3})/);
  if (matchX) {
    const w = parseInt(matchX[1], 10);
    const h = parseInt(matchX[2], 10);
    if (w >= 10 && w <= 320 && h >= 10 && h <= 320) {
      return [w, h];
    }
  }

  // Pattern 2: e.g. "CV90180", "GP60120", "3060", "6060"
  const matchConcat = clean.match(
    /(?:CV|GP|TI|GR)?(90180|60120|60135|4080|3060|2550|2540|100100|8080|6060|5050|4040|3030|2525)/
  );
  if (matchConcat) {
    const s = matchConcat[1];
    switch (s) {
      case '90180':
        return [90, 180];
      case '60120':
        return [60, 120];
      case '60135':
        return [60, 135];
      case '4080':
        return [40, 80];
      case '3060':
        return [30, 60];
      case '2550':
        return [25, 50];
      case '2540':
        return [25, 40];
      case '100100':
        return [100, 100];
      case '8080':
        return [80, 80];
      case '6060':
        return [60, 60];
      case '5050':
        return [50, 50];
      case '4040':
        return [40, 40];
      case '3030':
        return [30, 30];
      case '2525':
        return [25, 25];
    }
  }

  return null;
}

/**
 * Suggests a standard tile preset based on aspect ratio (cropW / cropH) and surface type.
 */
export function inferSuggestedTilePreset(
  aspectRatio: number,
  surfaceType: 'wall' | 'floor'
): [number, number] {
  // If ~1:2 ratio (0.42 to 0.58)
  if (aspectRatio >= 0.42 && aspectRatio <= 0.58) {
    return surfaceType === 'wall' ? [90, 180] : [60, 120];
  }

  // If ~2:1 ratio (1.75 to 2.35)
  if (aspectRatio >= 1.75 && aspectRatio <= 2.35) {
    return surfaceType === 'wall' ? [60, 30] : [120, 60];
  }

  // If ~5:8 ratio (0.58 to 0.70)
  if (aspectRatio >= 0.58 && aspectRatio <= 0.70) {
    return [25, 40];
  }

  // If ~1:1 square (0.88 to 1.15)
  if (aspectRatio >= 0.88 && aspectRatio <= 1.15) {
    return [60, 60];
  }

  // Default fallback
  return surfaceType === 'wall' ? [30, 60] : [60, 60];
}
