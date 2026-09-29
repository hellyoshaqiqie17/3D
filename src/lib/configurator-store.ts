import { create } from 'zustand';
import { MaterialCategory, MaterialZone } from '@/types';

export interface DetectedFootprint {
  mainWidth: number;
  mainDepth: number;
  mainCenterX: number;
  mainCenterZ: number;
  totalWidth: number;
  totalDepth: number;
  totalCenterX: number;
  totalCenterZ: number;
}

interface ConfiguratorState {
  // Navigation & selection
  selectedZoneId: string | null;
  activeCategory: MaterialCategory;
  hoveredMeshName: string | null;
  selectedMeshName: string | null;

  // Active material selections: zoneId -> materialId
  selectedMaterials: Record<string, string>;
  // Custom user colors: zoneId -> hex code
  customColors: Record<string, string>;

  // Camera & view mode
  activeCameraPreset: string;
  isPresentationMode: boolean;
  isWireframeMode: boolean;
  isOriginalMode: boolean;

  // Floor & Ceramic Tile Customization
  floorEnabled: boolean;
  floorTextureUrl: string | null;
  floorPresetId: string;
  floorTileRepeat: number;
  floorRoughness: number;
  floorColor: string;
  floorSizeScale: number;
  floorElevation: number;

  // Building footprint & indoor fit detection
  detectedFootprint: DetectedFootprint | null;
  floorFitMode: 'interior' | 'full' | 'custom';
  floorCustomWidth: number;
  floorCustomDepth: number;
  floorOffsetX: number;
  floorOffsetZ: number;

  // UI modals
  isSaveModalOpen: boolean;
  isShareModalOpen: boolean;

  // Actions
  selectZone: (zoneId: string | null) => void;
  setActiveCategory: (category: MaterialCategory) => void;
  applyMaterial: (zoneId: string, materialId: string) => void;
  setCustomColor: (zoneId: string, color: string) => void;
  setHoveredMesh: (name: string | null) => void;
  setSelectedMesh: (name: string | null) => void;
  setCameraPreset: (presetId: string) => void;
  togglePresentationMode: () => void;
  setPresentationMode: (val: boolean) => void;
  toggleWireframe: () => void;
  toggleOriginalMode: () => void;
  setOriginalMode: (val: boolean) => void;
  setSaveModalOpen: (val: boolean) => void;
  setShareModalOpen: (val: boolean) => void;

  // Floor Actions
  setFloorEnabled: (val: boolean) => void;
  setFloorTextureUrl: (url: string | null) => void;
  setFloorPresetId: (id: string) => void;
  setFloorTileRepeat: (repeat: number) => void;
  setFloorRoughness: (roughness: number) => void;
  setFloorColor: (color: string) => void;
  setFloorSizeScale: (scale: number) => void;
  setFloorElevation: (elevation: number) => void;
  setDetectedFootprint: (fp: DetectedFootprint) => void;
  setFloorFitMode: (mode: 'interior' | 'full' | 'custom') => void;
  setFloorCustomWidth: (w: number) => void;
  setFloorCustomDepth: (d: number) => void;
  setFloorOffsetX: (x: number) => void;
  setFloorOffsetZ: (z: number) => void;

  resetConfiguration: (zones: MaterialZone[]) => void;
  loadConfiguration: (materials: Record<string, string>, customColors?: Record<string, string>, floorConfig?: any) => void;
}

export const useConfiguratorStore = create<ConfiguratorState>((set) => ({
  selectedZoneId: 'wall_ext',
  activeCategory: 'wall',
  hoveredMeshName: null,
  selectedMeshName: null,

  selectedMaterials: {},
  customColors: {},

  activeCameraPreset: 'exterior',
  isPresentationMode: false,
  isWireframeMode: false,
  isOriginalMode: false,

  // Floor & Ceramic Tile Customization Defaults
  floorEnabled: true,
  floorTextureUrl: null,
  floorPresetId: 'floor-carrara-marble',
  floorTileRepeat: 8,
  floorRoughness: 0.15,
  floorColor: '#ffffff',
  floorSizeScale: 1.0,
  floorElevation: 0.02,

  // Building footprint & indoor fit detection
  detectedFootprint: null,
  floorFitMode: 'interior',
  floorCustomWidth: 13.0,
  floorCustomDepth: 25.0,
  floorOffsetX: 0,
  floorOffsetZ: 0,

  isSaveModalOpen: false,
  isShareModalOpen: false,

  selectZone: (zoneId) => set({ selectedZoneId: zoneId }),
  setActiveCategory: (category) => set({ activeCategory: category }),

  // Floor Actions
  setFloorEnabled: (val) => set({ floorEnabled: val }),
  setFloorTextureUrl: (url) => set({ floorTextureUrl: url, isOriginalMode: false }),
  setFloorPresetId: (id) => set({ floorPresetId: id, floorTextureUrl: null, isOriginalMode: false }),
  setFloorTileRepeat: (repeat) => set({ floorTileRepeat: repeat }),
  setFloorRoughness: (roughness) => set({ floorRoughness: roughness }),
  setFloorColor: (color) => set({ floorColor: color, isOriginalMode: false }),
  setFloorSizeScale: (scale) => set({ floorSizeScale: scale }),
  setFloorElevation: (elevation) => set({ floorElevation: elevation }),
  setDetectedFootprint: (fp) =>
    set((state) => ({
      detectedFootprint: fp,
      floorCustomWidth: fp.mainWidth,
      floorCustomDepth: fp.mainDepth,
    })),
  setFloorFitMode: (mode) => set({ floorFitMode: mode }),
  setFloorCustomWidth: (w) => set({ floorCustomWidth: w }),
  setFloorCustomDepth: (d) => set({ floorCustomDepth: d }),
  setFloorOffsetX: (x) => set({ floorOffsetX: x }),
  setFloorOffsetZ: (z) => set({ floorOffsetZ: z }),

  applyMaterial: (zoneId, materialId) =>
    set((state) => ({
      isOriginalMode: false, // Automatically switch back from original mode when applying a material
      selectedMaterials: {
        ...state.selectedMaterials,
        [zoneId]: materialId,
      },
      // Clear custom color for this zone if selecting a predefined material
      customColors: {
        ...state.customColors,
        [zoneId]: '',
      },
    })),

  setCustomColor: (zoneId, color) =>
    set((state) => ({
      isOriginalMode: false, // Automatically switch back from original mode when changing color
      customColors: {
        ...state.customColors,
        [zoneId]: color,
      },
    })),

  setHoveredMesh: (name) => set({ hoveredMeshName: name }),
  setSelectedMesh: (name) => set({ selectedMeshName: name }),

  setCameraPreset: (presetId) => set({ activeCameraPreset: presetId }),

  togglePresentationMode: () => set((state) => ({ isPresentationMode: !state.isPresentationMode })),
  setPresentationMode: (val) => set({ isPresentationMode: val }),

  toggleWireframe: () => set((state) => ({ isWireframeMode: !state.isWireframeMode })),

  toggleOriginalMode: () => set((state) => ({ isOriginalMode: !state.isOriginalMode })),
  setOriginalMode: (val) => set({ isOriginalMode: val }),

  setSaveModalOpen: (val) => set({ isSaveModalOpen: val }),
  setShareModalOpen: (val) => set({ isShareModalOpen: val }),

  resetConfiguration: (zones) => {
    const defaults: Record<string, string> = {};
    zones.forEach((z) => {
      defaults[z.id] = z.defaultMaterialId;
    });
    set({
      selectedMaterials: defaults,
      customColors: {},
      floorEnabled: true,
      floorTextureUrl: null,
      floorPresetId: 'floor-carrara-marble',
      floorTileRepeat: 8,
      floorRoughness: 0.15,
      floorColor: '#ffffff',
      floorSizeScale: 1.15,
      floorElevation: 0.02,
    });
  },

  loadConfiguration: (materials, customColors = {}, floorConfig) =>
    set((state) => ({
      selectedMaterials: materials,
      customColors: customColors,
      ...(floorConfig
        ? {
            floorEnabled: floorConfig.enabled ?? state.floorEnabled,
            floorTextureUrl: floorConfig.textureUrl ?? state.floorTextureUrl,
            floorPresetId: floorConfig.presetId ?? state.floorPresetId,
            floorTileRepeat: floorConfig.tileRepeat ?? state.floorTileRepeat,
            floorRoughness: floorConfig.roughness ?? state.floorRoughness,
            floorColor: floorConfig.color ?? state.floorColor,
            floorSizeScale: floorConfig.sizeScale ?? state.floorSizeScale,
            floorElevation: floorConfig.elevation ?? state.floorElevation,
          }
        : {}),
    })),
}));
