export interface TileSizePreset {
  id: string;
  label: string;
  widthCm: number;
  heightCm: number;
  surface: 'floor' | 'wall';
}

/**
 * Standard Indonesian architectural tile sizes for Floors (Ukuran Lantai)
 * as requested from construction specifications:
 * 25x25, 30x30, 40x40, 50x50, 60x60, 80x80, 100x100, 60x120, 60x135
 */
export const FLOOR_TILE_PRESETS: TileSizePreset[] = [
  { id: 'floor-25x25', label: '25 × 25 cm', widthCm: 25, heightCm: 25, surface: 'floor' },
  { id: 'floor-30x30', label: '30 × 30 cm', widthCm: 30, heightCm: 30, surface: 'floor' },
  { id: 'floor-40x40', label: '40 × 40 cm', widthCm: 40, heightCm: 40, surface: 'floor' },
  { id: 'floor-50x50', label: '50 × 50 cm', widthCm: 50, heightCm: 50, surface: 'floor' },
  { id: 'floor-60x60', label: '60 × 60 cm', widthCm: 60, heightCm: 60, surface: 'floor' },
  { id: 'floor-80x80', label: '80 × 80 cm', widthCm: 80, heightCm: 80, surface: 'floor' },
  { id: 'floor-100x100', label: '100 × 100 cm', widthCm: 100, heightCm: 100, surface: 'floor' },
  { id: 'floor-60x120', label: '60 × 120 cm', widthCm: 60, heightCm: 120, surface: 'floor' },
  { id: 'floor-60x135', label: '60 × 135 cm', widthCm: 60, heightCm: 135, surface: 'floor' },
];

/**
 * Standard Indonesian architectural tile sizes for Walls (Ukuran Dinding)
 * as requested from construction specifications:
 * 25x40, 25x50, 30x60, 40x80, 60x120, 90x180
 */
export const WALL_TILE_PRESETS: TileSizePreset[] = [
  { id: 'wall-25x40', label: '25 × 40 cm', widthCm: 25, heightCm: 40, surface: 'wall' },
  { id: 'wall-25x50', label: '25 × 50 cm', widthCm: 25, heightCm: 50, surface: 'wall' },
  { id: 'wall-30x60', label: '30 × 60 cm', widthCm: 30, heightCm: 60, surface: 'wall' },
  { id: 'wall-40x80', label: '40 × 80 cm', widthCm: 40, heightCm: 80, surface: 'wall' },
  { id: 'wall-60x120', label: '60 × 120 cm', widthCm: 60, heightCm: 120, surface: 'wall' },
  { id: 'wall-90x180', label: '90 × 180 cm', widthCm: 90, heightCm: 180, surface: 'wall' },
];

export const GROUT_COLOR_PRESETS = [
  { name: 'Abu-abu Semen (Standar)', hex: '#8E9297' },
  { name: 'Putih Nat Bersih', hex: '#EAEAEA' },
  { name: 'Krem Semen Natural', hex: '#D7CEB2' },
  { name: 'Hitam Antrasit Gelap', hex: '#2A2C2E' },
  { name: 'Cokelat Terracotta', hex: '#93664A' },
];

export const GROUT_WIDTH_PRESETS = [
  { label: 'Tanpa Nat (0 mm)', valueMm: 0 },
  { label: '1 mm (Presisi Halus)', valueMm: 1 },
  { label: '2 mm (Standar Konstruksi)', valueMm: 2 },
  { label: '3 mm (Keramik Umum)', valueMm: 3 },
  { label: '4 mm (Roster / Slate)', valueMm: 4 },
  { label: '5 mm (Batu Alam Kasar)', valueMm: 5 },
];

/**
 * Calculates physical real-world UV repeat factors for meter-based projection:
 * For example:
 * - 100 x 100 cm tile -> repeat [1, 1] (exactly 1 tile per 1 meter wall)
 * - 50 x 50 cm tile -> repeat [2, 2] (exactly 2 tiles per 1 meter wall)
 * - 25 x 25 cm tile -> repeat [4, 4] (exactly 4 tiles per 1 meter wall)
 * - 60 x 120 cm tile -> repeat [1.6667, 0.8333]
 */
export function calculateRepeatFromTileSize(tileSizeCm: [number, number]): [number, number] {
  const w = Math.max(5, tileSizeCm[0]);
  const h = Math.max(5, tileSizeCm[1]);
  return [parseFloat((100 / w).toFixed(4)), parseFloat((100 / h).toFixed(4))];
}

export function formatTileDimensions(tileSizeCm?: [number, number]): string {
  if (!tileSizeCm) return 'Bawaan';
  return `${tileSizeCm[0]} × ${tileSizeCm[1]} cm`;
}
