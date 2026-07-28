/** TypeScript Types and Interfaces for Enterprise Knowledge Base (RAG) */

export interface DocumentMetadata {
  id: string;
  workspace_id?: string;
  project_id?: string;
  filename: string;
  file_type: string;
  file_size: number;
  version: string;
  language: string;
  author: string;
  created_at: string;
  updated_at: string;
  page_count: number;
  word_count: number;
  char_count: number;
  chunk_count: number;
  embedding_model: string;
  chunk_strategy: string;
  status: 'pending' | 'processing' | 'ready' | 'error';
  error_message?: string;
  tags: string[];
}

export interface PipelineStageLog {
  stage: number;
  name: string;
  detail: string;
  timestamp: string;
}

export interface IngestionResult {
  document: DocumentMetadata;
  pipeline_logs: PipelineStageLog[];
  status: string;
}

export interface SourceCitation {
  citation_id: number;
  chunk_id: string;
  document_name: string;
  page_number: number;
  chunk_number: number;
  similarity_percent: number;
  content_preview: string;
  full_content: string;
  metadata: Record<string, any>;
}

export interface RAGStepPayload {
  step: number;
  title: string;
  description: string;
  latency_ms?: number;
  chunks_retrieved?: number;
  context_snippet?: string;
  tokens_used?: number;
}

export interface LangSmithTraceMeta {
  trace_id: string;
  project: string;
  latency_ms: number;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  model_used: string;
  trace_url: string;
}

export interface ExecutionMetrics {
  total_latency_ms: number;
  embedding_latency_ms: number;
  retrieval_latency_ms: number;
  llm_latency_ms: number;
  tokens_used: number;
  chunks_count: number;
  answer_confidence?: number;
  source_documents?: string[];
  similarity_scores?: number[];
  scope?: string;
  model_used?: string;
  trace_id?: string;
}

export interface RAGQueryRequest {
  question: string;
  top_k: number;
  similarity_threshold: number;
  temperature: number;
  model: string;
  chunk_strategy: string;
  scope?: 'all' | 'current' | 'selected';
  document_ids?: string[];
  workspace_id?: string;
  project_id?: string;
}

export interface RAGQueryResponse {
  question: string;
  answer: string;
  citations: SourceCitation[];
  rag_steps: RAGStepPayload[];
  langsmith_trace: LangSmithTraceMeta;
  execution_metrics: ExecutionMetrics;
}
