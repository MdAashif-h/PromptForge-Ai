import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, BarChart3, RefreshCw, Sparkles, Play, FileText, Layers, Cpu
} from 'lucide-react';
import { toast } from 'sonner';
import { fetchEvaluations, runRAGEvaluationSuite } from '@/services/api';
import { EmptyState } from '@/components/common/EmptyState';
import { pageTransition } from '@/animations/variants';

export default function RAGEvaluationPage() {
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [selectedEval, setSelectedEval] = useState<any | null>(null);

  // Test Suite Form State
  const [testQuery, setTestQuery] = useState('Explain prompt injection risks and remediation guidelines for LLM applications.');
  const [groundTruth, setGroundTruth] = useState('Prompt injection occurs when untrusted user inputs manipulate the system instructions of an LLM. Remediation includes strict role separation, XML tagging, and input validation.');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchEvaluations();
      setEvaluations(data);
      if (data.length > 0 && !selectedEval) {
        setSelectedEval(data[0]);
      }
    } catch {
      toast.error('Failed to load evaluation reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRunSuite = async () => {
    if (!testQuery.trim()) return;
    setRunning(true);
    const toastId = toast.loading('Executing RAG Evaluation Suite...');
    try {
      const res = await runRAGEvaluationSuite({
        query: testQuery,
        ground_truth: groundTruth
      });
      toast.success('RAG Evaluation completed!', { id: toastId });
      await loadData();
      setSelectedEval(res);
    } catch {
      toast.error('Failed to run evaluation suite', { id: toastId });
    } finally {
      setRunning(false);
    }
  };

  return (
    <motion.div
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="w-full flex flex-col gap-8 md:gap-10 pb-12"
    >
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#121212] p-6 md:p-8 rounded-2xl border border-[#3A3A3A] shadow-xl">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30 shrink-0">
            <ShieldCheck size={28} />
          </div>
          <div className="space-y-1 flex-1 min-w-0">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30 text-[10px] font-mono font-semibold uppercase tracking-wider">
              Enterprise Quality Benchmark
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#F5F5F5] tracking-tight truncate">RAG Evaluation & Quality Audit</h1>
            <p className="text-xs md:text-sm text-[#A3A3A3] leading-relaxed font-sans max-w-md mt-1">
              Ragas-grade benchmark measuring Faithfulness, Context Precision, Recall, and Answer Relevancy across RAG runs.
            </p>
          </div>
        </div>

        <div className="shrink-0">
          <button
            onClick={handleRunSuite}
            disabled={running}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-50 border-none cursor-pointer shadow-lg shadow-purple-500/20 whitespace-nowrap"
          >
            {running ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span>Executing Suite...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} className="fill-current" />
                <span>Run Evaluation Suite</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main 2-Column Grid Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Pane (5 Cols): Test Query & Saved Reports */}
        <div className="lg:col-span-5 flex flex-col gap-8">
          {/* Run Benchmark Card */}
          <div className="bg-[#121212] p-6 rounded-2xl border border-[#3A3A3A] space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#3A3A3A]">
              <h3 className="text-sm font-bold text-[#F5F5F5] flex items-center gap-2">
                <Sparkles size={16} className="text-purple-400" />
                <span>Run Benchmark Query</span>
              </h3>
              <span className="text-[10px] font-mono text-purple-300 px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30">
                Ragas Engine
              </span>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-[#A3A3A3] mb-1.5 font-sans">Benchmark Question / Query</label>
                <textarea
                  rows={3}
                  value={testQuery}
                  onChange={(e) => setTestQuery(e.target.value)}
                  placeholder="Enter benchmark question..."
                  className="w-full bg-[#0A0A0A] border border-[#3A3A3A] rounded-xl px-5 py-3.5 text-xs text-[#F5F5F5] focus:outline-none focus:border-purple-500 transition-colors resize-none font-sans leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A3A3A3] mb-1.5 font-sans">Ground Truth Reference (Optional)</label>
                <textarea
                  rows={3}
                  value={groundTruth}
                  onChange={(e) => setGroundTruth(e.target.value)}
                  placeholder="Enter expected answer context..."
                  className="w-full bg-[#0A0A0A] border border-[#3A3A3A] rounded-xl px-5 py-3.5 text-xs text-[#F5F5F5] focus:outline-none focus:border-purple-500 transition-colors resize-none font-sans leading-relaxed"
                />
              </div>

              <button
                onClick={handleRunSuite}
                disabled={running}
                className="w-full py-3 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold text-xs font-mono transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {running ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Evaluating Suite...</span>
                  </>
                ) : (
                  <>
                    <Play size={14} className="fill-current" />
                    <span>Execute Suite</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Saved Evaluation Reports Card */}
          <div className="bg-[#121212] p-6 rounded-2xl border border-[#3A3A3A] space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#3A3A3A]">
              <h3 className="text-sm font-bold text-[#F5F5F5] flex items-center gap-2">
                <BarChart3 size={16} className="text-[#00D4FF]" />
                <span>Evaluation Reports ({evaluations.length})</span>
              </h3>
              <span className="text-[10px] font-mono text-[#00D4FF] px-2.5 py-0.5 rounded-full bg-[#00D4FF]/10 border border-[#00D4FF]/20">
                Saved Benchmarks
              </span>
            </div>

            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {evaluations.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#737373] font-mono border border-[#3A3A3A] rounded-xl bg-[#0A0A0A]">
                  No evaluation reports found. Run a new suite to generate metrics.
                </div>
              ) : (
                evaluations.map((ev) => (
                  <div
                    key={ev.id}
                    onClick={() => setSelectedEval(ev)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer font-mono text-xs ${
                      selectedEval?.id === ev.id
                        ? 'bg-purple-500/10 border-purple-500 shadow-md shadow-purple-500/10'
                        : 'bg-[#0A0A0A] border-[#3A3A3A] hover:border-purple-500/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-purple-300">Run ID: {ev.run_id}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20 font-medium">
                        Score: {ev.confidence_score}%
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-[#A3A3A3] line-clamp-2 font-sans">{ev.evaluator_reasoning || 'Evaluated RAG Run'}</p>
                    <div className="mt-3 flex items-center justify-between text-[11px] text-[#737373]">
                      <span>Faithfulness: {ev.faithfulness_score}%</span>
                      <span>Hallucination: {ev.hallucination_score}%</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Pane (7 Cols): Multi-Metric Scorecard */}
        <div className="lg:col-span-7">
          {selectedEval ? (
            <div className="bg-[#121212] p-6 md:p-8 rounded-2xl border border-[#3A3A3A] space-y-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#3A3A3A] pb-4">
                <div>
                  <h2 className="text-xl font-bold text-[#F5F5F5] flex items-center gap-2">
                    <Layers size={20} className="text-purple-400" />
                    <span>Evaluation Scorecard</span>
                  </h2>
                  <p className="text-xs text-[#737373] mt-1 font-mono">Benchmark Run ID: {selectedEval.run_id}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-[#0A0A0A] border border-[#3A3A3A] text-right font-mono">
                    <div className="text-2xl font-extrabold text-[#22C55E]">{selectedEval.confidence_score}%</div>
                    <div className="text-[10px] uppercase text-[#737373] font-semibold tracking-wider font-sans">Overall Confidence</div>
                  </div>
                </div>
              </div>

              {/* 6 Core Metric Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-[#0A0A0A] rounded-xl p-4 md:p-5 border border-[#3A3A3A] flex flex-col justify-between h-full hover:border-purple-500/30 transition-all">
                  <span className="text-[10px] text-[#A3A3A3] uppercase font-bold tracking-wider">Faithfulness</span>
                  <div className="text-2xl font-bold text-[#A855F7] mt-2 font-mono">{selectedEval.faithfulness_score}%</div>
                  <div className="w-full bg-white/5 rounded-full h-1.5 mt-3 overflow-hidden border border-white/5">
                    <div className="bg-[#A855F7] h-full rounded-full" style={{ width: `${selectedEval.faithfulness_score}%` }}></div>
                  </div>
                </div>

                <div className="bg-[#0A0A0A] rounded-xl p-4 md:p-5 border border-[#3A3A3A] flex flex-col justify-between h-full hover:border-[#00D4FF]/30 transition-all">
                  <span className="text-[10px] text-[#A3A3A3] uppercase font-bold tracking-wider">Context Precision</span>
                  <div className="text-2xl font-bold text-[#00D4FF] mt-2 font-mono">{selectedEval.context_precision}%</div>
                  <div className="w-full bg-white/5 rounded-full h-1.5 mt-3 overflow-hidden border border-white/5">
                    <div className="bg-[#00D4FF] h-full rounded-full" style={{ width: `${selectedEval.context_precision}%` }}></div>
                  </div>
                </div>

                <div className="bg-[#0A0A0A] rounded-xl p-4 md:p-5 border border-[#3A3A3A] flex flex-col justify-between h-full hover:border-indigo-500/30 transition-all">
                  <span className="text-[10px] text-[#A3A3A3] uppercase font-bold tracking-wider">Context Recall</span>
                  <div className="text-2xl font-bold text-[#6366F1] mt-2 font-mono">{selectedEval.context_recall}%</div>
                  <div className="w-full bg-white/5 rounded-full h-1.5 mt-3 overflow-hidden border border-white/5">
                    <div className="bg-[#6366F1] h-full rounded-full" style={{ width: `${selectedEval.context_recall}%` }}></div>
                  </div>
                </div>

                <div className="bg-[#0A0A0A] rounded-xl p-4 md:p-5 border border-[#3A3A3A] flex flex-col justify-between h-full hover:border-[#22C55E]/30 transition-all">
                  <span className="text-[10px] text-[#A3A3A3] uppercase font-bold tracking-wider">Answer Relevancy</span>
                  <div className="text-2xl font-bold text-[#22C55E] mt-2 font-mono">{selectedEval.answer_relevancy}%</div>
                  <div className="w-full bg-white/5 rounded-full h-1.5 mt-3 overflow-hidden border border-white/5">
                    <div className="bg-[#22C55E] h-full rounded-full" style={{ width: `${selectedEval.answer_relevancy}%` }}></div>
                  </div>
                </div>

                <div className="bg-[#0A0A0A] rounded-xl p-4 md:p-5 border border-[#3A3A3A] flex flex-col justify-between h-full hover:border-blue-500/30 transition-all">
                  <span className="text-[10px] text-[#A3A3A3] uppercase font-bold tracking-wider">Citation Correctness</span>
                  <div className="text-2xl font-bold text-[#3B82F6] mt-2 font-mono">{selectedEval.citation_correctness}%</div>
                  <div className="w-full bg-white/5 rounded-full h-1.5 mt-3 overflow-hidden border border-white/5">
                    <div className="bg-[#3B82F6] h-full rounded-full" style={{ width: `${selectedEval.citation_correctness}%` }}></div>
                  </div>
                </div>

                <div className="bg-[#0A0A0A] rounded-xl p-4 md:p-5 border border-[#3A3A3A] flex flex-col justify-between h-full hover:border-amber-500/30 transition-all">
                  <span className="text-[10px] text-[#A3A3A3] uppercase font-bold tracking-wider">Hallucination Risk</span>
                  <div className="text-2xl font-bold text-[#F59E0B] mt-2 font-mono">{selectedEval.hallucination_score}%</div>
                  <div className="w-full bg-white/5 rounded-full h-1.5 mt-3 overflow-hidden border border-white/5">
                    <div className="bg-[#F59E0B] h-full rounded-full" style={{ width: `${selectedEval.hallucination_score}%` }}></div>
                  </div>
                </div>
              </div>

              {/* Evaluator Reasoning Card */}
              <div className="bg-[#0A0A0A] rounded-xl p-5 border border-[#3A3A3A] space-y-2">
                <h4 className="text-xs font-bold text-[#F5F5F5] uppercase tracking-wider flex items-center gap-2 font-sans">
                  <Cpu size={14} className="text-purple-400" />
                  <span>Evaluator Agent Audit & Reasoning</span>
                </h4>
                <p className="text-xs text-[#A3A3A3] leading-relaxed font-sans">{selectedEval.evaluator_reasoning}</p>
              </div>

              {/* Retrieved Context Chunks */}
              {selectedEval.retrieved_chunks && selectedEval.retrieved_chunks.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-[#F5F5F5] uppercase tracking-wider flex items-center gap-2 font-sans">
                    <FileText size={14} className="text-[#00D4FF]" />
                    <span>Retrieved Context Chunks ({selectedEval.retrieved_chunks.length})</span>
                  </h4>
                  <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                    {selectedEval.retrieved_chunks.map((chk: any, idx: number) => (
                      <div key={idx} className="p-3 bg-[#0A0A0A] rounded-xl border border-[#3A3A3A] text-xs text-[#A3A3A3] font-mono leading-relaxed">
                        <span className="text-purple-400 font-bold">Chunk #{idx + 1}:</span> {chk.page_content || JSON.stringify(chk)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-[#121212] p-12 rounded-2xl border border-[#3A3A3A] shadow-xl flex flex-col items-center justify-center">
              <EmptyState
                icon={ShieldCheck}
                title="No Evaluation Selected"
                description="Select an evaluation report from the list or run a new benchmark suite."
              />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
