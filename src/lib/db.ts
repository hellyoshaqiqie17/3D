import fs from 'fs';
import path from 'path';
import { Project, ProjectConfiguration, User } from '@/types';
import { DEMO_PROJECTS } from './demo-project';
import { bunnyStorage } from './bunny-storage';

const isVercel = Boolean(process.env.VERCEL);
const DATA_DIR =
  process.env.DATA_DIR ||
  (isVercel ? path.join('/tmp', 'data') : path.join(process.cwd(), 'data'));
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
const CONFIGS_FILE = path.join(DATA_DIR, 'configurations.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

export const ADMIN_USER: User = {
  id: 'usr-admin-lead',
  username: 'admin',
  name: 'Super Admin Architect',
  email: 'admin@homecraft3d.com',
  studioName: 'HomeCraft 3D Studio',
  role: 'Administrator & Principal Architect',
  avatar: 'AD',
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
    const bundledProjects = path.join(process.cwd(), 'data', 'projects.json');
    if (fs.existsSync(bundledProjects)) {
      try {
        fs.copyFileSync(bundledProjects, PROJECTS_FILE);
      } catch {
        fs.writeFileSync(PROJECTS_FILE, JSON.stringify(DEMO_PROJECTS, null, 2), 'utf-8');
      }
    } else {
      fs.writeFileSync(PROJECTS_FILE, JSON.stringify(DEMO_PROJECTS, null, 2), 'utf-8');
    }
  }

  if (!fs.existsSync(CONFIGS_FILE)) {
    const bundledConfigs = path.join(process.cwd(), 'data', 'configurations.json');
    if (fs.existsSync(bundledConfigs)) {
      try {
        fs.copyFileSync(bundledConfigs, CONFIGS_FILE);
      } catch {
        fs.writeFileSync(CONFIGS_FILE, JSON.stringify([], null, 2), 'utf-8');
      }
    } else {
      fs.writeFileSync(CONFIGS_FILE, JSON.stringify([], null, 2), 'utf-8');
    }
  }

  if (!fs.existsSync(USERS_FILE)) {
    const bundledUsers = path.join(process.cwd(), 'data', 'users.json');
    if (fs.existsSync(bundledUsers)) {
      try {
        fs.copyFileSync(bundledUsers, USERS_FILE);
      } catch {
        fs.writeFileSync(USERS_FILE, JSON.stringify([ADMIN_USER, DEFAULT_DEMO_USER, GOOGLE_DEMO_USER], null, 2), 'utf-8');
      }
    } else {
      fs.writeFileSync(USERS_FILE, JSON.stringify([ADMIN_USER, DEFAULT_DEMO_USER, GOOGLE_DEMO_USER], null, 2), 'utf-8');
    }
  }
}

// In-memory cache for fast lookups
let cachedProjects: Project[] | null = null;
let cachedConfigs: ProjectConfiguration[] | null = null;
let cachedUsers: User[] | null = null;

async function readProjects(): Promise<Project[]> {
  if (cachedProjects !== null) {
    return cachedProjects;
  }

  // 1. Try fetching from Bunny Storage Cloud
  try {
    const cloudProjects = await bunnyStorage.readJson<Project[]>('data/projects.json');
    if (cloudProjects !== null && Array.isArray(cloudProjects)) {
      cachedProjects = cloudProjects;
      try {
        ensureDataDir();
        fs.writeFileSync(PROJECTS_FILE, JSON.stringify(cloudProjects, null, 2), 'utf-8');
      } catch {}
      return cloudProjects;
    }
  } catch (err) {
    console.warn('[DB] Failed reading projects from Bunny Storage:', err);
  }

  // 2. Fallback to local disk file
  ensureDataDir();
  try {
    if (fs.existsSync(PROJECTS_FILE)) {
      const raw = fs.readFileSync(PROJECTS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        cachedProjects = parsed;
        bunnyStorage.writeJson('data/projects.json', parsed).catch(() => {});
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to read projects database:', err);
  }

  // 3. Fallback to bundled DEMO_PROJECTS
  cachedProjects = DEMO_PROJECTS;
  bunnyStorage.writeJson('data/projects.json', DEMO_PROJECTS).catch(() => {});
  return DEMO_PROJECTS;
}

async function writeProjects(projects: Project[]): Promise<void> {
  cachedProjects = projects;
  try {
    ensureDataDir();
    const tempFile = `${PROJECTS_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(projects, null, 2), 'utf-8');
    fs.renameSync(tempFile, PROJECTS_FILE);
  } catch {}

  try {
    await bunnyStorage.writeJson('data/projects.json', projects);
  } catch (err) {
    console.error('[DB] Failed persisting projects to Bunny Storage:', err);
  }
}

async function readConfigs(): Promise<ProjectConfiguration[]> {
  if (cachedConfigs !== null) return cachedConfigs;

  try {
    const cloudConfigs = await bunnyStorage.readJson<ProjectConfiguration[]>('data/configurations.json');
    if (cloudConfigs !== null && Array.isArray(cloudConfigs)) {
      cachedConfigs = cloudConfigs;
      try {
        ensureDataDir();
        fs.writeFileSync(CONFIGS_FILE, JSON.stringify(cloudConfigs, null, 2), 'utf-8');
      } catch {}
      return cloudConfigs;
    }
  } catch {}

  ensureDataDir();
  try {
    if (fs.existsSync(CONFIGS_FILE)) {
      const raw = fs.readFileSync(CONFIGS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        cachedConfigs = parsed;
        bunnyStorage.writeJson('data/configurations.json', parsed).catch(() => {});
        return parsed;
      }
    }
  } catch (err) {}

  return [];
}

async function writeConfigs(configs: ProjectConfiguration[]): Promise<void> {
  cachedConfigs = configs;
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
  if (cachedUsers !== null) return cachedUsers;

  try {
    const cloudUsers = await bunnyStorage.readJson<User[]>('data/users.json');
    if (cloudUsers !== null && Array.isArray(cloudUsers) && cloudUsers.length > 0) {
      cachedUsers = cloudUsers;
      return cloudUsers;
    }
  } catch {}

  ensureDataDir();
  try {
    if (fs.existsSync(USERS_FILE)) {
      const raw = fs.readFileSync(USERS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        cachedUsers = parsed;
        bunnyStorage.writeJson('data/users.json', parsed).catch(() => {});
        return parsed;
      }
    }
  } catch (err) {}

  const defaults = [ADMIN_USER, DEFAULT_DEMO_USER, GOOGLE_DEMO_USER];
  cachedUsers = defaults;
  bunnyStorage.writeJson('data/users.json', defaults).catch(() => {});
  return defaults;
}

async function writeUsers(users: User[]): Promise<void> {
  cachedUsers = users;
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
        if (target.modelUrl) {
          const match = target.modelUrl.match(/\/api\/storage\/(.+)$/) || target.modelUrl.match(/^\/uploads\/(.+)$/);
          if (match) {
            const cleanPath = match[1].startsWith('uploads/') ? match[1] : `uploads/${match[1]}`;
            await bunnyStorage.delete(cleanPath);
            console.log(`[DB] Deleted Bunny Storage model asset: ${cleanPath}`);
          }
        }

        if (target.thumbnailUrl) {
          const match = target.thumbnailUrl.match(/\/api\/storage\/(.+)$/) || target.thumbnailUrl.match(/^\/uploads\/(.+)$/);
          if (match) {
            const cleanPath = match[1].startsWith('uploads/') ? match[1] : `uploads/${match[1]}`;
            await bunnyStorage.delete(cleanPath);
            console.log(`[DB] Deleted Bunny Storage thumb asset: ${cleanPath}`);
          }
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
};
