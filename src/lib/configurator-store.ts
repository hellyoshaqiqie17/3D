import { create } from 'zustand';
import { MaterialCategory, MaterialZone } from '@/types';

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
  resetConfiguration: (zones: MaterialZone[]) => void;
  loadConfiguration: (materials: Record<string, string>, customColors?: Record<string, string>) => void;
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

  isSaveModalOpen: false,
  isShareModalOpen: false,

  selectZone: (zoneId) => set({ selectedZoneId: zoneId }),
  setActiveCategory: (category) => set({ activeCategory: category }),

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
    });
  },

  loadConfiguration: (materials, customColors = {}) =>
    set({
      selectedMaterials: materials,
      customColors: customColors,
    }),
}));
