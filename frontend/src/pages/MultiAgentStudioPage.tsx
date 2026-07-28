import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, RotateCcw, ExternalLink, Bot, Layers, Database, PenTool, ShieldCheck, Zap, Clock, Cpu, CheckCircle2, AlertCircle, ChevronRight, Code2, FileText, Sparkles, Check, X, Edit3, SkipForward, RefreshCw, Server
} from 'lucide-react';
import { toast } from 'sonner';
import { streamAgentWorkflow } from '@/services/agentApi';
import { sendHumanApproval } from '@/services/api';
import type { AgentStepResult } from '@/types/agent';
import { useWorkspace } from '@/context/WorkspaceContext';
import { MCPIntegrationsModal } from '@/components/tools/MCPIntegrationsModal';

// Definition of active pipeline nodes
const WORKFLOW_NODES = [
  { id: 'Planner', label: 'Planner Agent', icon: Bot, role: 'Strategy & Routing', color: '#6C63FF' },
  { id: 'Retriever', label: 'Retriever Agent', icon: Database, role: 'Scoped RAG Retrieval', color: '#00D4FF' },
  { id: 'Prompt Engineer', label: 'Prompt Engineer', icon: Code2, role: 'Technique Selection & Optimization', color: '#A855F7' },
  { id: 'Writer', label: 'Writer Agent', icon: PenTool, role: 'Grounded Answer Synthesis', color: '#3B82F6' },
  { id: 'Reviewer', label: 'Reviewer Agent', icon: ShieldCheck, role: 'Citation & Audit', color: '#22C55E' },
  { id: 'Evaluator', label: 'Evaluator Agent', icon: Layers, role: 'Multi-Metric Scorecard', color: '#EC4899' },
];

export default function MultiAgentStudioPage() {
  const { activeWorkspace, activeProject } = useWorkspace();
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<'all' | 'current' | 'selected'>('all');
  const [isRunning, setIsRunning] = useState(false);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [showMcpModal, setShowMcpModal] = useState(false);

  // Workflow telemetry states
  const [currentRunId, setCurrentRunId] = useState<string>('');
  const [stepResults, setStepResults] = useState<Record<string, AgentStepResult>>({});
  const [promptEngineerOutput, setPromptEngineerOutput] = useState<any>(null);
  const [evaluatorOutput, setEvaluatorOutput] = useState<any>(null);
  const [finalResponse, setFinalResponse] = useState<string>('');
  const [traceUrl, setTraceUrl] = useState<string | null>(null);
  const [totalTokens, setTotalTokens] = useState<number>(0);
  const [totalLatency, setTotalLatency] = useState<number>(0);
  const [overallConfidence, setOverallConfidence] = useState<number>(0);
  const [selectedStepOutput, setSelectedStepOutput] = useState<AgentStepResult | null>(null);

  // Human-in-the-Loop Approval state
  const [showApprovalBanner, setShowApprovalBanner] = useState(false);
  const [approvalDecision, setApprovalDecision] = useState<string | null>(null);
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [editedPromptText, setEditedPromptText] = useState('');

  const handleStartWorkflow = () => {
    if (!query.trim()) {
      toast.error('Please enter a query for the Multi-Agent workflow.');
      return;
    }

    setIsRunning(true);
    setActiveNodeId('Planner');
    setStepResults({});
    setPromptEngineerOutput(null);
    setEvaluatorOutput(null);
    setFinalResponse('');
    setTraceUrl(null);
    setTotalTokens(0);
    setTotalLatency(0);
    setOverallConfidence(0);
    setShowApprovalBanner(false);
    setApprovalDecision(null);

    const reqPayload = {
      user_query: query,
      workspace_id: activeWorkspace?.id || 'ws_default',
      project_id: activeProject?.id || 'proj_default',
      scope,
    };

    streamAgentWorkflow(
      reqPayload,
      (eventData) => {
        if (eventData.event === 'start') {
          setCurrentRunId(eventData.run_id);
        } else if (eventData.event === 'node_status') {
          setActiveNodeId(eventData.node);
          if (eventData.status === 'completed' && eventData.step_result) {
            setStepResults((prev) => ({
              ...prev,
              [eventData.node]: eventData.step_result,
            }));
          }
        } else if (eventData.event === 'completed') {
          setIsRunning(false);
          setActiveNodeId(null);
          setFinalResponse(eventData.final_response || '');
          setTraceUrl(eventData.langsmith_url || null);
          setTotalTokens(eventData.total_tokens || 0);
          setTotalLatency(eventData.total_latency_ms || 0);
          setOverallConfidence(eventData.overall_confidence || 0);

          if (eventData.prompt_engineer_output) {
            setPromptEngineerOutput(eventData.prompt_engineer_output);
          }
          if (eventData.evaluator_output) {
            setEvaluatorOutput(eventData.evaluator_output);
          }
          if (eventData.hitl_approval_required) {
            setShowApprovalBanner(true);
          }

          toast.success('Multi-Agent workflow completed! Review output and human approval options below.');
        }
      },
      (err) => {
        setIsRunning(false);
        setActiveNodeId(null);
        toast.error(`Workflow execution error: ${err.message || err}`);
      }
    );
  };

  const handleHumanApprovalAction = async (decision: 'approved' | 'rejected' | 'regenerated' | 'edited' | 'skipped') => {
    const toastId = toast.loading(`Logging decision: ${decision.toUpperCase()}...`);
    try {
      await sendHumanApproval({
        run_id: currentRunId || 'run_active',
        decision,
        user_edits: decision === 'edited' ? editedPromptText : '',
        feedback_notes: `Human action '${decision}' executed from Multi-Agent Studio.`
      });
      setApprovalDecision(decision);
      setShowApprovalBanner(false);
      setIsEditingPrompt(false);
      toast.success(`Human approval decision '${decision}' successfully recorded!`, { id: toastId });
    } catch (err) {
      toast.error('Failed to log human approval decision', { id: toastId });
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-8 md:gap-12 pb-16">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#121212] p-6 rounded-2xl border border-[#3A3A3A] shadow-xl">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30">
              <Bot size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#F5F5F5] tracking-tight">Multi-Agent Intelligence Studio</h1>
              <p className="text-xs text-[#A3A3A3] mt-0.5">
                LangGraph Pipeline • Planner → Retriever → Prompt Engineer → Writer → Reviewer → Human Approval → Evaluator
              </p>
            </div>
          </div>
        </div>

        {/* Live System Telemetry Badges */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-[#3A3A3A] flex items-center gap-2">
            <Zap size={14} className="text-[#FF7F11]" />
            <span className="text-xs text-[#A3A3A3]">Tokens:</span>
            <span className="text-xs font-mono font-semibold text-[#F5F5F5]">{totalTokens}</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-[#3A3A3A] flex items-center gap-2">
            <Clock size={14} className="text-[#00D4FF]" />
            <span className="text-xs text-[#A3A3A3]">Latency:</span>
            <span className="text-xs font-mono font-semibold text-[#F5F5F5]">{totalLatency} ms</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-[#3A3A3A] flex items-center gap-2">
            <ShieldCheck size={14} className="text-[#22C55E]" />
            <span className="text-xs text-[#A3A3A3]">Confidence:</span>
            <span className="text-xs font-mono font-semibold text-[#22C55E]">{overallConfidence}%</span>
          </div>
          <button
            onClick={() => setShowMcpModal(true)}
            className="px-3.5 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Server size={12} />
            <span>MCP Adapters</span>
          </button>
          {traceUrl && (
            <a
              href={traceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20 transition-all text-xs font-semibold flex items-center gap-1.5"
            >
              <span>LangSmith Trace</span>
              <ExternalLink size={12} />
            </a>
          )}
        </div>
      </div>

      <MCPIntegrationsModal isOpen={showMcpModal} onClose={() => setShowMcpModal(false)} />

      {/* Input Query & Controls Panel */}
      <div className="bg-[#121212] p-5 rounded-2xl border border-[#3A3A3A] space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a question or enter a command for the multi-agent engine..."
            className="flex-1 bg-[#0A0A0A] border border-[#3A3A3A] rounded-xl px-4 py-3 text-sm text-[#F5F5F5] focus:outline-none focus:border-purple-500 transition-colors"
          />

          <div className="flex items-center gap-2">
            <select
              value={scope}
              onChange={(e: any) => setScope(e.target.value)}
              className="bg-[#0A0A0A] border border-[#3A3A3A] rounded-xl px-3 py-3 text-xs text-[#F5F5F5] focus:outline-none cursor-pointer"
            >
              <option value="all">Scope: Entire Workspace</option>
              <option value="current">Scope: Active Document</option>
              <option value="selected">Scope: Selected Documents</option>
            </select>

            <button
              onClick={handleStartWorkflow}
              disabled={isRunning}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:opacity-95 transition-opacity disabled:opacity-50 cursor-pointer shadow-lg shadow-purple-500/20"
            >
              {isRunning ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Executing...</span>
                </>
              ) : (
                <>
                  <Play size={14} />
                  <span>Run Workflow</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Live Graph Visualizer */}
      <div className="bg-[#121212] p-6 rounded-2xl border border-[#3A3A3A] space-y-4">
        <h2 className="text-sm font-semibold text-[#A3A3A3] tracking-wide uppercase">Multi-Agent Pipeline Graph</h2>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 relative">
          {WORKFLOW_NODES.map((node, idx) => {
            const stepData = stepResults[node.id];
            const isActive = activeNodeId === node.id;
            const isCompleted = Boolean(stepData && stepData.status === 'completed');

            return (
              <div key={node.id} className="relative group">
                <div
                  className={`p-3.5 rounded-xl border transition-all duration-300 relative bg-[#0A0A0A] ${
                    isActive
                      ? 'border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                      : isCompleted
                      ? 'border-[#22C55E]/40'
                      : 'border-[#3A3A3A]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className="p-1.5 rounded-lg"
                      style={{ background: `${node.color}15`, color: node.color }}
                    >
                      <node.icon size={16} />
                    </div>

                    <div className="flex items-center gap-1">
                      {isActive && (
                        <div className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-ping" />
                      )}
                      {isCompleted && (
                        <CheckCircle2 size={14} className="text-[#22C55E]" />
                      )}
                    </div>
                  </div>

                  <h3 className="text-xs font-bold text-[#F5F5F5] truncate">{node.label}</h3>
                  <p className="text-[10px] text-[#A3A3A3] mt-0.5 truncate">{node.role}</p>

                  <div className="mt-2 pt-2 border-t border-[#3A3A3A]/60 flex items-center justify-between text-[10px] font-mono text-[#A3A3A3]">
                    <span>
                      {isActive ? 'Streaming...' : isCompleted ? `${stepData.duration_ms}ms` : 'Waiting'}
                    </span>
                    {stepData && (
                      <button
                        onClick={() => setSelectedStepOutput(stepData)}
                        className="text-purple-400 hover:underline cursor-pointer"
                      >
                        Inspect
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Human-in-the-Loop Approval Action Banner */}
      {showApprovalBanner && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-2xl bg-gradient-to-r from-purple-900/40 via-indigo-900/30 to-violet-900/40 border border-purple-500/40 shadow-xl space-y-3"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-purple-300 font-bold text-sm">
                <Sparkles className="w-4 h-4 text-purple-400" />
                Human Approval Checkpoint
              </div>
              <p className="text-xs text-slate-300 mt-1">
                The agent pipeline completed Reviewer validation. Choose an action before finalizing Evaluator benchmarking.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => handleHumanApprovalAction('approved')}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
              >
                <Check className="w-3.5 h-3.5" /> Approve
              </button>
              <button
                onClick={() => handleHumanApprovalAction('rejected')}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-rose-600/20"
              >
                <X className="w-3.5 h-3.5" /> Reject
              </button>
              <button
                onClick={() => handleHumanApprovalAction('regenerated')}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Regenerate
              </button>
              <button
                onClick={() => {
                  setEditedPromptText(promptEngineerOutput?.structured_prompt || query);
                  setIsEditingPrompt(true);
                }}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-amber-600/20"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit Prompt
              </button>
              <button
                onClick={() => handleHumanApprovalAction('skipped')}
                className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold flex items-center gap-1.5"
              >
                <SkipForward className="w-3.5 h-3.5" /> Skip
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Prompt Engineer & Evaluator Output Cards */}
      {promptEngineerOutput && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Prompt Engineer Strategy Card */}
          <div className="bg-[#121212] p-5 rounded-2xl border border-purple-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                <Code2 className="w-4 h-4" /> Prompt Engineer Agent
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30 text-[10px] font-semibold">
                Strategy: {promptEngineerOutput.selected_strategy}
              </span>
            </div>

            <div className="text-xs text-slate-300 space-y-1">
              <p><strong>Role Assigned:</strong> {promptEngineerOutput.role_assigned}</p>
              <p><strong>Justification:</strong> {promptEngineerOutput.strategy_justification}</p>
              <p><strong>Context Compression:</strong> {promptEngineerOutput.context_compression_ratio}</p>
            </div>

            <div className="p-3 bg-[#0A0A0A] rounded-xl border border-slate-800 text-[11px] font-mono text-purple-200 overflow-x-auto max-h-32">
              <pre>{promptEngineerOutput.structured_prompt}</pre>
            </div>
          </div>

          {/* Evaluator Scorecard Summary */}
          {evaluatorOutput && (
            <div className="bg-[#121212] p-5 rounded-2xl border border-pink-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-pink-400 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4" /> Evaluator Agent Scorecard
                </span>
                <span className="text-lg font-bold text-emerald-400">
                  {evaluatorOutput.confidence_score}% Confidence
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-[11px] text-center">
                <div className="bg-[#0A0A0A] p-2 rounded-lg border border-slate-800">
                  <div className="text-purple-400 font-bold">{evaluatorOutput.faithfulness_score}%</div>
                  <div className="text-[9px] text-slate-400">Faithfulness</div>
                </div>
                <div className="bg-[#0A0A0A] p-2 rounded-lg border border-slate-800">
                  <div className="text-cyan-400 font-bold">{evaluatorOutput.context_precision}%</div>
                  <div className="text-[9px] text-slate-400">Precision</div>
                </div>
                <div className="bg-[#0A0A0A] p-2 rounded-lg border border-slate-800">
                  <div className="text-amber-400 font-bold">{evaluatorOutput.hallucination_score}%</div>
                  <div className="text-[9px] text-slate-400">Hallucination</div>
                </div>
              </div>

              <p className="text-xs text-slate-300 line-clamp-2">{evaluatorOutput.evaluator_reasoning}</p>
            </div>
          )}
        </div>
      )}

      {/* Main Execution Output & Timeline Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Final Response Synthesis Output */}
        <div className="lg:col-span-2 bg-[#121212] p-6 rounded-2xl border border-[#3A3A3A] space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#A3A3A3] tracking-wide uppercase flex items-center gap-2">
              <FileText size={16} className="text-purple-400" />
              <span>Grounded Multi-Agent Response</span>
            </h2>
            {finalResponse && (
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/30">
                Quality Audit Passed
              </span>
            )}
          </div>

          <div className="min-h-[250px] p-5 rounded-xl bg-[#0A0A0A] border border-[#3A3A3A] text-sm text-[#F5F5F5] leading-relaxed whitespace-pre-wrap font-sans">
            {finalResponse || (
              <span className="text-[#737373] italic">
                No active execution. Enter a query above and click "Run Workflow" to trigger the multi-agent engine.
              </span>
            )}
          </div>
        </div>

        {/* Right: Step Timeline & Details */}
        <div className="bg-[#121212] p-6 rounded-2xl border border-[#3A3A3A] space-y-4">
          <h2 className="text-sm font-semibold text-[#A3A3A3] tracking-wide uppercase flex items-center gap-2">
            <Clock size={16} className="text-[#00D4FF]" />
            <span>Execution Timeline</span>
          </h2>

          <div className="space-y-2.5">
            {WORKFLOW_NODES.map((node) => {
              const res = stepResults[node.id];
              return (
                <div
                  key={node.id}
                  className="p-3 rounded-xl bg-[#0A0A0A] border border-[#3A3A3A] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <node.icon size={14} style={{ color: node.color }} />
                    <span className="font-semibold text-[#F5F5F5]">{node.id}</span>
                  </div>

                  <div className="flex items-center gap-3 font-mono text-[11px]">
                    {res ? (
                      <>
                        <span className="text-[#A3A3A3]">{res.duration_ms}ms</span>
                        <span className="text-[#22C55E] font-bold">✓</span>
                      </>
                    ) : (
                      <span className="text-[#737373]">Idle</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Edit Prompt Modal */}
      {isEditingPrompt && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-purple-500/40 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-white text-base">Edit Prompt Before Continuation</h3>
            <textarea
              rows={5}
              value={editedPromptText}
              onChange={(e) => setEditedPromptText(e.target.value)}
              className="w-full bg-[#0A0A0A] border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-purple-500"
            />
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setIsEditingPrompt(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleHumanApprovalAction('edited')}
                className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold"
              >
                Save & Proceed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Intermediate Step Output Modal Drawer */}
      {selectedStepOutput && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#121212] border border-[#3A3A3A] rounded-2xl max-w-2xl w-full p-6 space-y-4 max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-[#3A3A3A] pb-3">
              <h3 className="font-bold text-[#F5F5F5] text-base flex items-center gap-2">
                <Cpu size={18} className="text-purple-400" />
                <span>{selectedStepOutput.agent_name} Output Inspection</span>
              </h3>
              <button
                onClick={() => setSelectedStepOutput(null)}
                className="text-[#A3A3A3] hover:text-white text-sm cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono text-[#A3A3A3]">
              <div>Duration: {selectedStepOutput.duration_ms} ms</div>
              <div>Model: {selectedStepOutput.model_used}</div>
              <div>Tokens: {selectedStepOutput.tokens_used}</div>
              <div>Confidence: {selectedStepOutput.confidence * 100}%</div>
            </div>

            <div className="p-4 rounded-xl bg-[#0A0A0A] border border-[#3A3A3A] text-xs font-mono text-cyan-300 overflow-x-auto">
              <pre>{JSON.stringify(selectedStepOutput.output, null, 2)}</pre>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

