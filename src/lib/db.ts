import fs from 'fs';
import path from 'path';
import { Project, ProjectConfiguration } from '@/types';
import { DEMO_PROJECTS } from './demo-project';

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
const CONFIGS_FILE = path.join(DATA_DIR, 'configurations.json');

// Ensure data directory exists
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(PROJECTS_FILE)) {
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify(DEMO_PROJECTS, null, 2), 'utf-8');
  }

  if (!fs.existsSync(CONFIGS_FILE)) {
    fs.writeFileSync(CONFIGS_FILE, JSON.stringify([], null, 2), 'utf-8');
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

export const db = {
  async getAllProjects(): Promise<Project[]> {
    return readProjects();
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
    const initialLen = projects.length;
    const filtered = projects.filter((p) => p.id !== id);
    if (filtered.length === initialLen) return false;

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
};
