export type MaterialCategory =
  | 'wall'
  | 'floor'
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

export interface MaterialOption {
  id: string;
  name: string;
  category: MaterialCategory;
  type: MaterialType;
  color?: string; // Base HEX color
  textureType?: TextureGeneratorType; // Procedural texture generator ID
  textureUrl?: string; // Fallback or custom uploaded texture image URL
  roughness: number;
  metalness: number;
  finish: FinishType;
  repeat?: [number, number];
  description?: string;
  tag?: string;
  previewThumbnail?: string;
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
}

export interface ProjectConfiguration {
  id?: string;
  projectId: string;
  title?: string;
  materials: Record<string, string>; // zoneId -> materialId
  customColors: Record<string, string>; // zoneId -> custom hex color
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
