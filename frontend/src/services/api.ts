import axios from 'axios';
import type {
  OptimizeRequest,
  OptimizeResponse,
  ScoreRequest,
  ScoreResponse,
  ConvertRequest,
  ConvertResponse,
  TestRequest,
  TestResponse,
  SavedPrompt,
  HistoryEntry,
  SearchRequest,
} from '@/types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

// ============================================
// Prompt Studio Endpoints
// ============================================

export async function optimizePrompt(data: OptimizeRequest): Promise<OptimizeResponse> {
  const res = await api.post<OptimizeResponse>('/api/optimize', data);
  return res.data;
}

export async function scorePrompt(data: ScoreRequest): Promise<ScoreResponse> {
  const res = await api.post<ScoreResponse>('/api/score', data);
  return res.data;
}

export async function convertPrompt(data: ConvertRequest): Promise<ConvertResponse> {
  const res = await api.post<ConvertResponse>('/api/convert', data);
  return res.data;
}

export async function testPrompt(data: TestRequest): Promise<TestResponse> {
  const res = await api.post<TestResponse>('/api/test', data);
  return res.data;
}

// ============================================
// Library Endpoints
// ============================================

export async function savePrompt(data: { title: string; prompt_text: string; category: string }): Promise<SavedPrompt> {
  const res = await api.post<SavedPrompt>('/api/prompts', data);
  return res.data;
}

export async function getPrompts(params?: { category?: string; favorite?: boolean }): Promise<SavedPrompt[]> {
  const res = await api.get<SavedPrompt[]>('/api/prompts', { params });
  return res.data;
}

export async function deletePrompt(id: string): Promise<void> {
  await api.delete(`/api/prompts/${id}`);
}

export async function toggleFavorite(id: string): Promise<SavedPrompt> {
  const res = await api.patch<SavedPrompt>(`/api/prompts/${id}/favorite`);
  return res.data;
}

export async function searchPrompts(data: SearchRequest): Promise<SavedPrompt[]> {
  const res = await api.post<SavedPrompt[]>('/api/search', data);
  return res.data;
}

// ============================================
// History Endpoints
// ============================================

export async function getHistory(): Promise<HistoryEntry[]> {
  const res = await api.get<HistoryEntry[]>('/api/history');
  return res.data;
}

// ============================================
// Phase 3 Enterprise API Endpoints
// ============================================

export async function fetchPromptVersions(promptId: string): Promise<any[]> {
  const res = await api.get(`/api/prompts/${promptId}/versions`);
  return res.data.versions;
}

export async function createPromptVersion(promptId: string, data: { prompt_text: string; title?: string; change_notes?: string; tags?: string[] }): Promise<any> {
  const res = await api.post(`/api/prompts/${promptId}/versions`, data);
  return res.data;
}

export async function restorePromptVersion(promptId: string, versionNum: number): Promise<any> {
  const res = await api.post(`/api/prompts/${promptId}/versions/${versionNum}/restore`);
  return res.data;
}

export async function fetchPromptVersionDiff(promptId: string, versionA: number, versionB: number): Promise<any> {
  const res = await api.get(`/api/prompts/${promptId}/versions/diff`, { params: { version_a: versionA, version_b: versionB } });
  return res.data;
}

export async function sendHumanApproval(data: { run_id: string; decision: string; user_edits?: string; feedback_notes?: string }): Promise<any> {
  const res = await api.post('/api/agents/human-approval', data);
  return res.data;
}

export async function fetchApprovalHistory(): Promise<any[]> {
  const res = await api.get('/api/agents/approval-history');
  return res.data.approval_history;
}

export async function fetchEvaluations(): Promise<any[]> {
  const res = await api.get('/api/evaluations');
  return res.data.evaluations;
}

export async function runRAGEvaluationSuite(data: { query: string; ground_truth?: string; scope?: string }): Promise<any> {
  const res = await api.post('/api/evaluations/run', data);
  return res.data;
}

export async function fetchTools(): Promise<any[]> {
  const res = await api.get('/api/tools');
  return res.data.tools;
}

export async function executeTool(tool_name: string, tool_args: Record<string, any>): Promise<any> {
  const res = await api.post('/api/tools/execute', { tool_name, tool_args });
  return res.data;
}

export async function fetchMCPIntegrations(): Promise<any[]> {
  const res = await api.get('/api/tools/mcp/integrations');
  return res.data.integrations;
}

export async function connectMCPServer(data: { name: string; server_url: string; auth_header?: string }): Promise<any> {
  const res = await api.post('/api/tools/mcp/connect', data);
  return res.data;
}

export default api;

