import fs from 'fs';
import path from 'path';
import { Project, ProjectConfiguration, User, MaterialOption } from '@/types';
import { bunnyStorage } from './bunny-storage';

const isVercel = Boolean(process.env.VERCEL);
const DATA_DIR =
  process.env.DATA_DIR ||
  (isVercel ? path.join('/tmp', 'data') : path.join(process.cwd(), 'data'));
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
const CONFIGS_FILE = path.join(DATA_DIR, 'configurations.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const MATERIALS_FILE = path.join(DATA_DIR, 'materials.json');
const LIBRARY_FILES_FILE = path.join(DATA_DIR, 'library_files.json');

export interface LibraryFileRecord {
  id: string;
  userId: string;
  name: string;
  filename: string;
  storagePath: string;
  size: number;
  sizeMB: string;
  updatedAt: string;
  isConverted: boolean;
  glbUrl?: string;
  publicUrl: string;
}

export const DEFAULT_CUSTOM_MATERIALS: MaterialOption[] = [];

export const ADMIN_USER: User = {
  id: 'usr-admin-lead',
  username: 'admin',
  name: 'Super Admin Architect',
  email: 'admin@mitramegahinterior.com',
  studioName: 'Mitra Megah Interior',
  role: 'Administrator & Principal Architect',
  avatar: 'MM',
  createdAt: '2026-01-01T00:00:00Z',
};

export const GOOGLE_DEMO_USER: User = {
  id: 'usr-google-arch',
  username: 'google-architect',
  name: 'Studio Architect (Google)',
  email: 'architect.studio@gmail.com',
  studioName: 'Atelier Google Workspace',
  role: 'Senior Spatial Architect',
  avatar: 'G',
  createdAt: '2026-01-02T00:00:00Z',
};

export const DEFAULT_DEMO_USER: User = {
  id: 'usr-demo-lead',
  username: 'demo',
  name: 'Marcus Kōzō',
  email: 'lead.architect@atelier3d.com',
  studioName: 'Kōzō Architecture Studio',
  role: 'Lead Architect & Director',
  avatar: 'MK',
  createdAt: '2026-01-15T08:00:00Z',
};

// Ensure data directory exists
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch (e) {
      console.warn('Could not create DATA_DIR:', e);
    }
  }

  if (!fs.existsSync(PROJECTS_FILE)) {
    try {
      fs.writeFileSync(PROJECTS_FILE, JSON.stringify([], null, 2), 'utf-8');
    } catch {}
  }

  if (!fs.existsSync(CONFIGS_FILE)) {
    try {
      fs.writeFileSync(CONFIGS_FILE, JSON.stringify([], null, 2), 'utf-8');
    } catch {}
  }

  if (!fs.existsSync(USERS_FILE)) {
    try {
      fs.writeFileSync(USERS_FILE, JSON.stringify([ADMIN_USER, DEFAULT_DEMO_USER, GOOGLE_DEMO_USER], null, 2), 'utf-8');
    } catch {}
  }

  if (!fs.existsSync(MATERIALS_FILE)) {
    try {
      fs.writeFileSync(MATERIALS_FILE, JSON.stringify(DEFAULT_CUSTOM_MATERIALS, null, 2), 'utf-8');
    } catch {}
  }
}

export function extractBunnyStoragePath(urlOrPath?: string): string | null {
  if (!urlOrPath) return null;
  const clean = urlOrPath.split('?')[0].split('#')[0];
  const match = clean.match(/(?:uploads\/[a-zA-Z0-9_\-\.\/]+)/);
  if (match) {
    return match[0];
  }
  return null;
}

// Single Source of Truth: Bunny Storage Cloud with local disk fallback (Serverless safe, no stale cross-instance memory cache)
async function readProjects(): Promise<Project[]> {
  // 1. Always fetch fresh from Bunny Storage Cloud
  try {
    const cloudProjects = await bunnyStorage.readJson<Project[]>('data/projects.json');
    if (cloudProjects !== null && Array.isArray(cloudProjects)) {
      try {
        ensureDataDir();
        fs.writeFileSync(PROJECTS_FILE, JSON.stringify(cloudProjects, null, 2), 'utf-8');
      } catch {}
      return cloudProjects;
    }
  } catch (err) {
    console.warn('[DB] Failed reading projects from Bunny Storage:', err);
  }

  // 2. Fallback to local disk file if cloud temporarily unreachable
  ensureDataDir();
  try {
    if (fs.existsSync(PROJECTS_FILE)) {
      const raw = fs.readFileSync(PROJECTS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to read projects database:', err);
  }

  return [];
}

async function writeProjects(projects: Project[]): Promise<void> {
  // 1. Write to local disk cache
  try {
    ensureDataDir();
    const tempFile = `${PROJECTS_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(projects, null, 2), 'utf-8');
    fs.renameSync(tempFile, PROJECTS_FILE);
  } catch {}

  // 2. Persist immediately to Bunny Storage Cloud
  try {
    await bunnyStorage.writeJson('data/projects.json', projects);
  } catch (err) {
    console.error('[DB] Failed persisting projects to Bunny Storage:', err);
  }
}

async function readConfigs(): Promise<ProjectConfiguration[]> {
  try {
    const cloudConfigs = await bunnyStorage.readJson<ProjectConfiguration[]>('data/configurations.json');
    if (cloudConfigs !== null && Array.isArray(cloudConfigs)) {
      try {
        ensureDataDir();
        fs.writeFileSync(CONFIGS_FILE, JSON.stringify(cloudConfigs, null, 2), 'utf-8');
      } catch {}
      return cloudConfigs;
    }
  } catch (err) {
    console.warn('[DB] Failed reading configs from Bunny Storage:', err);
  }

  ensureDataDir();
  try {
    if (fs.existsSync(CONFIGS_FILE)) {
      const raw = fs.readFileSync(CONFIGS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {}

  return [];
}

async function writeConfigs(configs: ProjectConfiguration[]): Promise<void> {
  try {
    ensureDataDir();
    const tempFile = `${CONFIGS_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(configs, null, 2), 'utf-8');
    fs.renameSync(tempFile, CONFIGS_FILE);
  } catch {}

  try {
    await bunnyStorage.writeJson('data/configurations.json', configs);
  } catch (err) {
    console.error('[DB] Failed persisting configs to Bunny Storage:', err);
  }
}

async function readUsers(): Promise<User[]> {
  try {
    const cloudUsers = await bunnyStorage.readJson<User[]>('data/users.json');
    if (cloudUsers !== null && Array.isArray(cloudUsers) && cloudUsers.length > 0) {
      try {
        ensureDataDir();
        fs.writeFileSync(USERS_FILE, JSON.stringify(cloudUsers, null, 2), 'utf-8');
      } catch {}
      return cloudUsers;
    }
  } catch (err) {
    console.warn('[DB] Failed reading users from Bunny Storage:', err);
  }

  ensureDataDir();
  try {
    if (fs.existsSync(USERS_FILE)) {
      const raw = fs.readFileSync(USERS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {}

  const defaults = [ADMIN_USER, DEFAULT_DEMO_USER, GOOGLE_DEMO_USER];
  bunnyStorage.writeJson('data/users.json', defaults).catch(() => {});
  return defaults;
}

async function writeUsers(users: User[]): Promise<void> {
  try {
    ensureDataDir();
    const tempFile = `${USERS_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(users, null, 2), 'utf-8');
    fs.renameSync(tempFile, USERS_FILE);
  } catch {}

  try {
    await bunnyStorage.writeJson('data/users.json', users);
  } catch (err) {
    console.error('[DB] Failed persisting users to Bunny Storage:', err);
  }
}

async function readMaterials(): Promise<MaterialOption[]> {
  try {
    const cloudMaterials = await bunnyStorage.readJson<MaterialOption[]>('data/materials.json');
    if (cloudMaterials !== null && Array.isArray(cloudMaterials) && cloudMaterials.length > 0) {
      try {
        ensureDataDir();
        fs.writeFileSync(MATERIALS_FILE, JSON.stringify(cloudMaterials, null, 2), 'utf-8');
      } catch {}
      return cloudMaterials;
    }
  } catch (err) {
    console.warn('[DB] Failed reading materials from Bunny Storage:', err);
  }

  ensureDataDir();
  try {
    if (fs.existsSync(MATERIALS_FILE)) {
      const raw = fs.readFileSync(MATERIALS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {}

  return DEFAULT_CUSTOM_MATERIALS;
}

async function writeMaterials(materials: MaterialOption[]): Promise<void> {
  try {
    ensureDataDir();
    const tempFile = `${MATERIALS_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(materials, null, 2), 'utf-8');
    fs.renameSync(tempFile, MATERIALS_FILE);
  } catch {}

  try {
    await bunnyStorage.writeJson('data/materials.json', materials);
  } catch (err) {
    console.error('[DB] Failed persisting materials to Bunny Storage:', err);
  }
}

export const db = {
  async getAllProjects(): Promise<Project[]> {
    return await readProjects();
  },

  async getProjectsByUser(userId?: string): Promise<Project[]> {
    const projects = await readProjects();
    if (!userId) {
      return projects.filter((p) => p.isPublic);
    }
    // Admin sees all projects (including all uploaded models)
    if (userId === 'usr-admin-lead' || userId === 'admin') {
      return projects;
    }
    // Regular user only sees their own uploaded models + public showcase models
    return projects.filter(
      (p) => p.userId === userId || p.isPublic
    );
  },

  async getProjectById(id: string): Promise<Project | null> {
    const projects = await readProjects();
    const project = projects.find((p) => p.id === id);
    return project || null;
  },

  async createProject(project: Project): Promise<Project> {
    const projects = await readProjects();
    const updated = [project, ...projects.filter((p) => p.id !== project.id)];
    await writeProjects(updated);
    return project;
  },

  async updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
    const projects = await readProjects();
    const index = projects.findIndex((p) => p.id === id);
    if (index === -1) return null;

    const updatedProject: Project = {
      ...projects[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    projects[index] = updatedProject;
    await writeProjects(projects);
    return updatedProject;
  },

  async deleteProject(id: string): Promise<boolean> {
    const projects = await readProjects();
    const target = projects.find((p) => p.id === id);

    // 1. Remove physical files from Bunny Storage or disk
    if (target) {
      try {
        const pathsToDelete = new Set<string>();

        const modelPath = extractBunnyStoragePath(target.modelUrl);
        if (modelPath) pathsToDelete.add(modelPath);

        const thumbPath = extractBunnyStoragePath(target.thumbnailUrl);
        if (thumbPath) pathsToDelete.add(thumbPath);

        const skpUrl =
          (target as any).skpUrl ||
          (target as any).skpOriginalUrl ||
          (target as any).metadata?.skpOriginalUrl;
        const skpPath = extractBunnyStoragePath(skpUrl);
        if (skpPath) pathsToDelete.add(skpPath);

        if (modelPath && modelPath.endsWith('.glb')) {
          const base = modelPath.slice(0, -4);
          pathsToDelete.add(`${base}.skp`);
          pathsToDelete.add(`${base}_thumb.png`);
        }

        for (const cleanPath of pathsToDelete) {
          try {
            await bunnyStorage.delete(cleanPath);
            console.log(`[DB] Deleted Bunny Storage project asset: ${cleanPath}`);
          } catch (delErr) {
            console.warn(`[DB] Warning deleting cloud asset ${cleanPath}:`, delErr);
          }

          try {
            const localFile = path.join(process.cwd(), 'public', cleanPath);
            if (fs.existsSync(localFile)) {
              fs.unlinkSync(localFile);
            }
          } catch {}
        }
      } catch (fileErr) {
        console.warn(`[DB] Non-fatal error deleting cloud assets for project ${id}:`, fileErr);
      }
    }

    // 2. Remove associated configurations from configurations.json
    try {
      const allConfigs = await readConfigs();
      const updatedConfigs = allConfigs.filter((c) => c.projectId !== id);
      if (updatedConfigs.length !== allConfigs.length) {
        await writeConfigs(updatedConfigs);
      }
    } catch (cfgErr) {
      console.warn(`[DB] Warning: Error cleaning configs for project ${id}:`, cfgErr);
    }

    // 3. Remove project from projects.json permanently
    const filtered = projects.filter((p) => p.id !== id);
    await writeProjects(filtered);
    return true;
  },

  async saveConfiguration(config: ProjectConfiguration): Promise<ProjectConfiguration> {
    const configs = await readConfigs();
    const updated = [config, ...configs];
    await writeConfigs(updated);

    // Increment project savedConfigsCount
    const projects = await readProjects();
    const projIndex = projects.findIndex((p) => p.id === config.projectId);
    if (projIndex !== -1) {
      projects[projIndex].savedConfigsCount = (projects[projIndex].savedConfigsCount || 0) + 1;
      await writeProjects(projects);
    }

    return config;
  },

  async getConfigurations(projectId: string): Promise<ProjectConfiguration[]> {
    const configs = await readConfigs();
    return configs.filter((c) => c.projectId === projectId);
  },

  // --- USER AUTH MANAGEMENT ---
  async getAllUsers(): Promise<User[]> {
    return await readUsers();
  },

  async getUserByEmail(email: string): Promise<User | null> {
    const normalized = email.toLowerCase().trim();
    if (
      normalized === 'admin' ||
      normalized === 'admin@mitramegahinterior.com' ||
      normalized === 'admin@homecraft3d.com' ||
      normalized === 'admin@atelier3d.com'
    ) {
      return ADMIN_USER;
    }
    if (normalized === 'demo' || normalized === DEFAULT_DEMO_USER.email.toLowerCase()) {
      return DEFAULT_DEMO_USER;
    }
    if (normalized === GOOGLE_DEMO_USER.email.toLowerCase()) {
      return GOOGLE_DEMO_USER;
    }
    const users = await readUsers();
    const found = users.find((u) => u.email.toLowerCase().trim() === normalized);
    return found || null;
  },

  async getUserById(id: string): Promise<User | null> {
    if (id === 'usr-admin-lead' || id === 'admin') {
      return ADMIN_USER;
    }
    if (id === 'usr-demo-lead' || id === 'demo') {
      return DEFAULT_DEMO_USER;
    }
    if (id === 'usr-google-arch') {
      return GOOGLE_DEMO_USER;
    }
    const users = await readUsers();
    const found = users.find((u) => u.id === id);
    return found || null;
  },

  async createUser(userData: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const users = await readUsers();
    const initials = userData.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    const newUser: User = {
      ...userData,
      id: `usr-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      avatar: userData.avatar || initials || 'AR',
      createdAt: new Date().toISOString(),
    };

    await writeUsers([newUser, ...users]);
    return newUser;
  },

  async getCustomMaterials(): Promise<MaterialOption[]> {
    return await readMaterials();
  },

  async createCustomMaterial(material: MaterialOption): Promise<MaterialOption> {
    const materials = await readMaterials();
    const updated = [material, ...materials.filter((m) => m.id !== material.id)];
    await writeMaterials(updated);
    return material;
  },

  async createCustomMaterials(newMaterials: MaterialOption[]): Promise<MaterialOption[]> {
    const materials = await readMaterials();
    const newIds = new Set(newMaterials.map((m) => m.id));
    const updated = [...newMaterials, ...materials.filter((m) => !newIds.has(m.id))];
    await writeMaterials(updated);
    return newMaterials;
  },

  async deleteCustomMaterial(id: string): Promise<boolean> {
    const materials = await readMaterials();
    const target = materials.find((m) => m.id === id);
    if (target) {
      const pathsToDelete = new Set<string>();
      const texPath = extractBunnyStoragePath(target.textureUrl);
      if (texPath) pathsToDelete.add(texPath);
      const thumbPath = extractBunnyStoragePath(target.previewThumbnail);
      if (thumbPath) pathsToDelete.add(thumbPath);

      for (const cleanPath of pathsToDelete) {
        try {
          await bunnyStorage.delete(cleanPath);
          console.log(`[DB] Deleted Bunny Storage texture asset: ${cleanPath}`);
        } catch (delErr) {
          console.warn(`[DB] Warning deleting cloud texture ${cleanPath}:`, delErr);
        }

        try {
          const localFile = path.join(process.cwd(), 'public', cleanPath);
          if (fs.existsSync(localFile)) {
            fs.unlinkSync(localFile);
          }
        } catch {}
      }
    }
    const filtered = materials.filter((m) => m.id !== id);
    await writeMaterials(filtered);
    return true;
  },
};
