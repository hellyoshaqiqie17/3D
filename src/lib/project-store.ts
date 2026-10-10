import { create } from 'zustand';
import { Project, MaterialZone } from '@/types';
import { DEMO_PROJECTS } from './demo-project';

interface ProjectStoreState {
  projects: Project[];
  activeProjectId: string | null;
  isLoading: boolean;
  fetchProjects: (userId?: string) => Promise<void>;
  addProject: (project: Project) => Promise<void>;
  updateProjectZones: (projectId: string, zones: MaterialZone[]) => Promise<void>;
  deleteProject: (id: string, userId?: string) => Promise<void>;
  getProject: (id: string) => Project | undefined;
  updateProjectThumbnail: (projectId: string, thumbnailUrl: string) => void;
}

const STORAGE_PREFIX = 'homecraft_projects_usr_';
const DELETED_PROJECTS_KEY = 'homecraft_deleted_project_ids';

function getDeletedProjectIds(): Set<string> {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(DELETED_PROJECTS_KEY);
      if (raw) return new Set(JSON.parse(raw));
    } catch {}
  }
  return new Set();
}

function addDeletedProjectId(id: string) {
  if (typeof window !== 'undefined') {
    try {
      const set = getDeletedProjectIds();
      set.add(id);
      localStorage.setItem(DELETED_PROJECTS_KEY, JSON.stringify(Array.from(set)));
    } catch {}
  }
}

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
  if (typeof window !== 'undefined') {
    try {
      let currentUserId = 'default';
      const authStored = localStorage.getItem('homecraft-auth-storage');
      if (authStored) {
        const parsedAuth = JSON.parse(authStored);
        if (parsedAuth?.state?.user?.id) {
          currentUserId = parsedAuth.state.user.id;
        }
      }

      const key = `${STORAGE_PREFIX}${currentUserId}`;
      const cached = localStorage.getItem(key);
      const deletedIds = getDeletedProjectIds();
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          return parsed
            .filter((p: Project) => !deletedIds.has(p.id))
            .map(sanitizeProject);
        }
      }
    } catch (e) {
      console.warn('Failed reading cached projects:', e);
    }
  }
  return [];
}

function saveLocalCache(projects: Project[], userId?: string) {
  if (typeof window !== 'undefined') {
    try {
      const key = `${STORAGE_PREFIX}${userId || 'default'}`;
      localStorage.setItem(key, JSON.stringify(projects));
    } catch (err) {
      console.error('Error caching projects locally:', err);
    }
  }
}

export const useProjectStore = create<ProjectStoreState>((set, get) => ({
  projects: getInitialProjects(),
  activeProjectId: 'house-001',
  isLoading: false,

  fetchProjects: async (userId?: string) => {
    set({ isLoading: true });
    try {
      let effectiveUserId = userId;
      if (!effectiveUserId && typeof window !== 'undefined') {
        try {
          const authStored = localStorage.getItem('homecraft-auth-storage');
          if (authStored) {
            const parsedAuth = JSON.parse(authStored);
            if (parsedAuth?.state?.user?.id) {
              effectiveUserId = parsedAuth.state.user.id;
            }
          }
        } catch {}
      }

      const url = effectiveUserId
        ? `/api/projects?userId=${encodeURIComponent(effectiveUserId)}`
        : '/api/projects';

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const deletedIds = getDeletedProjectIds();
          const filtered = data.filter((p: Project) => !deletedIds.has(p.id));
          set({ projects: filtered, isLoading: false });
          saveLocalCache(filtered, effectiveUserId);
          return;
        }
      }
    } catch (err) {
      console.warn('Could not sync projects from server:', err);
    }
    set({ isLoading: false });
  },

  addProject: async (project) => {
    set((state) => {
      const updated = [project, ...state.projects.filter((p) => p.id !== project.id)];
      saveLocalCache(updated, project.userId);
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

  deleteProject: async (id: string, userId?: string) => {
    addDeletedProjectId(id);
    set((state) => {
      const updated = state.projects.filter((p) => p.id !== id);
      saveLocalCache(updated, userId);
      return { projects: updated };
    });

    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        console.error('Failed to permanently delete project on server, status:', res.status);
      }
    } catch (err) {
      console.error('Failed to delete project on server database:', err);
    }
  },

  getProject: (id) => {
    const deletedIds = getDeletedProjectIds();
    if (deletedIds.has(id)) return undefined;
    return get().projects.find((p) => p.id === id) || DEMO_PROJECTS.find((p) => p.id === id);
  },

  updateProjectThumbnail: (projectId, thumbnailUrl) => {
    set((state) => {
      const updated = state.projects.map((p) =>
        p.id === projectId
          ? { ...p, thumbnailUrl, updatedAt: new Date().toISOString() }
          : p
      );
      return { projects: updated };
    });
  },
}));
