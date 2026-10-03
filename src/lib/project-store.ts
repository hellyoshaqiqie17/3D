import { create } from 'zustand';
import { Project, MaterialZone } from '@/types';
import { DEMO_PROJECTS } from './demo-project';

interface ProjectStoreState {
  projects: Project[];
  activeProjectId: string | null;
  isLoading: boolean;
  fetchProjects: () => Promise<void>;
  addProject: (project: Project) => Promise<void>;
  updateProjectZones: (projectId: string, zones: MaterialZone[]) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  getProject: (id: string) => Project | undefined;
  updateProjectThumbnail: (projectId: string, thumbnailUrl: string) => void;
}

const STORAGE_KEY = 'homecraft_projects_v2';

function sanitizeProject(p: Project): Project {
  if (p.thumbnailUrl === '/models/villa-thumb.jpg') {
    return { ...p, thumbnailUrl: '/models/villa-thumb.png' };
  }
  if (p.thumbnailUrl === '/models/studio-thumb.jpg') {
    return { ...p, thumbnailUrl: '/models/studio-thumb.png' };
  }
  return p;
}

function getInitialProjects(): Project[] {
  if (typeof window === 'undefined') {
    return DEMO_PROJECTS;
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('homecraft_projects_v1');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(sanitizeProject);
      }
    }
  } catch (err) {
    console.error('Error loading projects from local storage:', err);
  }
  return DEMO_PROJECTS;
}

function saveLocalCache(projects: Project[]) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    } catch (err) {
      console.error('Error caching projects locally:', err);
    }
  }
}

export const useProjectStore = create<ProjectStoreState>((set, get) => ({
  projects: getInitialProjects(),
  activeProjectId: 'house-001',
  isLoading: false,

  fetchProjects: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          set({ projects: data, isLoading: false });
          saveLocalCache(data);
          return;
        }
      }
    } catch (err) {
      console.warn('Could not sync projects from server, using local cache:', err);
    }
    set({ isLoading: false });
  },

  addProject: async (project) => {
    // Optimistic UI update
    set((state) => {
      const updated = [project, ...state.projects.filter((p) => p.id !== project.id)];
      saveLocalCache(updated);
      return { projects: updated };
    });

    try {
      await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project),
      });
    } catch (err) {
      console.error('Failed to sync added project to database:', err);
    }
  },

  updateProjectZones: async (projectId, zones) => {
    set((state) => {
      const updated = state.projects.map((p) =>
        p.id === projectId
          ? {
              ...p,
              zones,
              updatedAt: new Date().toISOString(),
            }
          : p
      );
      saveLocalCache(updated);
      return { projects: updated };
    });

    try {
      await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zones }),
      });
    } catch (err) {
      console.error('Failed to sync updated zones to database:', err);
    }
  },

  deleteProject: async (id) => {
    set((state) => {
      const updated = state.projects.filter((p) => p.id !== id);
      saveLocalCache(updated);
      return { projects: updated };
    });

    try {
      await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Failed to delete project on server database:', err);
    }
  },

  getProject: (id) => {
    return get().projects.find((p) => p.id === id) || DEMO_PROJECTS.find((p) => p.id === id);
  },

  updateProjectThumbnail: (projectId, thumbnailUrl) => {
    set((state) => {
      const updated = state.projects.map((p) =>
        p.id === projectId
          ? { ...p, thumbnailUrl, updatedAt: new Date().toISOString() }
          : p
      );
      saveLocalCache(updated);
      return { projects: updated };
    });
  },
}));
