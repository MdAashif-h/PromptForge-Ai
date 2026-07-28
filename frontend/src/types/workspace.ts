export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string;
  created_at: string;
}

export interface Project {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  created_at: string;
}
