import { create } from 'zustand';
import { MaterialCategory, MaterialZone, MaterialOption, ZoneTextureSettings, BuildingFloorLevel } from '@/types';

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
  isSelectionHighlightVisible: boolean;

  // Active material selections: zoneId -> materialId
  selectedMaterials: Record<string, string>;
  // Custom user colors: zoneId -> hex code
  customColors: Record<string, string>;

  // Camera & view mode
  activeCameraPreset: string;
  cameraPresetVersion: number; // increments on every preset click (re-click = go back to that view)
  isPresentationMode: boolean;
  isSidebarHidden: boolean;
  isWireframeMode: boolean;
  isOriginalMode: boolean;

  // Architectural Perspective & Interior Visibility
  isRoofHidden: boolean;
  isFurnitureHidden: boolean; // Sembunyikan perabot & elektronik (Bare Room mode)
  isEnvironmentHidden: boolean;
  cameraFov: number; // 50 for exterior, 75 for interior wide-angle
  cameraMode: 'orbit' | 'interior' | 'walk';
  houseCenter: [number, number, number];
  houseSize: [number, number, number];
  isCeilingCut: boolean; // Cuts ceiling/plafon at 2.45m so interior is completely open from above
  ceilingCutHeight: number; // default 2.45 meters
  isAutoRotate: boolean; // 360 rotation in-place or turntable
  autoRotateSpeed: number; // rotation speed multiplier (default 1.5)
  isLookAround360: boolean; // Manual in-place 360 look around from stationary point
  isWalkMode: boolean; // Blender-style Walk/Fly walkthrough navigation
  walkSpeed: number;

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
  isReportModalOpen: boolean;

  // User imported custom designer materials (.png / .jpg)
  uploadedMaterials: MaterialOption[];
  zoneTextureSettings: Record<string, ZoneTextureSettings>;

  // Dynamic on-the-fly zones for meshes clicked in 3D that were not pre-configured
  dynamicZones: MaterialZone[];

  // Actions
  addDynamicZone: (zone: MaterialZone) => void;
  clearDynamicZones: () => void;
  addUploadedMaterial: (material: MaterialOption) => void;
  setZoneTextureSettings: (zoneId: string, settings: Partial<ZoneTextureSettings>) => void;
  setZoneTint: (zoneId: string, color: string) => void;
  selectZone: (zoneId: string | null) => void;
  setActiveCategory: (category: MaterialCategory) => void;
  applyMaterial: (zoneId: string, materialId: string) => void;
  setCustomColor: (zoneId: string, color: string) => void;
  setHoveredMesh: (name: string | null) => void;
  setSelectedMesh: (name: string | null) => void;
  setSelectionHighlightVisible: (visible: boolean) => void;
  setCameraPreset: (presetId: string) => void;
  togglePresentationMode: () => void;
  setPresentationMode: (val: boolean) => void;
  toggleSidebar: () => void;
  setSidebarHidden: (val: boolean) => void;
  toggleWireframe: () => void;
  toggleOriginalMode: () => void;
  setOriginalMode: (val: boolean) => void;
  setSaveModalOpen: (val: boolean) => void;
  setShareModalOpen: (val: boolean) => void;
  setReportModalOpen: (val: boolean) => void;

  // Perspective & Interior Visibility Actions
  toggleRoofHidden: () => void;
  setRoofHidden: (val: boolean) => void;
  toggleFurnitureHidden: () => void;
  setFurnitureHidden: (val: boolean) => void;
  toggleEnvironmentHidden: () => void;
  setEnvironmentHidden: (val: boolean) => void;

  // Intelligent Multi-level Floor Visibility
  detectedFloors: BuildingFloorLevel[];
  hiddenFloors: number[];
  setDetectedFloors: (floors: BuildingFloorLevel[]) => void;
  toggleFloorHidden: (levelNumber: number) => void;
  setFloorHidden: (levelNumber: number, hidden: boolean) => void;

  setCameraFov: (fov: number) => void;
  setCameraMode: (mode: 'orbit' | 'interior' | 'walk') => void;
  setHouseBounds: (center: [number, number, number], size: [number, number, number]) => void;
  toggleCeilingCut: () => void;
  setCeilingCut: (val: boolean) => void;
  setCeilingCutHeight: (height: number) => void;
  toggleAutoRotate: () => void;
  setAutoRotate: (val: boolean) => void;
  setAutoRotateSpeed: (speed: number) => void;
  toggleLookAround360: () => void;
  setLookAround360: (val: boolean) => void;
  toggleWalkMode: () => void;
  setWalkMode: (val: boolean) => void;
  setWalkSpeed: (speed: number) => void;
  enterRoom: () => void;

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

  setZoneOriginal: (zoneId: string) => void;
  resetConfiguration: (zones: MaterialZone[], isDemoProject?: boolean) => void;
  loadConfiguration: (
    materials: Record<string, string>,
    customColors?: Record<string, string>,
    floorConfig?: any,
    textureSettings?: Record<string, ZoneTextureSettings>
  ) => void;
}

const DEFAULT_CLIENT_MATERIALS: MaterialOption[] = [];

export const useConfiguratorStore = create<ConfiguratorState>((set) => ({
  selectedZoneId: 'wall_ext',
  activeCategory: 'wall',
  hoveredMeshName: null,
  selectedMeshName: null,
  isSelectionHighlightVisible: false,

  selectedMaterials: {},
  customColors: {},

  uploadedMaterials: DEFAULT_CLIENT_MATERIALS,
  zoneTextureSettings: {},
  dynamicZones: [],

  activeCameraPreset: 'exterior',
  cameraPresetVersion: 0,
  isPresentationMode: false,
  isSidebarHidden: false,
  isWireframeMode: false,
  isOriginalMode: false,

  // Architectural Perspective & Visibility Defaults
  isRoofHidden: false,
  isFurnitureHidden: false,
  isEnvironmentHidden: false,
  cameraFov: 50,
  cameraMode: 'orbit',
  houseCenter: [0, 1.5, 0],
  houseSize: [10, 4, 12],
  isCeilingCut: false,
  ceilingCutHeight: 2.70,
  isAutoRotate: false,
  autoRotateSpeed: 1.5,
  isLookAround360: false,
  isWalkMode: false,
  walkSpeed: 1.0,

  // Multi-level Floor Visibility
  detectedFloors: [],
  hiddenFloors: [],

  // Floor & Ceramic Tile Customization Defaults (disabled by default so it doesn't cover existing model road/ground)
  floorEnabled: false,
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
  isReportModalOpen: false,

  addDynamicZone: (zone) =>
    set((state) => {
      const exists = state.dynamicZones.some((z) => z.id === zone.id);
      if (exists) return state;
      return { dynamicZones: [...state.dynamicZones, zone] };
    }),

  clearDynamicZones: () => set({ dynamicZones: [] }),

  addUploadedMaterial: (material) =>
    set((state) => ({
      uploadedMaterials: [material, ...state.uploadedMaterials],
    })),

  setZoneTextureSettings: (zoneId, partial) =>
    set((state) => ({
      isOriginalMode: false,
      isSelectionHighlightVisible: false,
      zoneTextureSettings: {
        ...state.zoneTextureSettings,
        [zoneId]: {
          ...(state.zoneTextureSettings[zoneId] || {
            repeat: [4, 4],
            bumpScale: 0.14,
            rotation: 0,
            roughness: 0.35,
            colorTint: '#FFFFFF',
          }),
          ...partial,
        },
      },
    })),

  setZoneTint: (zoneId, color) =>
    set((state) => ({
      isOriginalMode: false,
      isSelectionHighlightVisible: false,
      zoneTextureSettings: {
        ...state.zoneTextureSettings,
        [zoneId]: {
          ...(state.zoneTextureSettings[zoneId] || {
            repeat: [4, 4],
            bumpScale: 0.14,
            rotation: 0,
            roughness: 0.35,
          }),
          colorTint: color,
        },
      },
      customColors: {
        ...state.customColors,
        [zoneId]: color,
      },
    })),

  selectZone: (zoneId) => set({ selectedZoneId: zoneId }),
  setActiveCategory: (category) => set({ activeCategory: category }),

  // Floor Actions
  setFloorEnabled: (val) => set({ floorEnabled: val }),
  setFloorTextureUrl: (url) => set({ floorTextureUrl: url, isOriginalMode: false, isSelectionHighlightVisible: false }),
  setFloorPresetId: (id) => set({ floorPresetId: id, floorTextureUrl: null, isOriginalMode: false, isSelectionHighlightVisible: false }),
  setFloorTileRepeat: (repeat) => set({ floorTileRepeat: repeat }),
  setFloorRoughness: (roughness) => set({ floorRoughness: roughness }),
  setFloorColor: (color) => set({ floorColor: color, isOriginalMode: false, isSelectionHighlightVisible: false }),
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
      isSelectionHighlightVisible: false, // Disappear blue box upon applying material so user sees pure result
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
    set((state) => {
      const nextCustomColors = { ...state.customColors };
      if (!color || color.toLowerCase() === 'original') {
        delete nextCustomColors[zoneId];
      } else {
        nextCustomColors[zoneId] = color;
      }
      return {
        isOriginalMode: false,
        isSelectionHighlightVisible: false, // Disappear blue box upon applying color so user sees pure result
        customColors: nextCustomColors,
        zoneTextureSettings: {
          ...state.zoneTextureSettings,
          [zoneId]: {
            ...(state.zoneTextureSettings[zoneId] || {
              repeat: [4, 4],
              bumpScale: 0.14,
              rotation: 0,
              roughness: 0.35,
            }),
            colorTint: color || undefined,
          },
        },
      };
    }),

  setZoneOriginal: (zoneId) =>
    set((state) => {
      const nextCustomColors = { ...state.customColors };
      delete nextCustomColors[zoneId];
      const nextSelectedMaterials = { ...state.selectedMaterials, [zoneId]: 'original' };
      const nextZoneTextureSettings = { ...state.zoneTextureSettings };
      delete nextZoneTextureSettings[zoneId];
      return {
        isSelectionHighlightVisible: false,
        customColors: nextCustomColors,
        selectedMaterials: nextSelectedMaterials,
        zoneTextureSettings: nextZoneTextureSettings,
      };
    }),

  setHoveredMesh: (name) => set({ hoveredMeshName: name }),
  setSelectedMesh: (name) => set({ selectedMeshName: name }),
  setSelectionHighlightVisible: (visible) => set({ isSelectionHighlightVisible: visible }),

  setCameraPreset: (presetId) =>
    set((state) => ({ activeCameraPreset: presetId, cameraPresetVersion: state.cameraPresetVersion + 1 })),

  togglePresentationMode: () =>
    set((state) => {
      const next = !state.isPresentationMode;
      return { isPresentationMode: next, ...(next ? {} : { isSidebarHidden: false }) };
    }),
  setPresentationMode: (val) => set({ isPresentationMode: val, ...(val ? {} : { isSidebarHidden: false }) }),
  toggleSidebar: () => set((state) => ({ isSidebarHidden: !state.isSidebarHidden })),
  setSidebarHidden: (val) => set({ isSidebarHidden: val }),

  toggleWireframe: () => set((state) => ({ isWireframeMode: !state.isWireframeMode })),

  toggleOriginalMode: () => set((state) => ({ isOriginalMode: !state.isOriginalMode })),
  setOriginalMode: (val) => set({ isOriginalMode: val }),

  setSaveModalOpen: (val) => set({ isSaveModalOpen: val }),
  setShareModalOpen: (val) => set({ isShareModalOpen: val }),
  setReportModalOpen: (val) => set({ isReportModalOpen: val }),

  toggleRoofHidden: () =>
    set((state) => {
      const next = !(state.isRoofHidden || state.isCeilingCut);
      return { isRoofHidden: next, isCeilingCut: next };
    }),
  setRoofHidden: (val) => set({ isRoofHidden: val, isCeilingCut: val }),
  toggleFurnitureHidden: () => set((state) => ({ isFurnitureHidden: !state.isFurnitureHidden })),
  setFurnitureHidden: (val) => set({ isFurnitureHidden: val }),
  toggleEnvironmentHidden: () => set((state) => ({ isEnvironmentHidden: !state.isEnvironmentHidden })),
  setEnvironmentHidden: (val) => set({ isEnvironmentHidden: val }),

  setDetectedFloors: (floors) => set({ detectedFloors: floors }),
  toggleFloorHidden: (levelNumber) =>
    set((state) => {
      const isCurrentlyHidden = state.hiddenFloors.includes(levelNumber);
      return {
        hiddenFloors: isCurrentlyHidden
          ? state.hiddenFloors.filter((n) => n !== levelNumber)
          : [...state.hiddenFloors, levelNumber],
      };
    }),
  setFloorHidden: (levelNumber, hidden) =>
    set((state) => {
      const isCurrentlyHidden = state.hiddenFloors.includes(levelNumber);
      if (hidden && !isCurrentlyHidden) {
        return { hiddenFloors: [...state.hiddenFloors, levelNumber] };
      }
      if (!hidden && isCurrentlyHidden) {
        return { hiddenFloors: state.hiddenFloors.filter((n) => n !== levelNumber) };
      }
      return state;
    }),

  setCameraFov: (fov) => set({ cameraFov: fov }),
  setCameraMode: (mode) => set({ cameraMode: mode }),
  setHouseBounds: (center, size) => set({ houseCenter: center, houseSize: size }),
  toggleCeilingCut: () =>
    set((state) => {
      const next = !(state.isCeilingCut || state.isRoofHidden);
      return { isCeilingCut: next, isRoofHidden: next };
    }),
  setCeilingCut: (val) => set({ isCeilingCut: val, isRoofHidden: val }),
  setCeilingCutHeight: (height) => set({ ceilingCutHeight: height }),
  toggleAutoRotate: () =>
    set((state) => ({
      isAutoRotate: !state.isAutoRotate,
      isLookAround360: !state.isAutoRotate ? false : state.isLookAround360,
    })),
  setAutoRotate: (val) => set((state) => ({ isAutoRotate: val, isLookAround360: val ? false : state.isLookAround360 })),
  setAutoRotateSpeed: (speed) => set({ autoRotateSpeed: speed }),
  toggleLookAround360: () =>
    set((state) => ({
      isLookAround360: !state.isLookAround360,
      isAutoRotate: !state.isLookAround360 ? false : state.isAutoRotate,
      isWalkMode: false,
    })),
  setLookAround360: (val) => set((state) => ({ isLookAround360: val, isAutoRotate: val ? false : state.isAutoRotate, isWalkMode: false })),
  toggleWalkMode: () =>
    set((state) => ({
      isWalkMode: !state.isWalkMode,
      cameraMode: !state.isWalkMode ? 'walk' : 'orbit',
      isLookAround360: false,
      isAutoRotate: false,
    })),
  setWalkMode: (val) =>
    set({
      isWalkMode: val,
      cameraMode: val ? 'walk' : 'orbit',
      isLookAround360: false,
      isAutoRotate: false,
    }),
  setWalkSpeed: (val) => set({ walkSpeed: val }),
  enterRoom: () =>
    set((state) => ({
      activeCameraPreset: 'interior',
      cameraPresetVersion: state.cameraPresetVersion + 1,
      cameraFov: 70,
      cameraMode: 'interior',
      isWalkMode: false,
      isRoofHidden: false,
    })),

  resetConfiguration: (zones, isDemoProject = false) => {
    const defaults: Record<string, string> = {};
    zones.forEach((z) => {
      defaults[z.id] = (isDemoProject && z.defaultMaterialId && z.defaultMaterialId !== 'original')
        ? z.defaultMaterialId
        : 'original';
    });
    set({
      selectedMaterials: defaults,
      customColors: {},
      zoneTextureSettings: {},
      dynamicZones: [],
      floorEnabled: false,
      floorTextureUrl: null,
      floorPresetId: 'floor-carrara-marble',
      floorTileRepeat: 8,
      floorRoughness: 0.15,
      floorColor: '#ffffff',
      floorSizeScale: 1.15,
      floorElevation: 0.02,
      isRoofHidden: false,
      isFurnitureHidden: false,
      isEnvironmentHidden: false,
      hiddenFloors: [],
      cameraFov: 50,
      cameraMode: 'orbit',
      isCeilingCut: false,
      ceilingCutHeight: 2.70,
      isAutoRotate: false,
      isLookAround360: false,
    });
  },

  loadConfiguration: (materials, customColors = {}, floorConfig, textureSettings) =>
    set((state) => ({
      selectedMaterials: materials,
      customColors: customColors,
      zoneTextureSettings: textureSettings || state.zoneTextureSettings,
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
