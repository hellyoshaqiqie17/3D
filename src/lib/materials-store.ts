import { create } from 'zustand';
import { MaterialOption, MaterialCategory } from '@/types';
import { MATERIAL_LIBRARY } from './materials';
import { useConfiguratorStore } from './configurator-store';

const STORAGE_KEY = 'homecraft_custom_pbr_materials';

interface MaterialsState {
  customMaterials: MaterialOption[];
  isLoading: boolean;
  error: string | null;
  fetchCustomMaterials: () => Promise<void>;
  addCustomMaterial: (material: MaterialOption) => Promise<MaterialOption | null>;
  deleteCustomMaterial: (id: string) => Promise<boolean>;
  getCombinedMaterialsByCategory: (category: MaterialCategory) => MaterialOption[];
}

function getInitialCustomMaterials(): MaterialOption[] {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
  }
  return [];
}

export const useMaterialsStore = create<MaterialsState>((set, get) => ({
  customMaterials: getInitialCustomMaterials(),
  isLoading: false,
  error: null,

  fetchCustomMaterials: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/materials');
      if (res.ok) {
        const data = await res.json();
        if (data.materials && Array.isArray(data.materials)) {
          set({ customMaterials: data.materials, isLoading: false });
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(data.materials));
            } catch {}
          }

          // Sync into configuratorStore uploadedMaterials
          if (typeof window !== 'undefined') {
            const currentUploaded = useConfiguratorStore.getState().uploadedMaterials;
            const merged = [...data.materials];
            for (const item of currentUploaded) {
              if (!merged.some((m) => m.id === item.id)) {
                merged.push(item);
              }
            }
            useConfiguratorStore.setState({ uploadedMaterials: merged });
          }
          return;
        }
      }
    } catch (err: any) {
      console.warn('[MaterialsStore] Failed fetching materials:', err);
    }
    set({ isLoading: false });
  },

  addCustomMaterial: async (material: MaterialOption) => {
    try {
      const res = await fetch('/api/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(material),
      });

      if (!res.ok) {
        throw new Error('Failed saving custom material to server');
      }

      const data = await res.json();
      const savedMat = data.material || material;

      set((state) => {
        const updated = [savedMat, ...state.customMaterials.filter((m) => m.id !== savedMat.id)];
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          } catch {}
        }
        return { customMaterials: updated };
      });

      // Sync into configuratorStore
      const currentUploaded = useConfiguratorStore.getState().uploadedMaterials;
      const updatedUploaded = [savedMat, ...currentUploaded.filter((m) => m.id !== savedMat.id)];
      useConfiguratorStore.setState({ uploadedMaterials: updatedUploaded });

      return savedMat;
    } catch (err: any) {
      console.error('[MaterialsStore] Add custom material error:', err);
      // Optimistic local update
      set((state) => {
        const updated = [material, ...state.customMaterials.filter((m) => m.id !== material.id)];
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          } catch {}
        }
        return { customMaterials: updated };
      });
      return material;
    }
  },

  deleteCustomMaterial: async (id: string) => {
    try {
      await fetch(`/api/materials?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.warn('[MaterialsStore] Warning calling delete API:', err);
    }

    set((state) => {
      const updated = state.customMaterials.filter((m) => m.id !== id);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch {}
      }
      return { customMaterials: updated };
    });

    // Also remove from configuratorStore
    const currentUploaded = useConfiguratorStore.getState().uploadedMaterials;
    useConfiguratorStore.setState({
      uploadedMaterials: currentUploaded.filter((m) => m.id !== id),
    });

    return true;
  },

  getCombinedMaterialsByCategory: (category: MaterialCategory) => {
    const custom = get().customMaterials.filter(
      (m) => m.category === category || m.isCustomUpload
    );
    const standard = MATERIAL_LIBRARY.filter((m) => m.category === category && m.id !== 'original');
    const seen = new Set<string>();
    const list: MaterialOption[] = [];
    for (const m of [...custom, ...standard]) {
      if (!seen.has(m.id)) {
        seen.add(m.id);
        list.push(m);
      }
    }
    return list;
  },
}));
