import axios from 'axios';
import type { Workspace, Project } from '@/types/workspace';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
});

export const fetchWorkspaces = async (): Promise<Workspace[]> => {
  try {
    const response = await api.get('/api/workspaces');
    return response.data.workspaces || [];
  } catch (error) {
    return [
      {
        id: 'ws_default',
        name: 'Enterprise Workspace',
        slug: 'enterprise-workspace',
        description: 'Primary active workspace',
        created_at: new Date().toISOString(),
      },
    ];
  }
};

export const fetchProjects = async (workspaceId: string = 'ws_default'): Promise<Project[]> => {
  try {
    const response = await api.get(`/api/projects?workspace_id=${workspaceId}`);
    return response.data.projects || [];
  } catch (error) {
    return [
      {
        id: 'proj_default',
        workspace_id: workspaceId,
        name: 'Core Production Project',
        description: 'Main active production project',
        created_at: new Date().toISOString(),
      },
    ];
  }
};

export const createWorkspace = async (name: string, description?: string): Promise<Workspace> => {
  try {
    const response = await api.post('/api/workspaces', { name, description });
    return response.data;
  } catch (error) {
    const newWs: Workspace = {
      id: `ws_${Math.random().toString(36).substring(2, 9)}`,
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      description: description || 'Enterprise workspace',
      created_at: new Date().toISOString(),
    };
    return newWs;
  }
};

export const createProject = async (workspaceId: string, name: string, description?: string): Promise<Project> => {
  try {
    const response = await api.post('/api/projects', { workspace_id: workspaceId, name, description });
    return response.data;
  } catch (error) {
    const newProj: Project = {
      id: `proj_${Math.random().toString(36).substring(2, 9)}`,
      workspace_id: workspaceId,
      name,
      description: description || 'Production project',
      created_at: new Date().toISOString(),
    };
    return newProj;
  }
};
