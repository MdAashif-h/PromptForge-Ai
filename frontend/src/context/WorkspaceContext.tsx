import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Workspace, Project } from '@/types/workspace';
import { fetchWorkspaces, fetchProjects, createWorkspace, createProject } from '@/services/workspaceApi';

interface WorkspaceContextType {
  workspaces: Workspace[];
  projects: Project[];
  activeWorkspace: Workspace | null;
  activeProject: Project | null;
  setActiveWorkspace: (ws: Workspace) => void;
  setActiveProject: (proj: Project) => void;
  addWorkspace: (name: string, description?: string) => Promise<Workspace>;
  addProject: (name: string, description?: string) => Promise<Project>;
  loading: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

const SAVED_WS_KEY = 'pf_active_workspace_id';
const SAVED_PROJ_KEY = 'pf_active_project_id';

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeWorkspace, setActiveWorkspaceState] = useState<Workspace | null>(null);
  const [activeProject, setActiveProjectState] = useState<Project | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadHierarchy = async () => {
      setLoading(true);
      const wsList = await fetchWorkspaces();
      setWorkspaces(wsList);

      const savedWsId = localStorage.getItem(SAVED_WS_KEY);
      const selectedWs = wsList.find((w) => w.id === savedWsId) || wsList[0] || {
        id: 'ws_default',
        name: 'Enterprise Workspace',
        slug: 'enterprise-workspace',
        created_at: new Date().toISOString(),
      };
      setActiveWorkspaceState(selectedWs);

      const projList = await fetchProjects(selectedWs.id);
      setProjects(projList);

      const savedProjId = localStorage.getItem(SAVED_PROJ_KEY);
      const selectedProj = projList.find((p) => p.id === savedProjId) || projList[0] || {
        id: 'proj_default',
        workspace_id: selectedWs.id,
        name: 'Core Production Project',
        created_at: new Date().toISOString(),
      };
      setActiveProjectState(selectedProj);
      setLoading(false);
    };

    loadHierarchy();
  }, []);

  const setActiveWorkspace = async (ws: Workspace) => {
    setActiveWorkspaceState(ws);
    localStorage.setItem(SAVED_WS_KEY, ws.id);
    const projList = await fetchProjects(ws.id);
    setProjects(projList);
    if (projList.length > 0) {
      setActiveProjectState(projList[0]);
      localStorage.setItem(SAVED_PROJ_KEY, projList[0].id);
    }
  };

  const setActiveProject = (proj: Project) => {
    setActiveProjectState(proj);
    localStorage.setItem(SAVED_PROJ_KEY, proj.id);
  };

  const addWorkspace = async (name: string, description?: string): Promise<Workspace> => {
    const newWs = await createWorkspace(name, description);
    setWorkspaces((prev) => [...prev, newWs]);
    await setActiveWorkspace(newWs);
    return newWs;
  };

  const addProject = async (name: string, description?: string): Promise<Project> => {
    const wsId = activeWorkspace?.id || 'ws_default';
    const newProj = await createProject(wsId, name, description);
    setProjects((prev) => [...prev, newProj]);
    setActiveProject(newProj);
    return newProj;
  };

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        projects,
        activeWorkspace,
        activeProject,
        setActiveWorkspace,
        setActiveProject,
        addWorkspace,
        addProject,
        loading,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
