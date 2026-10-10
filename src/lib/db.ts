import fs from 'fs';
import path from 'path';
import { Project, ProjectConfiguration, User } from '@/types';
import { DEMO_PROJECTS } from './demo-project';

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

function readProjects(): Project[] {
  ensureDataDir();
  try {
    const raw = fs.readFileSync(PROJECTS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      cachedProjects = parsed;
      return parsed;
    }
  } catch (err) {
    console.error('Failed to read projects database:', err);
  }
  return DEMO_PROJECTS;
}

function writeProjects(projects: Project[]) {
  ensureDataDir();
  cachedProjects = projects;
  try {
    // Atomic write to prevent corruption
    const tempFile = `${PROJECTS_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(projects, null, 2), 'utf-8');
    fs.renameSync(tempFile, PROJECTS_FILE);
  } catch (err) {
    console.error('Failed to write projects database:', err);
    throw err;
  }
}

function readConfigs(): ProjectConfiguration[] {
  ensureDataDir();
  try {
    const raw = fs.readFileSync(CONFIGS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      cachedConfigs = parsed;
      return parsed;
    }
  } catch (err) {
    console.error('Failed to read configs database:', err);
  }
  return [];
}

function writeConfigs(configs: ProjectConfiguration[]) {
  ensureDataDir();
  cachedConfigs = configs;
  try {
    const tempFile = `${CONFIGS_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(configs, null, 2), 'utf-8');
    fs.renameSync(tempFile, CONFIGS_FILE);
  } catch (err) {
    console.error('Failed to write configs database:', err);
    throw err;
  }
}

function readUsers(): User[] {
  ensureDataDir();
  try {
    const raw = fs.readFileSync(USERS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.error('Failed to read users database:', err);
  }
  return [DEFAULT_DEMO_USER];
}

function writeUsers(users: User[]) {
  ensureDataDir();
  try {
    const tempFile = `${USERS_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(users, null, 2), 'utf-8');
    fs.renameSync(tempFile, USERS_FILE);
  } catch (err) {
    console.error('Failed to write users database:', err);
    throw err;
  }
}

export const db = {
  async getAllProjects(): Promise<Project[]> {
    return readProjects();
  },

  async getProjectsByUser(userId?: string): Promise<Project[]> {
    const projects = readProjects();
    if (!userId) {
      return projects.filter((p) => p.isPublic || p.id === 'house-001' || p.id === 'studio-002');
    }
    // Admin sees all projects (including all uploaded models)
    if (userId === 'usr-admin-lead' || userId === 'admin') {
      return projects;
    }
    // Regular user only sees their own uploaded models + public showcase models
    return projects.filter(
      (p) => p.userId === userId || p.isPublic || p.id === 'house-001' || p.id === 'studio-002'
    );
  },

  async getProjectById(id: string): Promise<Project | null> {
    const projects = readProjects();
    const project = projects.find((p) => p.id === id);
    return project || null;
  },

  async createProject(project: Project): Promise<Project> {
    const projects = readProjects();
    const updated = [project, ...projects.filter((p) => p.id !== project.id)];
    writeProjects(updated);
    return project;
  },

  async updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
    const projects = readProjects();
    const index = projects.findIndex((p) => p.id === id);
    if (index === -1) return null;

    const updatedProject: Project = {
      ...projects[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    projects[index] = updatedProject;
    writeProjects(projects);
    return updatedProject;
  },

  async deleteProject(id: string): Promise<boolean> {
    const projects = readProjects();
    const target = projects.find((p) => p.id === id);
    if (!target) return false;

    // 1. Remove physical files from disk if located in /uploads/
    try {
      if (target.modelUrl && target.modelUrl.startsWith('/uploads/')) {
        const glbPath = path.join(process.cwd(), 'public', target.modelUrl.replace(/^\//, ''));
        if (fs.existsSync(glbPath)) {
          fs.unlinkSync(glbPath);
          console.log(`[DB] Permanently deleted GLB asset: ${glbPath}`);
        }

        // Also delete associated SketchUp file if uploaded
        const skpPath = glbPath.replace(/\.glb$/i, '.skp');
        if (fs.existsSync(skpPath)) {
          fs.unlinkSync(skpPath);
          console.log(`[DB] Permanently deleted SKP source asset: ${skpPath}`);
        }
      }

      if (target.thumbnailUrl && target.thumbnailUrl.startsWith('/uploads/')) {
        const thumbPath = path.join(process.cwd(), 'public', target.thumbnailUrl.replace(/^\//, ''));
        if (fs.existsSync(thumbPath)) {
          fs.unlinkSync(thumbPath);
          console.log(`[DB] Permanently deleted thumbnail asset: ${thumbPath}`);
        }
      }
    } catch (fileErr) {
      console.warn(`[DB] Warning: Non-fatal error deleting physical files for project ${id}:`, fileErr);
    }

    // 2. Remove associated configurations from configurations.json
    try {
      const configs = readConfigs();
      const updatedConfigs = configs.filter((c) => c.projectId !== id);
      if (updatedConfigs.length !== configs.length) {
        writeConfigs(updatedConfigs);
      }
    } catch (cfgErr) {
      console.warn(`[DB] Warning: Error cleaning configs for project ${id}:`, cfgErr);
    }

    // 3. Remove project from projects.json permanently
    const filtered = projects.filter((p) => p.id !== id);
    writeProjects(filtered);
    return true;
  },

  async saveConfiguration(config: ProjectConfiguration): Promise<ProjectConfiguration> {
    const configs = readConfigs();
    const updated = [config, ...configs];
    writeConfigs(updated);

    // Increment project savedConfigsCount
    const projects = readProjects();
    const projIndex = projects.findIndex((p) => p.id === config.projectId);
    if (projIndex !== -1) {
      projects[projIndex].savedConfigsCount = (projects[projIndex].savedConfigsCount || 0) + 1;
      writeProjects(projects);
    }

    return config;
  },

  async getConfigurations(projectId: string): Promise<ProjectConfiguration[]> {
    const configs = readConfigs();
    return configs.filter((c) => c.projectId === projectId);
  },

  // --- USER AUTH MANAGEMENT ---
  async getAllUsers(): Promise<User[]> {
    return readUsers();
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
    const users = readUsers();
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
    const users = readUsers();
    const found = users.find((u) => u.id === id);
    return found || null;
  },

  async createUser(userData: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const users = readUsers();
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

    writeUsers([newUser, ...users]);
    return newUser;
  },
};
