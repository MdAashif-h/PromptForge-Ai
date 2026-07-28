import axios from 'axios';
import type {
  DocumentMetadata,
  IngestionResult,
  RAGQueryRequest,
  RAGQueryResponse,
} from '@/types/rag';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 120000, // 2 mins for large uploads
});

export async function uploadDocument(
  file: File,
  chunkStrategy: string = 'Recursive',
  chunkSize: number = 1000,
  chunkOverlap: number = 150,
  workspaceId: string = 'ws_default',
  projectId: string = 'proj_default'
): Promise<IngestionResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('chunk_strategy', chunkStrategy);
  formData.append('chunk_size', chunkSize.toString());
  formData.append('chunk_overlap', chunkOverlap.toString());
  formData.append('workspace_id', workspaceId);
  formData.append('project_id', projectId);

  const res = await api.post<IngestionResult>('/api/rag/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function listDocuments(workspaceId?: string, projectId?: string): Promise<DocumentMetadata[]> {
  const params = new URLSearchParams();
  if (workspaceId) params.append('workspace_id', workspaceId);
  if (projectId) params.append('project_id', projectId);
  
  const queryString = params.toString() ? `?${params.toString()}` : '';
  const res = await api.get<DocumentMetadata[]>(`/api/rag/documents${queryString}`);
  return res.data;
}

export async function deleteDocument(documentId: string): Promise<void> {
  await api.delete(`/api/rag/documents/${documentId}`);
}

export async function queryKnowledgeBase(data: RAGQueryRequest): Promise<RAGQueryResponse> {
  const res = await api.post<RAGQueryResponse>('/api/rag/query', data, {
    headers: { 'Content-Type': 'application/json' },
  });
  return res.data;
}
