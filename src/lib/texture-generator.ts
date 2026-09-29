import * as THREE from 'three';
import { TextureGeneratorType } from '@/types';

// Cache generated textures so we don't recreate them needlessly
const textureCache = new Map<string, THREE.CanvasTexture>();
const thumbnailCache = new Map<string, string>();

/**
 * Procedural canvas-based PBR textures for architectural materials.
 * Generates both diffuse maps and thumbnail data URLs.
 */
export function generateProceduralCanvas(type: TextureGeneratorType, size = 512): HTMLCanvasElement {
  if (typeof document === 'undefined') {
    return {} as HTMLCanvasElement;
  }

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  switch (type) {
    case 'wood-oak': {
      // Natural Scandinavian Oak Planks
      ctx.fillStyle = '#E3C8A0';
      ctx.fillRect(0, 0, size, size);

      const plankHeight = size / 6;
      for (let i = 0; i < 6; i++) {
        const y = i * plankHeight;
        // Subtle plank tone variation
        const toneShift = (Math.random() - 0.5) * 15;
        ctx.fillStyle = `rgb(${227 + toneShift}, ${200 + toneShift * 0.9}, ${160 + toneShift * 0.8})`;
        ctx.fillRect(0, y, size, plankHeight);

        // Wood grain streaks
        ctx.strokeStyle = 'rgba(160, 120, 80, 0.18)';
        ctx.lineWidth = 1.2;
        for (let j = 0; j < 30; j++) {
          const gy = y + Math.random() * plankHeight;
          ctx.beginPath();
          ctx.moveTo(0, gy);
          ctx.bezierCurveTo(
            size * 0.3, gy + (Math.random() - 0.5) * 6,
            size * 0.7, gy + (Math.random() - 0.5) * 6,
            size, gy
          );
          ctx.stroke();
        }

        // Plank joint line
        ctx.strokeStyle = 'rgba(70, 45, 25, 0.35)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(size, y);
        ctx.stroke();
      }
      break;
    }

    case 'wood-walnut': {
      // American Dark Walnut
      ctx.fillStyle = '#4A3525';
      ctx.fillRect(0, 0, size, size);

      const plankHeight = size / 5;
      for (let i = 0; i < 5; i++) {
        const y = i * plankHeight;
        const tone = (Math.random() - 0.5) * 12;
        ctx.fillStyle = `rgb(${74 + tone}, ${53 + tone * 0.8}, ${37 + tone * 0.6})`;
        ctx.fillRect(0, y, size, plankHeight);

        // Rich grain
        ctx.strokeStyle = 'rgba(30, 18, 10, 0.3)';
        ctx.lineWidth = 1.5;
        for (let j = 0; j < 35; j++) {
          const gy = y + Math.random() * plankHeight;
          ctx.beginPath();
          ctx.moveTo(0, gy);
          ctx.bezierCurveTo(
            size * 0.35, gy + (Math.random() - 0.5) * 8,
            size * 0.65, gy + (Math.random() - 0.5) * 8,
            size, gy
          );
          ctx.stroke();
        }

        // Joint
        ctx.strokeStyle = 'rgba(20, 10, 5, 0.5)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(size, y);
        ctx.stroke();
      }
      break;
    }

    case 'wood-herringbone': {
      // Light Oak Herringbone Parquet
      ctx.fillStyle = '#D6B995';
      ctx.fillRect(0, 0, size, size);

      const step = size / 8;
      ctx.strokeStyle = 'rgba(95, 65, 40, 0.35)';
      ctx.lineWidth = 2;

      for (let x = 0; x < size; x += step) {
        for (let y = 0; y < size; y += step * 2) {
          ctx.fillStyle = ((x + y) % (step * 3) === 0) ? '#D1B28B' : '#DCBF9B';
          ctx.fillRect(x, y, step, step * 2);
          ctx.strokeRect(x, y, step, step * 2);
        }
      }
      break;
    }

    case 'marble-carrara': {
      // White Carrara Polished Marble
      ctx.fillStyle = '#F8F9FA';
      ctx.fillRect(0, 0, size, size);

      // Soft grey subtle clouds
      ctx.fillStyle = 'rgba(225, 230, 235, 0.35)';
      for (let i = 0; i < 15; i++) {
        ctx.beginPath();
        ctx.arc(Math.random() * size, Math.random() * size, Math.random() * 90 + 30, 0, Math.PI * 2);
        ctx.fill();
      }

      // Fine grey-blue organic veining
      const drawVein = (startX: number, startY: number, color: string, width: number) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.beginPath();
        let curX = startX;
        let curY = startY;
        ctx.moveTo(curX, curY);

        for (let s = 0; s < 6; s++) {
          curX += (Math.random() - 0.45) * (size / 4);
          curY += Math.random() * (size / 4);
          ctx.lineTo(curX, curY);
        }
        ctx.stroke();
      };

      for (let v = 0; v < 4; v++) {
        drawVein(Math.random() * size, 0, 'rgba(165, 175, 185, 0.45)', 2.5);
        drawVein(Math.random() * size, 0, 'rgba(130, 140, 150, 0.25)', 4.0);
        drawVein(Math.random() * size, 0, 'rgba(100, 110, 120, 0.55)', 1.2);
      }
      break;
    }

    case 'marble-nero': {
      // Nero Marquina Black Marble
      ctx.fillStyle = '#18191B';
      ctx.fillRect(0, 0, size, size);

      // Sharp white veins
      const drawWhiteVein = (startX: number, startY: number, width: number) => {
        ctx.strokeStyle = 'rgba(240, 245, 250, 0.75)';
        ctx.lineWidth = width;
        ctx.beginPath();
        let curX = startX;
        let curY = startY;
        ctx.moveTo(curX, curY);

        for (let s = 0; s < 7; s++) {
          curX += (Math.random() - 0.4) * (size / 3.5);
          curY += Math.random() * (size / 4);
          ctx.lineTo(curX, curY);
        }
        ctx.stroke();
      };

      for (let v = 0; v < 5; v++) {
        drawWhiteVein(Math.random() * size, 0, 1.8);
        drawWhiteVein(Math.random() * size, 0, 0.8);
      }
      break;
    }

    case 'tile-subway': {
      // Glossy White Subway Tile with clean mortar joints
      ctx.fillStyle = '#E5E7EB'; // Grout color
      ctx.fillRect(0, 0, size, size);

      const tileW = size / 4;
      const tileH = size / 8;
      const grout = 4;

      for (let r = 0; r < 8; r++) {
        const offset = (r % 2 === 0) ? 0 : tileW / 2;
        for (let c = -1; c < 5; c++) {
          const x = c * tileW + offset;
          const y = r * tileH;

          // Tile surface with slight glossy gradient
          const grad = ctx.createLinearGradient(x, y, x, y + tileH);
          grad.addColorStop(0, '#FFFFFF');
          grad.addColorStop(0.85, '#FAFAFA');
          grad.addColorStop(1, '#F3F4F6');

          ctx.fillStyle = grad;
          ctx.fillRect(x + grout / 2, y + grout / 2, tileW - grout, tileH - grout);
        }
      }
      break;
    }

    case 'tile-stone': {
      // Architectural Grey Stone Tiles
      ctx.fillStyle = '#6B7280'; // Grout
      ctx.fillRect(0, 0, size, size);

      const gridSize = size / 3;
      const grout = 4;

      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const x = c * gridSize;
          const y = r * gridSize;

          // Stone texture
          const tone = (Math.random() - 0.5) * 12;
          ctx.fillStyle = `rgb(${160 + tone}, ${165 + tone}, ${168 + tone})`;
          ctx.fillRect(x + grout / 2, y + grout / 2, gridSize - grout, gridSize - grout);

          // Grain specks
          ctx.fillStyle = 'rgba(75, 85, 95, 0.15)';
          for (let p = 0; p < 80; p++) {
            ctx.fillRect(
              x + grout + Math.random() * (gridSize - grout * 2),
              y + grout + Math.random() * (gridSize - grout * 2),
              2, 2
            );
          }
        }
      }
      break;
    }

    case 'tile-travertine': {
      // Warm Travertine Stone
      ctx.fillStyle = '#E8DEC8';
      ctx.fillRect(0, 0, size, size);

      // Horizontal porous bands
      ctx.fillStyle = 'rgba(180, 160, 130, 0.3)';
      for (let i = 0; i < 20; i++) {
        const y = Math.random() * size;
        const h = Math.random() * 8 + 2;
        ctx.fillRect(0, y, size, h);
      }

      // Small pit dots
      ctx.fillStyle = 'rgba(140, 120, 90, 0.35)';
      for (let d = 0; d < 120; d++) {
        ctx.fillRect(Math.random() * size, Math.random() * size, Math.random() * 3 + 1, Math.random() * 2 + 1);
      }
      break;
    }

    case 'tile-terrazzo': {
      // Pearl White Terrazzo with mineral flecks
      ctx.fillStyle = '#F3F2EE';
      ctx.fillRect(0, 0, size, size);

      const colors = ['#2B2D2F', '#A3684B', '#95A192', '#C8B291', '#D4AF37'];
      for (let i = 0; i < 220; i++) {
        const color = colors[Math.floor(Math.random() * colors.length)];
        ctx.fillStyle = color;
        const rad = Math.random() * 7 + 2;
        const cx = Math.random() * size;
        const cy = Math.random() * size;

        ctx.beginPath();
        // Polygon / chip-like shape
        ctx.moveTo(cx + (Math.random() - 0.5) * rad, cy + (Math.random() - 0.5) * rad);
        ctx.lineTo(cx + rad, cy + (Math.random() - 0.5) * rad);
        ctx.lineTo(cx + (Math.random() - 0.5) * rad, cy + rad);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }

    case 'tile-emerald': {
      // Glazed Emerald Green Ceramic Tile
      ctx.fillStyle = '#133E2E'; // Dark grout
      ctx.fillRect(0, 0, size, size);

      const tW = size / 4;
      const tH = size / 4;
      const gr = 3;

      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          const x = c * tW;
          const y = r * tH;

          const grad = ctx.createRadialGradient(x + tW / 2, y + tH / 2, 2, x + tW / 2, y + tH / 2, tW * 0.7);
          grad.addColorStop(0, '#2D7A58');
          grad.addColorStop(0.8, '#1C5B40');
          grad.addColorStop(1, '#114430');

          ctx.fillStyle = grad;
          ctx.fillRect(x + gr / 2, y + gr / 2, tW - gr, tH - gr);
        }
      }
      break;
    }

    case 'concrete-polished': {
      // Modern Architectural Polished Concrete
      ctx.fillStyle = '#D6D6D2';
      ctx.fillRect(0, 0, size, size);

      // Fine aggregate specks
      for (let i = 0; i < 400; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(70, 70, 70, 0.08)' : 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(Math.random() * size, Math.random() * size, 1.5, 1.5);
      }
      break;
    }

    case 'concrete-slate': {
      // Dark Slate Concrete
      ctx.fillStyle = '#424549';
      ctx.fillRect(0, 0, size, size);

      for (let i = 0; i < 300; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(20, 20, 20, 0.15)' : 'rgba(120, 120, 120, 0.15)';
        ctx.fillRect(Math.random() * size, Math.random() * size, 2, 2);
      }
      break;
    }

    case 'zinc-roof': {
      // Matte Standing-Seam Zinc Roofing
      ctx.fillStyle = '#323639';
      ctx.fillRect(0, 0, size, size);

      const seamStep = size / 6;
      for (let x = 0; x < size; x += seamStep) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.fillRect(x - 2, 0, 4, size);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(x + 2, 0, 2, size);
      }
      break;
    }

    case 'terracotta-roof': {
      // Mediterranean Clay Terracotta Tile
      ctx.fillStyle = '#B45338';
      ctx.fillRect(0, 0, size, size);

      const barrelH = size / 5;
      for (let y = 0; y < size; y += barrelH) {
        const grad = ctx.createLinearGradient(0, y, 0, y + barrelH);
        grad.addColorStop(0, '#C86448');
        grad.addColorStop(0.5, '#A8482E');
        grad.addColorStop(1, '#8C3820');

        ctx.fillStyle = grad;
        ctx.fillRect(0, y, size, barrelH - 3);
      }
      break;
    }

    case 'deck-teak': {
      // Weathered Teak Outdoor Decking
      ctx.fillStyle = '#8B6A47';
      ctx.fillRect(0, 0, size, size);

      const boardH = size / 8;
      for (let i = 0; i < 8; i++) {
        const y = i * boardH;
        ctx.fillStyle = i % 2 === 0 ? '#92714D' : '#846341';
        ctx.fillRect(0, y, size, boardH - 2);

        // Gap
        ctx.fillStyle = '#2C1D11';
        ctx.fillRect(0, y + boardH - 2, size, 2);
      }
      break;
    }

    default:
      ctx.fillStyle = '#E5E7EB';
      ctx.fillRect(0, 0, size, size);
  }

  return canvas;
}

/**
 * Returns a cached Three.js CanvasTexture for rendering in 3D.
 */
export function getProceduralTexture(type: TextureGeneratorType, repeat: [number, number] = [4, 4]): THREE.CanvasTexture {
  const key = `${type}_${repeat[0]}x${repeat[1]}`;
  if (textureCache.has(key)) {
    return textureCache.get(key)!;
  }

  const canvas = generateProceduralCanvas(type, 512);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat[0], repeat[1]);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  textureCache.set(key, texture);
  return texture;
}

/**
 * Returns a data URL thumbnail for the UI material card.
 */
export function getMaterialThumbnail(type: TextureGeneratorType): string {
  if (thumbnailCache.has(type)) {
    return thumbnailCache.get(type)!;
  }

  if (typeof document === 'undefined') {
    return '';
  }

  const canvas = generateProceduralCanvas(type, 128);
  const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
  thumbnailCache.set(type, dataUrl);
  return dataUrl;
}
