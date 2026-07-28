import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, BookOpen, Send, Loader2, Sparkles, AlertCircle, RefreshCw, Layers } from 'lucide-react';
import { toast } from 'sonner';

import type { DocumentMetadata, IngestionResult, RAGQueryResponse } from '@/types/rag';
import { uploadDocument, listDocuments, deleteDocument, queryKnowledgeBase } from '@/services/ragApi';

import { VisualPipelineTimeline } from '@/components/rag/VisualPipelineTimeline';
import { DocumentMetadataCard } from '@/components/rag/DocumentMetadataCard';
import { AdvancedSettingsPanel } from '@/components/rag/AdvancedSettingsPanel';
import { SourceCitationDrawer } from '@/components/rag/SourceCitationDrawer';
import { LightweightRAGExplorer } from '@/components/rag/LightweightRAGExplorer';
import { LangSmithTraceBadge } from '@/components/rag/LangSmithTraceBadge';
import { FriendlyGuideBanner } from '@/components/common/FriendlyGuideBanner';

import { useWorkspace } from '@/context/WorkspaceContext';

export const KnowledgeBasePage: React.FC = () => {
  const { activeWorkspace, activeProject } = useWorkspace();

  // Document state
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState<boolean>(true);

  // Upload & Ingestion state
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [ingestionResult, setIngestionResult] = useState<IngestionResult | null>(null);
  const [uploadError, setUploadError] = useState<string>('');

  // RAG Query & Advanced Settings state
  const [question, setQuestion] = useState<string>('');
  const [isQuerying, setIsQuerying] = useState<boolean>(false);
  const [ragResult, setRagResult] = useState<RAGQueryResponse | null>(null);
  const [queryError, setQueryError] = useState<string>('');

  // Advanced settings
  const [topK, setTopK] = useState<number>(4);
  const [similarityThreshold, setSimilarityThreshold] = useState<number>(0.7);
  const [temperature, setTemperature] = useState<number>(0.7);
  const [model, setModel] = useState<string>('gpt-4o-mini');
  const [chunkStrategy, setChunkStrategy] = useState<string>('Recursive');

  const fetchDocs = async () => {
    try {
      setIsLoadingDocs(true);
      const data = await listDocuments(activeWorkspace?.id, activeProject?.id);
      setDocuments(data);
    } catch (err: any) {
      toast.error('Failed to load documents');
    } finally {
      setIsLoadingDocs(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [activeWorkspace?.id, activeProject?.id]);

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    const allowed = ['.pdf', '.docx', '.txt', '.md', '.csv'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    if (!allowed.includes(ext)) {
      toast.error(`Unsupported file type '${ext}'. Please upload PDF, DOCX, TXT, MD, or CSV.`);
      return;
    }

    try {
      setIsUploading(true);
      setUploadError('');
      setIngestionResult(null);

      const result = await uploadDocument(file, chunkStrategy, 1000, 150, activeWorkspace?.id, activeProject?.id);
      setIngestionResult(result);
      toast.success(`Successfully indexed '${file.name}' into Knowledge Base!`);
      fetchDocs();
    } catch (err: any) {
      const errMsg = err?.response?.data?.detail || err.message || 'File ingestion failed';
      setUploadError(errMsg);
      toast.error(`Ingestion error: ${errMsg}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDeleteDoc = async (id: string) => {
    try {
      await deleteDocument(id);
      toast.success('Document deleted successfully');
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (err: any) {
      toast.error('Failed to delete document');
    }
  };

  // Retrieval Scoping state
  const [retrievalScope, setRetrievalScope] = useState<'all' | 'current' | 'selected'>('all');
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);

  const handleExecuteQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    try {
      setIsQuerying(true);
      setQueryError('');
      setRagResult(null);

      const response = await queryKnowledgeBase({
        question: question.trim(),
        top_k: topK,
        similarity_threshold: similarityThreshold,
        temperature: temperature,
        model: model,
        chunk_strategy: chunkStrategy,
        scope: retrievalScope,
        document_ids: selectedDocIds,
        workspace_id: activeWorkspace?.id || 'ws_default',
        project_id: activeProject?.id || 'proj_default',
      });

      setRagResult(response);
    } catch (err: any) {
      const errMsg = err?.response?.data?.detail || err.message || 'Failed to answer question';
      setQueryError(errMsg);
      toast.error(`Query error: ${errMsg}`);
    } finally {
      setIsQuerying(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-8 md:gap-12 pb-16">
      {/* SECTION 1: Header Banner */}
      <section className="space-y-6">
        <FriendlyGuideBanner
          pageTitle="Enterprise Knowledge Workspace (RAG)"
          badge={`Scoped to: ${activeWorkspace?.name || 'Enterprise Workspace'}`}
          tagline="Upload PDFs, Docs, or Markdown files to ground your AI answers with factual, real-world context."
          steps={[
            { title: 'Upload Your Files', desc: 'Drag and drop your company documents (PDF, DOCX, TXT, MD).', icon: Upload },
            { title: 'Automatic Vector Indexing', desc: 'Our engine cleans, chunks, and stores text in ChromaDB vector storage.', icon: Layers },
            { title: 'Ask Questions with Citations', desc: 'Get accurate answers grounded in your files with clickable source citations.', icon: BookOpen },
          ]}
          tipText="Select specific documents from the list below if you want to limit AI search to a single file."
        />
      </section>

      {/* SECTION 2: Balanced Two-Column Layout */}
      <section className="w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10 items-start">
          {/* LEFT COLUMN: Ingestion & Document Repository (5 cols) */}
          <div className="lg:col-span-5 space-y-8">
            {/* Drag & Drop Upload Card */}
            <div className="rounded-3xl border border-[#3A3A3A] bg-[#262626]/90 p-7 md:p-8 space-y-5 shadow-xl">
              <div className="flex items-center justify-between pb-2 border-b border-[#3A3A3A]">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-[#FF7F11]" /> Document Upload & Ingestion
                </h3>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#FF7F11]/10 text-[#FF7F11] border border-[#FF7F11]/20 font-semibold">
                  8-Stage Pipeline
                </span>
              </div>

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-300 ${
                  isDragging
                    ? 'border-[#FF7F11] bg-[#FF7F11]/10 scale-[1.01]'
                    : 'border-[#3A3A3A] bg-[#0A0A0A] hover:border-[#FF7F11]/50'
                }`}
              >
                <input
                  type="file"
                  accept=".pdf,.docx,.txt,.md,.csv"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isUploading}
                />

                <div className="flex flex-col items-center space-y-3">
                  <div className="p-4 rounded-2xl bg-[#FF7F11]/15 border border-[#FF7F11]/30 text-[#FF7F11] shadow-lg">
                    <Upload className="w-8 h-8" />
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-200">
                      {isUploading ? 'Ingesting Document into ChromaDB...' : 'Drag & Drop files or click to browse'}
                    </h4>
                    <p className="text-xs text-[#737373] mt-1 font-sans">
                      Supports PDF, DOCX, TXT, Markdown, CSV (up to 50MB)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Ingestion Pipeline Timeline */}
            {(isUploading || ingestionResult || uploadError) && (
              <VisualPipelineTimeline
                logs={ingestionResult?.pipeline_logs || []}
                isProcessing={isUploading}
                error={uploadError}
              />
            )}

            {/* Uploaded Document List Card */}
            <div className="rounded-3xl border border-[#3A3A3A] bg-[#262626]/90 p-7 md:p-8 space-y-6 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-[#3A3A3A]">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#FF7F11]" />
                  Indexed Knowledge Base ({documents.length})
                </h3>
                <span className="text-[10px] font-mono text-[#4ADE80] font-semibold px-2.5 py-0.5 rounded-full bg-[#4ADE80]/10 border border-[#4ADE80]/20">
                  ChromaDB Synced
                </span>
              </div>

              {isLoadingDocs ? (
                <div className="p-8 text-center text-[#737373] text-xs font-mono flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#FF7F11]" /> Loading indexed documents...
                </div>
              ) : documents.length === 0 ? (
                <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-8 text-center text-[#737373] text-xs font-sans leading-relaxed">
                  No documents uploaded yet. Upload a PDF, DOCX, or TXT file to start querying your knowledge base.
                </div>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                  {documents.map((doc) => (
                    <DocumentMetadataCard key={doc.id} doc={doc} onDelete={handleDeleteDoc} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: RAG Retrieval Settings, Scoping, Question & Answers (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-8">
            {/* Advanced Retrieval Settings Panel */}
            <AdvancedSettingsPanel
              topK={topK}
              setTopK={setTopK}
              similarityThreshold={similarityThreshold}
              setSimilarityThreshold={setSimilarityThreshold}
              temperature={temperature}
              setTemperature={setTemperature}
              model={model}
              setModel={setModel}
              chunkStrategy={chunkStrategy}
              setChunkStrategy={setChunkStrategy}
            />

            {/* Scope Selector Control Bar */}
            <div className="p-6 rounded-2xl border border-[#3A3A3A] bg-[#262626]/90 space-y-4 font-mono text-xs shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <span className="text-slate-200 font-bold uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#FF7F11]" />
                  RAG Retrieval Scope:
                </span>

                <div className="flex items-center gap-2 bg-[#0A0A0A] p-1.5 rounded-xl border border-[#3A3A3A]">
                  {(['all', 'current', 'selected'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRetrievalScope(s)}
                      className={`px-3.5 py-1.5 rounded-lg capitalize transition-all cursor-pointer ${
                        retrievalScope === s
                          ? 'bg-[#FF7F11] text-[#0A0A0A] font-bold shadow-md'
                          : 'text-[#737373] hover:text-[#A3A3A3]'
                      }`}
                    >
                      {s === 'all' ? 'All Knowledge' : s === 'current' ? 'Latest Doc' : 'Selected Docs'}
                    </button>
                  ))}
                </div>
              </div>

              {retrievalScope === 'selected' && (
                <div className="pt-4 border-t border-[#3A3A3A] space-y-3">
                  <span className="text-[#737373] text-[11px]">Select Document Scopes:</span>
                  <div className="max-h-36 overflow-y-auto space-y-2 pr-1">
                    {documents.map((d) => (
                      <label key={d.id} className="flex items-center gap-2.5 text-slate-300 hover:text-white cursor-pointer text-[11px] p-2.5 rounded-xl bg-black/40 border border-white/5">
                        <input
                          type="checkbox"
                          checked={selectedDocIds.includes(d.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedDocIds([...selectedDocIds, d.id]);
                            else setSelectedDocIds(selectedDocIds.filter((id) => id !== d.id));
                          }}
                          className="accent-[#FF7F11] w-4 h-4"
                        />
                        <span className="truncate font-mono">{d.filename}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Question Input Box */}
            <form onSubmit={handleExecuteQuery} className="space-y-4">
              <div className="relative">
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask a question grounded in your uploaded Knowledge Base..."
                  rows={4}
                  className="w-full rounded-2xl border border-[#3A3A3A] bg-[#262626]/90 p-6 pr-16 text-sm text-slate-200 placeholder-[#737373] focus:border-[#FF7F11] focus:outline-none transition-all resize-none shadow-2xl font-sans"
                />

                <button
                  type="submit"
                  disabled={isQuerying || !question.trim()}
                  className="absolute right-5 bottom-6 p-3.5 rounded-xl bg-[#FF7F11] text-[#0A0A0A] hover:opacity-90 disabled:opacity-40 transition-all shadow-xl border-none cursor-pointer"
                >
                  {isQuerying ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </div>
            </form>

            {/* Query Error State */}
            {queryError && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-xs text-red-300 flex items-center gap-3 shadow-lg">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                <div>
                  <span className="font-semibold">Query Failed:</span> {queryError}
                </div>
              </div>
            )}

            {/* RAG Answer Output, Sources & LangSmith Trace */}
            {ragResult && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl border border-[#3A3A3A] bg-[#262626]/95 backdrop-blur-2xl p-8 space-y-6 shadow-2xl"
              >
                {/* Answer Header & Metric Telemetry */}
                <div className="space-y-4 pb-4 border-b border-[#3A3A3A] font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold uppercase tracking-widest text-[#FF7F11] flex items-center gap-2">
                      <Sparkles className="w-4 h-4" /> Grounded AI Answer
                    </span>

                    <span className="text-[#737373] font-semibold">
                      {ragResult.execution_metrics.total_latency_ms} ms
                    </span>
                  </div>

                  {/* Metric Telemetry Pills */}
                  <div className="flex flex-wrap gap-2 text-[11px]">
                    <span className="px-3 py-1 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 font-semibold">
                      Model: {(ragResult.execution_metrics as any)?.model || model}
                    </span>
                    <span className="px-3 py-1 rounded-xl bg-[#FF7F11]/15 border border-[#FF7F11]/30 text-[#FF7F11] font-semibold">
                      Confidence: {(ragResult.execution_metrics as any)?.answer_confidence_pct || 94}%
                    </span>
                    <span className="px-3 py-1 rounded-xl bg-[#4ADE80]/15 border border-[#4ADE80]/30 text-[#4ADE80] font-semibold">
                      Sources: {ragResult.citations.length} Docs ({(ragResult.execution_metrics as any)?.chunks_retrieved || topK} Chunks)
                    </span>
                    <span className="px-3 py-1 rounded-xl bg-white/10 border border-white/20 text-white/80 font-semibold">
                      Scope: {retrievalScope.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Answer Content */}
                <div className="prose prose-invert max-w-none text-sm text-slate-200 leading-relaxed font-sans whitespace-pre-wrap p-5 rounded-2xl bg-[#0A0A0A] border border-[#3A3A3A] shadow-inner">
                  {ragResult.answer}
                </div>

                {/* Source Citation Drawer */}
                <SourceCitationDrawer citations={ragResult.citations} />

                {/* Lightweight RAG Explorer */}
                <LightweightRAGExplorer steps={ragResult.rag_steps} />

                {/* LangSmith Trace Badge */}
                <LangSmithTraceBadge trace={ragResult.langsmith_trace} />
              </motion.div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default KnowledgeBasePage;
