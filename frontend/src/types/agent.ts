export type NodeStatus = 'idle' | 'running' | 'completed' | 'error';

export interface AgentStepResult {
  agent_name: string;
  status: NodeStatus;
  start_time: string;
  finish_time?: string;
  duration_ms: number;
  latency_ms: number;
  tokens_used: number;
  model_used: string;
  confidence: number;
  output: Record<string, any>;
  error?: string;
}

export interface AgentRunHistory {
  id: string;
  user_query: string;
  timestamp: string;
  total_latency_ms: number;
  overall_confidence: number;
  total_tokens: number;
  langsmith_trace_id: string;
}

export interface AgentExecuteRequest {
  user_query: string;
  workspace_id?: string;
  project_id?: string;
  scope?: 'all' | 'current' | 'selected';
  document_ids?: string[];
}
