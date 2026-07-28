import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api/analytics';

export interface AnalyticsSummary {
  workspace_id: string;
  project_id: string;
  document_count: number;
  prompt_count: number;
  chroma_vector_count: number;
  agent_run_count: number;
  total_tokens_used: number;
  average_latency_ms: number;
  average_confidence_percent: number;
  langsmith_trace_count: number;
  cost_estimate_usd: number;
  prompt_success_rate: number;
  model_usage: { model: string; usage_percent: number; tokens: number }[];
  daily_activity: { day: string; runs: number; tokens: number }[];
}

export const fetchAnalyticsSummary = async (
  workspaceId: string = 'ws_default',
  projectId: string = 'proj_default'
): Promise<AnalyticsSummary> => {
  const response = await axios.get(
    `${API_BASE_URL}/summary?workspace_id=${workspaceId}&project_id=${projectId}`,
    { timeout: 3000 }
  );
  return response.data;
};
