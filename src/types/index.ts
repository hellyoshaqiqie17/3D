export type MaterialCategory =
  | 'wall'
  | 'floor'
  | 'paint'
  | 'bathroom'
  | 'roof'
  | 'door'
  | 'window'
  | 'exterior';

export type MaterialType = 'color' | 'texture';

export type FinishType = 'matte' | 'satin' | 'gloss' | 'brushed' | 'textured';

export type TextureGeneratorType =
  | 'wood-oak'
  | 'wood-walnut'
  | 'wood-herringbone'
  | 'marble-carrara'
  | 'marble-nero'
  | 'tile-subway'
  | 'tile-stone'
  | 'tile-terrazzo'
  | 'tile-travertine'
  | 'tile-emerald'
  | 'concrete-polished'
  | 'concrete-slate'
  | 'zinc-roof'
  | 'terracotta-roof'
  | 'deck-teak';

export interface ZoneTextureSettings {
  repeat: [number, number];
  bumpScale: number;
  rotation: number;
  roughness: number;
  colorTint?: string;
  tileSizeCm?: [number, number]; // [widthCm, heightCm] e.g. [60, 60], [100, 100], [60, 120]
  surfaceType?: 'wall' | 'floor';
  showGrout?: boolean; // Tampilkan nat keramik pembatas
  groutWidthMm?: number; // Lebar nat pembatas dalam mm (1..8 mm)
  groutColor?: string; // Warna nat (e.g. '#8E9297')
}

export interface MaterialOption {
  id: string;
  name: string;
  category: MaterialCategory;
  type: MaterialType;
  color?: string; // Base HEX color
  textureType?: TextureGeneratorType; // Procedural texture generator ID
  textureUrl?: string; // Fallback or custom uploaded texture image URL
  bumpScale?: number; // 3D relief tactile depth
  rotation?: number;
  roughness: number;
  metalness: number;
  finish: FinishType;
  repeat?: [number, number];
  tileSizeCm?: [number, number]; // Physical tile size in cm [width, height]
  surfaceType?: 'wall' | 'floor';
  showGrout?: boolean;
  groutWidthMm?: number;
  groutColor?: string;
  description?: string;
  tag?: string;
  previewThumbnail?: string;
  isCustomUpload?: boolean;
}

export interface MaterialZone {
  id: string;
  name: string;
  category: MaterialCategory;
  meshNames: string[];
  defaultMaterialId: string;
  description?: string;
}

export interface Project {
  id: string;
  userId?: string;
  author?: string;
  isPublic?: boolean;
  name: string;
  clientName: string;
  description: string;
  modelUrl: string;
  thumbnailUrl: string;
  createdAt: string;
  updatedAt: string;
  status: 'published' | 'draft' | 'archived';
  zones: MaterialZone[];
  viewsCount?: number;
  savedConfigsCount?: number;
  modelType?: 'architecture' | 'furniture';
  savedConfiguration?: {
    materials: Record<string, string>;
    customColors: Record<string, string>;
    textureSettings?: Record<string, ZoneTextureSettings>;
    savedAt?: string;
  };
}

export interface ProjectConfiguration {
  id?: string;
  projectId: string;
  title?: string;
  materials: Record<string, string>; // zoneId -> materialId
  customColors: Record<string, string>; // zoneId -> custom hex color
  textureSettings?: Record<string, ZoneTextureSettings>; // zoneId -> repeat, bumpScale, etc.
  createdAt: string;
  updatedAt: string;
}

export interface CameraPreset {
  id: string;
  name: string;
  iconName: string;
  position: [number, number, number];
  target: [number, number, number];
  description?: string;
}

export interface DetectedMeshInfo {
  name: string;
  geometryType: string;
  vertexCount: number;
  materialName: string;
  initialColor: string;
  bounds: {
    width: number;
    height: number;
    depth: number;
  };
}

export interface BuildingFloorLevel {
  levelNumber: number; // 1, 2, 3...
  name: string; // "Lantai 1", "Lantai 2", "Lantai 3"
  elevationY: number; // elevation where the floor slab starts
  ceilingY: number; // elevation where this floor's ceiling starts
}

export interface User {
  id: string;
  name: string;
  email: string;
  username?: string;
  studioName: string;
  role: string;
  avatar?: string;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  message?: string;
}
