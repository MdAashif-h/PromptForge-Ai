// ============================================
// Prompt & API Types
// ============================================

export interface OptimizeRequest {
  prompt: string;
}

export interface OptimizeResponse {
  optimized_prompt: string;
  explanation: string;
}

export interface ScoreRequest {
  prompt: string;
}

export interface ScoreCategories {
  clarity: number;
  specificity: number;
  context: number;
  output_format: number;
  constraints: number;
  examples: number;
  prompt_complexity: number;
  hallucination_risk: number;
}

export interface ScoreResponse {
  overall_score: number;
  categories: ScoreCategories;
  suggestions: string[];
}

export type PatternType =
  | 'zero_shot'
  | 'few_shot'
  | 'react'
  | 'chain_of_thought'
  | 'self_reflection'
  | 'role_based'
  | 'json_output';

export interface ConvertRequest {
  prompt: string;
  target_pattern: PatternType;
}

export interface ConvertResponse {
  converted_prompt: string;
  explanation: string;
  best_use_case: string;
}

export interface TestRequest {
  prompt: string;
  model?: string;
}

export interface TestResponse {
  response: string;
  tokens_used: number;
}

// ============================================
// Library Types
// ============================================

export interface SavedPrompt {
  id: string;
  title: string;
  prompt_text: string;
  category: string;
  is_favorite: boolean;
  created_at: string;
  tags?: string[];
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
}

export interface HistoryEntry {
  id: string;
  action_type: 'optimize' | 'score' | 'convert';
  prompt_text: string;
  result_summary: string;
  created_at: string;
}

export interface SearchRequest {
  query: string;
  top_n?: number;
}

// ============================================
// UI Types
// ============================================

export interface NavItem {
  label: string;
  path: string;
  icon: string;
}

export interface StatCard {
  label: string;
  value: string | number;
  change?: string;
  icon: string;
  color: string;
}

// ============================================
// Phase 3 Enterprise Types
// ============================================

export interface PromptVersion {
  id: string;
  prompt_id: string;
  version_number: number;
  title: string;
  prompt_text: string;
  system_prompt?: string;
  category: string;
  tags: string[];
  change_notes: string;
  branch_name: string;
  created_at: string;
  created_by: string;
}

export interface DiffVersionResponse {
  version_a: number;
  version_b: number;
  text_a: string;
  text_b: string;
  diff_html: string;
}

export interface HumanApprovalLog {
  id: string;
  run_id: string;
  prompt_id?: string;
  workspace_id?: string;
  decision: 'approved' | 'rejected' | 'regenerated' | 'edited' | 'skipped';
  user_edits?: string;
  feedback_notes?: string;
  timestamp: string;
}

export interface EvaluationReport {
  id: string;
  run_id: string;
  prompt_id: string;
  workspace_id?: string;
  faithfulness_score: number;
  context_precision: number;
  context_recall: number;
  answer_relevancy: number;
  citation_correctness: number;
  hallucination_score: number;
  retrieval_quality: number;
  confidence_score: number;
  metrics_breakdown: Record<string, number>;
  evaluator_reasoning: string;
  created_at: string;
}

export interface AgentMemoryItem {
  id: string;
  workspace_id: string;
  project_id: string;
  memory_type: string;
  key: string;
  value: any;
  relevance_score: number;
  created_at: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>;
  is_active: boolean;
}

export interface MCPIntegrationInfo {
  service_id: string;
  name: string;
  status: string;
  endpoint?: string;
  supported_actions: string[];
}
