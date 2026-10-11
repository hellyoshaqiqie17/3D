import { MaterialOption, MaterialCategory } from '@/types';

export const ORIGINAL_MATERIAL: MaterialOption = {
  id: 'original',
  name: 'Original 3D Model',
  category: 'wall',
  type: 'color',
  color: '#FFFFFF',
  roughness: 0.5,
  metalness: 0.0,
  finish: 'matte',
  description: 'Warna dan tekstur bawaan asli dari file 3D CAD / SketchUp.',
  tag: 'Original',
};

export const SOLID_COLOR_MATERIAL: MaterialOption = {
  id: 'architectural-color',
  name: 'Architectural Solid Color',
  category: 'wall',
  type: 'color',
  color: '#FFFFFF',
  roughness: 0.85,
  metalness: 0.0,
  finish: 'matte',
  description: 'Warna arsitektural solid pilihan desainer.',
  tag: 'Color',
};

export const MATERIAL_CATEGORIES: { id: MaterialCategory; label: string; icon: string }[] = [
  { id: 'wall', label: 'Walls', icon: 'Paintbrush' },
  { id: 'floor', label: 'Floors', icon: 'LayoutGrid' },
  { id: 'bathroom', label: 'Bathroom & Tiles', icon: 'Sparkles' },
  { id: 'roof', label: 'Roofing', icon: 'Home' },
  { id: 'door', label: 'Doors & Frames', icon: 'DoorOpen' },
  { id: 'exterior', label: 'Exterior Facade', icon: 'Building' },
];

/**
 * Clean Material Library:
 * Dummy items and hardcoded color swatches removed as requested.
 * Colors are chosen via the Architectural Colors palette.
 * Only Original 3D and user-uploaded custom ceramics/textures are listed.
 */
export const MATERIAL_LIBRARY: MaterialOption[] = [
  ORIGINAL_MATERIAL,
];

export function isMaterialForCategory(mat: MaterialOption, category: MaterialCategory): boolean {
  // Uploaded materials are globally available across surfaces (wall, floor, etc.)
  if (mat.isCustomUpload) {
    return true;
  }

  // If explicitly tagged with surfaceType ('wall' | 'floor')
  if (mat.surfaceType) {
    if (mat.surfaceType === 'floor') return category === 'floor';
    if (mat.surfaceType === 'wall') return category === 'wall';
    return mat.surfaceType === category;
  }

  // If explicitly categorized
  if (mat.category) {
    if (mat.category === 'floor') return category === 'floor';
    if (mat.category === 'wall') return category === 'wall';
    return mat.category === category;
  }

  // Heuristic based on title/description for legacy materials
  const lowerName = (mat.name || '').toLowerCase();
  const lowerDesc = (mat.description || '').toLowerCase();
  if (lowerName.includes('lantai') || lowerDesc.includes('lantai') || lowerName.includes('floor')) {
    return category === 'floor';
  }
  if (lowerName.includes('dinding') || lowerDesc.includes('dinding') || lowerName.includes('wall') || lowerName.includes('tembok')) {
    return category === 'wall';
  }
  return category === 'wall';
}

export function getMaterialsByCategory(
  category: MaterialCategory,
  customMaterials?: MaterialOption[]
): MaterialOption[] {
  const custom = (customMaterials || []).filter((mat) => isMaterialForCategory(mat, category));
  const standard = MATERIAL_LIBRARY.filter(
    (mat) => mat.category === category && mat.id !== 'original'
  );
  const seen = new Set<string>();
  const result: MaterialOption[] = [];
  for (const m of [...custom, ...standard]) {
    if (!seen.has(m.id)) {
      seen.add(m.id);
      result.push(m);
    }
  }
  return result;
}

export function getMaterialById(
  id: string,
  customMaterials?: MaterialOption[]
): MaterialOption | undefined {
  if (id === 'original') return ORIGINAL_MATERIAL;
  if (id === 'architectural-color' || id === 'wall-pure-white') return SOLID_COLOR_MATERIAL;
  if (customMaterials && customMaterials.length > 0) {
    const foundCustom = customMaterials.find((mat) => mat.id === id);
    if (foundCustom) return foundCustom;
  }
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('homecraft_custom_pbr_materials');
      if (stored) {
        const parsed: MaterialOption[] = JSON.parse(stored);
        const match = parsed.find((m) => m.id === id);
        if (match) return match;
      }
    } catch {}
  }
  return (
    MATERIAL_LIBRARY.find((mat) => mat.id === id) ||
    (id.startsWith('wall-') || id.startsWith('floor-') ? SOLID_COLOR_MATERIAL : undefined)
  );
}
