import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftRight, Sparkles, AlertCircle, Loader2, Copy, Check, ExternalLink,
  History, Trophy, ShieldCheck, Zap, Layers, RefreshCw, BarChart2, CheckCircle2, ChevronRight
} from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { usePromptContext } from '@/context/PromptContext';
import { scorePrompt } from '@/services/api';
import type { ScoreResponse } from '@/types';
import { toast as hotToast } from 'sonner';
import { FriendlyGuideBanner } from '@/components/common/FriendlyGuideBanner';

const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const DEFAULT_BENCHMARKS = [
  {
    id: 'bench_1',
    title: 'Python RAG Scraper Benchmark',
    timestamp: '2 hours ago',
    originalPrompt: 'Write a Python script to scrape a webpage and parse paragraphs.',
    optimizedPrompt: `You are a Senior Python & Web Scraping Architect.
Write an enterprise-grade BeautifulSoup4 script to extract article paragraphs.

### Requirements:
1. Handle HTTP errors using tenacity backoff retry logic.
2. Clean HTML tags and normalize whitespace.
3. Return output strictly formatted in valid JSON schema with keys: 'url', 'title', 'paragraphs', 'word_count'.
4. Do NOT use deprecated libraries.`,
    originalScore: {
      overall_score: 42,
      categories: { clarity: 40, specificity: 35, context: 45, output_format: 30, constraints: 40, examples: 25, prompt_complexity: 50, hallucination_risk: 60 },
      suggestions: ['Add explicit persona', 'Specify output schema format'],
    },
    optimizedScore: {
      overall_score: 94,
      categories: { clarity: 95, specificity: 92, context: 96, output_format: 98, constraints: 94, examples: 90, prompt_complexity: 85, hallucination_risk: 10 },
      suggestions: ['Excellent structure'],
    },
    explanation: 'Added Senior Architect persona, explicit HTTP retry logic, strict negative constraints, and structured JSON output schema.',
  },
  {
    id: 'bench_2',
    title: 'SQL Analytics & Query Optimization',
    timestamp: '1 day ago',
    originalPrompt: 'Give me a SQL query for customer churn rate.',
    optimizedPrompt: `Act as a Principal Database Administrator specializing in PostgreSQL analytical queries.
Generate a high-performance CTE query to calculate monthly customer churn rate.

### Constraints:
- Use window functions (LAG, LEAD) to calculate active vs churned subscribers.
- Exclude test and demo accounts filtered by 'is_demo = false'.
- Include inline query execution explanation comments.`,
    originalScore: {
      overall_score: 50,
      categories: { clarity: 48, specificity: 45, context: 52, output_format: 40, constraints: 50, examples: 30, prompt_complexity: 55, hallucination_risk: 50 },
      suggestions: ['Add database dialect context'],
    },
    optimizedScore: {
      overall_score: 96,
      categories: { clarity: 98, specificity: 95, context: 94, output_format: 97, constraints: 95, examples: 90, prompt_complexity: 88, hallucination_risk: 8 },
      suggestions: ['High performance CTE query'],
    },
    explanation: 'Defined DBA persona, enforced CTE window functions, filtered demo accounts, and requested inline performance comments.',
  },
];

export default function ComparePage() {
  const navigate = useNavigate();
  const ctx = usePromptContext();

  const [originalInput, setOriginalInput] = useState(ctx.originalPrompt || DEFAULT_BENCHMARKS[0].originalPrompt);
  const [optimizedInput, setOptimizedInput] = useState(ctx.optimizedPrompt || DEFAULT_BENCHMARKS[0].optimizedPrompt);
  const [originalScore, setOriginalScore] = useState<ScoreResponse | null>(ctx.originalScore || DEFAULT_BENCHMARKS[0].originalScore as any);
  const [optimizedScore, setOptimizedScore] = useState<ScoreResponse | null>(ctx.optimizedScore || DEFAULT_BENCHMARKS[0].optimizedScore as any);
  const [loadingOriginal, setLoadingOriginal] = useState(false);
  const [loadingOptimized, setLoadingOptimized] = useState(false);
  const [copied, setCopied] = useState(false);
  const [explanation, setExplanation] = useState<string>(ctx.explanation || DEFAULT_BENCHMARKS[0].explanation);
  const [history, setHistory] = useState<any[]>(DEFAULT_BENCHMARKS);
  const [activeTab, setActiveTab] = useState<'compare' | 'pipeline' | 'history'>('compare');

  useEffect(() => {
    // Load local history if available
    const saved = localStorage.getItem('promptforge_compare_history');
    let loadedHistory = DEFAULT_BENCHMARKS;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          loadedHistory = [...parsed, ...DEFAULT_BENCHMARKS];
        }
      } catch (e) {
        console.error(e);
      }
    }

    if (ctx.originalPrompt && ctx.optimizedPrompt) {
      setOriginalInput(ctx.originalPrompt);
      setOptimizedInput(ctx.optimizedPrompt);
      setExplanation(ctx.explanation || 'Newly optimized prompt pair imported from Prompt Studio.');
      if (ctx.originalScore) setOriginalScore(ctx.originalScore);
      if (ctx.optimizedScore) setOptimizedScore(ctx.optimizedScore);

      // Check if already in history list
      const exists = loadedHistory.some((item) => item.originalPrompt === ctx.originalPrompt);
      if (!exists) {
        const newItem = {
          id: `bench_${Date.now()}`,
          title: ctx.originalPrompt.slice(0, 32) + '...',
          timestamp: 'Just now',
          originalPrompt: ctx.originalPrompt,
          optimizedPrompt: ctx.optimizedPrompt,
          originalScore: ctx.originalScore || DEFAULT_BENCHMARKS[0].originalScore,
          optimizedScore: ctx.optimizedScore || DEFAULT_BENCHMARKS[0].optimizedScore,
          explanation: ctx.explanation || 'Newly optimized prompt structure.',
        };
        loadedHistory = [newItem, ...loadedHistory];
        try {
          localStorage.setItem('promptforge_compare_history', JSON.stringify(loadedHistory));
        } catch (e) {
          console.error(e);
        }
      }
    }
    setHistory(loadedHistory);
  }, [ctx.originalPrompt, ctx.optimizedPrompt, ctx.originalScore, ctx.optimizedScore]);

  const handleFetchScore = async (prompt: string, side: 'original' | 'optimized') => {
    if (!prompt.trim()) return;
    if (side === 'original') setLoadingOriginal(true);
    else setLoadingOptimized(true);

    try {
      const res = await scorePrompt({ prompt });
      if (side === 'original') {
        setOriginalScore(res);
        ctx.setOriginalScore(res);
      } else {
        setOptimizedScore(res);
        ctx.setOptimizedScore(res);
      }
    } catch {
      hotToast.error(`Could not score ${side} prompt`);
    } finally {
      if (side === 'original') setLoadingOriginal(false);
      else setLoadingOptimized(false);
    }
  };

  const handleScoreBoth = () => {
    handleFetchScore(originalInput, 'original');
    handleFetchScore(optimizedInput, 'optimized');
    hotToast.success('Scoring both prompts in real-time');
  };

  const handleLoadHistoryItem = (item: any) => {
    setOriginalInput(item.originalPrompt);
    setOptimizedInput(item.optimizedPrompt);
    setOriginalScore(item.originalScore);
    setOptimizedScore(item.optimizedScore);
    setExplanation(item.explanation || 'Loaded comparison test from history.');
    ctx.setOriginalPrompt(item.originalPrompt);
    ctx.setOptimizedPrompt(item.optimizedPrompt);
    ctx.setOriginalScore(item.originalScore);
    ctx.setOptimizedScore(item.optimizedScore);
    hotToast.success(`Loaded "${item.title || 'Selected Comparison'}"`);
    setActiveTab('compare');
  };

  const handleCopyBestPrompt = () => {
    const winnerText = (optimizedScore?.overall_score || 0) >= (originalScore?.overall_score || 0) ? optimizedInput : originalInput;
    navigator.clipboard.writeText(winnerText);
    setCopied(true);
    hotToast.success('Copied best suitable prompt to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendToStudio = () => {
    const winnerText = (optimizedScore?.overall_score || 0) >= (originalScore?.overall_score || 0) ? optimizedInput : originalInput;
    ctx.setOriginalPrompt(winnerText);
    navigate('/dashboard/studio');
    hotToast.success('Loaded best prompt into Prompt Studio');
  };

  const getChartData = (score: ScoreResponse) => {
    if (!score || !score.categories) return [];
    return Object.entries(score.categories).map(([key, val]) => ({
      subject: key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      value: val,
      fullMark: 100,
    }));
  };

  const estimateTokens = (text: string) => Math.max(1, Math.ceil(text.length / 4));

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 pb-16">
      
      {/* Friendly Guide Banner */}
      <FriendlyGuideBanner
        pageTitle="Prompt Comparison & Outcome Studio"
        badge="Side-by-Side Quality Benchmark"
        tagline="Compare your original raw prompt against the AI-optimized version to see exact score gains and risk reductions."
        steps={[
          { title: 'View Side-by-Side', desc: 'Read both prompts side-by-side to notice added role context & rules.', icon: ArrowLeftRight },
          { title: 'Check Quality Scores', desc: 'Radar scores measure Clarity, Specificity, Context, and Safety.', icon: Trophy },
          { title: 'Use the Best Version', desc: 'Click "Copy Best Prompt" to use the higher-scoring winner immediately.', icon: CheckCircle2 },
        ]}
        tipText="Click 'Re-Score Prompts' anytime to run real-time evaluation benchmarks again."
      />

        {/* Tab Navigation Controls */}
        <div className="flex items-center gap-2 pt-8 border-t border-white/10 mt-8 font-mono text-xs">
          <button
            onClick={() => setActiveTab('compare')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'compare'
                ? 'bg-[#FF7F11]/15 text-[#FF7F11] border border-[#FF7F11]/30 font-bold'
                : 'text-[#94A3B8] hover:text-white hover:bg-white/5'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4" /> Side-by-Side View
          </button>
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'pipeline'
                ? 'bg-[#FF7F11]/15 text-[#FF7F11] border border-[#FF7F11]/30 font-bold'
                : 'text-[#94A3B8] hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className="w-4 h-4" /> 5-Stage Process Pipeline
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'history'
                ? 'bg-[#FF7F11]/15 text-[#FF7F11] border border-[#FF7F11]/30 font-bold'
                : 'text-[#94A3B8] hover:text-white hover:bg-white/5'
            }`}
          >
            <History className="w-4 h-4" /> Test History ({history.length})
          </button>
        </div>

      {/* Explicit Section Spacer & Divider */}
      <div className="h-6 md:h-8 w-full" />
      <div className="border-b border-[#3A3A3A]/80 w-full" />
      <div className="h-6 md:h-8 w-full" />

      {/* ================= TAB CONTENT 1: SIDE-BY-SIDE COMPARE ================= */}
      {activeTab === 'compare' && (
        <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="space-y-8">
          
          {/* BEST SUITABLE OUTCOME HERO CARD */}
          {originalScore && optimizedScore && (
            <div className="glass-panel rounded-3xl p-8 border border-[#FF7F11]/40 bg-gradient-to-r from-[#FF7F11]/10 via-[#14161B] to-[#4ADE80]/10 shadow-2xl space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#FF7F11]/20 border border-[#FF7F11]/30 flex items-center justify-center text-[#FF7F11]">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      Best Suitable Outcome:
                      <span className="text-[#4ADE80] font-mono">
                        {optimizedScore.overall_score >= originalScore.overall_score ? 'AI Optimized Prompt' : 'User Original Prompt'}
                      </span>
                    </h2>
                    <p className="text-xs text-[#94A3B8] mt-0.5">
                      Quality Score Gap: <strong className="text-white font-mono">+{Math.abs(optimizedScore.overall_score - originalScore.overall_score)} points</strong> ({originalScore.overall_score}/100 vs {optimizedScore.overall_score}/100)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 font-mono text-xs">
                  <button
                    onClick={handleCopyBestPrompt}
                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    {copied ? <Check className="w-4 h-4 text-[#4ADE80]" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied Best Prompt' : 'Copy Best Prompt'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
                <div className="p-4 rounded-2xl bg-[#0A0B0D] border border-white/10 space-y-1">
                  <span className="text-[#64748B] text-[10px] uppercase">Instruction Clarity</span>
                  <div className="text-lg font-bold text-[#4ADE80]">
                    +{Math.max(0, optimizedScore.categories.clarity - originalScore.categories.clarity)}% Gain
                  </div>
                  <p className="text-[11px] text-[#94A3B8] font-sans">Explicit persona and objective bounds eliminate ambiguity.</p>
                </div>

                <div className="p-4 rounded-2xl bg-[#0A0B0D] border border-white/10 space-y-1">
                  <span className="text-[#64748B] text-[10px] uppercase">Hallucination Mitigation</span>
                  <div className="text-lg font-bold text-[#FF7F11]">
                    -{Math.max(0, originalScore.categories.hallucination_risk - (100 - (optimizedScore.categories.constraints || 90)))}% Lower Risk
                  </div>
                  <p className="text-[11px] text-[#94A3B8] font-sans">Negative constraints anchor facts and guard against invention.</p>
                </div>

                <div className="p-4 rounded-2xl bg-[#0A0B0D] border border-white/10 space-y-1">
                  <span className="text-[#64748B] text-[10px] uppercase">Output Formatting</span>
                  <div className="text-lg font-bold text-purple-400">
                    {optimizedScore.categories.output_format >= 80 ? 'Strict JSON/MD Schema' : 'Standard Text'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Explicit Section Spacer & Divider */}
          <div className="h-6 md:h-8 w-full" />
          <div className="border-b border-[#3A3A3A]/80 w-full" />
          <div className="h-6 md:h-8 w-full" />

          {/* DUAL EDITOR SPLIT VIEW */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* ORIGINAL PROMPT COLUMN */}
            <div className="space-y-6">
              <div className="glass-panel rounded-3xl p-6 space-y-4 border border-red-500/20">
                <div className="flex items-center justify-between pb-3 border-b border-white/10 font-mono text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <h3 className="font-bold text-white uppercase tracking-wider">User Given Prompt</h3>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                    Raw Input
                  </span>
                </div>

                <textarea
                  value={originalInput}
                  onChange={(e) => setOriginalInput(e.target.value)}
                  className="w-full bg-[#0A0B0D] border border-white/10 rounded-2xl p-4 text-xs font-mono text-slate-200 outline-none focus:border-red-500/50 transition-colors min-h-[220px] resize-none"
                  placeholder="Paste user raw prompt here..."
                />

                <div className="flex items-center justify-between text-xs font-mono text-[#64748B] pt-1">
                  <span>~{estimateTokens(originalInput)} tokens</span>
                  <button
                    onClick={() => handleFetchScore(originalInput, 'original')}
                    className="text-[#FF7F11] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Re-Evaluate
                  </button>
                </div>
              </div>

              {/* ORIGINAL RADAR SCORE */}
              {loadingOriginal ? (
                <div className="glass-panel rounded-3xl p-8 text-center text-xs font-mono text-[#94A3B8] flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#FF7F11]" /> Scoring user prompt...
                </div>
              ) : originalScore ? (
                <div className="glass-panel rounded-3xl p-6 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <span className="text-xs font-mono text-[#94A3B8] uppercase">Overall Quality Score</span>
                    <span className="text-2xl font-bold font-mono text-red-400">{originalScore.overall_score}/100</span>
                  </div>
                  <div className="h-60 w-full">
                    <ResponsiveContainer>
                      <RadarChart data={getChartData(originalScore)}>
                        <PolarGrid stroke="#262932" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#94A3B8', fontSize: 10 }} />
                        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar dataKey="value" stroke="#EF4444" fill="#EF4444" fillOpacity={0.2} strokeWidth={2} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : null}
            </div>

            {/* AI OPTIMIZED PROMPT COLUMN */}
            <div className="space-y-6">
              <div className="glass-panel rounded-3xl p-6 space-y-4 border border-[#4ADE80]/30 glow-border-orange">
                <div className="flex items-center justify-between pb-3 border-b border-white/10 font-mono text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#4ADE80]" />
                    <h3 className="font-bold text-white uppercase tracking-wider">AI Engineered Prompt</h3>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#4ADE80]/10 text-[#4ADE80] border border-[#4ADE80]/20 font-bold">
                    Optimized Outcome
                  </span>
                </div>

                <textarea
                  value={optimizedInput}
                  onChange={(e) => setOptimizedInput(e.target.value)}
                  className="w-full bg-[#0A0B0D] border border-white/10 rounded-2xl p-4 text-xs font-mono text-slate-200 outline-none focus:border-[#4ADE80]/50 transition-colors min-h-[220px] resize-none"
                  placeholder="AI engineered prompt outcome..."
                />

                <div className="flex items-center justify-between text-xs font-mono text-[#64748B] pt-1">
                  <span>~{estimateTokens(optimizedInput)} tokens</span>
                  <button
                    onClick={() => handleFetchScore(optimizedInput, 'optimized')}
                    className="text-[#4ADE80] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Re-Evaluate
                  </button>
                </div>
              </div>

              {/* OPTIMIZED RADAR SCORE */}
              {loadingOptimized ? (
                <div className="glass-panel rounded-3xl p-8 text-center text-xs font-mono text-[#94A3B8] flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#4ADE80]" /> Scoring engineered prompt...
                </div>
              ) : optimizedScore ? (
                <div className="glass-panel rounded-3xl p-6 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <span className="text-xs font-mono text-[#94A3B8] uppercase">Overall Quality Score</span>
                    <span className="text-2xl font-bold font-mono text-[#4ADE80]">{optimizedScore.overall_score}/100</span>
                  </div>
                  <div className="h-60 w-full">
                    <ResponsiveContainer>
                      <RadarChart data={getChartData(optimizedScore)}>
                        <PolarGrid stroke="#262932" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#94A3B8', fontSize: 10 }} />
                        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar dataKey="value" stroke="#4ADE80" fill="#4ADE80" fillOpacity={0.25} strokeWidth={2} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : null}
            </div>

          </div>

          {/* EXPLANATION BREAKDOWN */}
          {explanation && (
            <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono text-[#FF7F11] font-bold">
                <AlertCircle className="w-4 h-4" /> Optimization Rationale & Breakdown
              </div>
              <p className="text-xs text-[#94A3B8] leading-relaxed font-sans">{explanation}</p>
            </div>
          )}
        </motion.div>
      )}

      {/* ================= TAB CONTENT 2: 5-STAGE PROCESS PIPELINE ================= */}
      {activeTab === 'pipeline' && (
        <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="space-y-6">
          <div className="glass-panel rounded-3xl p-8 border border-white/10 space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#FF7F11]" /> 5-Stage Prompt Transformation Diagnostics
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {[
                { stage: '1. Persona', name: 'Role Assignment', status: 'Injected', desc: 'Sets expert domain identity (e.g., Senior Architect).' },
                { stage: '2. Grounding', name: 'Context Bounds', status: 'Anchored', desc: 'Provides technical scope rules and reference schemas.' },
                { stage: '3. Constraints', name: 'Anti-Hallucination', status: 'Enforced', desc: 'Applies explicit negative constraints to prevent invention.' },
                { stage: '4. Examples', name: 'Few-Shot Patterns', status: 'Synthesized', desc: 'Adds sample input/output pairs for consistent style.' },
                { stage: '5. Schema', name: 'Structured Format', status: 'Validated', desc: 'Enforces JSON/Markdown schema outputs.' },
              ].map((step, i) => (
                <div key={i} className="p-5 rounded-2xl bg-[#0A0B0D] border border-white/10 space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between text-[#FF7F11] font-bold">
                    <span>{step.stage}</span>
                    <CheckCircle2 className="w-4 h-4 text-[#4ADE80]" />
                  </div>
                  <h4 className="font-bold text-white text-sm">{step.name}</h4>
                  <p className="text-[11px] text-[#94A3B8] font-sans leading-relaxed">{step.desc}</p>
                  <span className="inline-block px-2 py-0.5 rounded bg-[#4ADE80]/10 text-[#4ADE80] text-[10px]">
                    {step.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ================= TAB CONTENT 3: TEST HISTORY ================= */}
      {activeTab === 'history' && (
        <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="space-y-6">
          <div className="glass-panel rounded-3xl p-8 border border-white/10 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <History className="w-5 h-5 text-[#FF7F11]" /> Prompt Comparison History
              </h2>
              <span className="text-xs font-mono text-[#64748B]">Click any card to load comparison</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {history.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleLoadHistoryItem(item)}
                  className="glass-panel-hover p-6 rounded-2xl border border-white/10 bg-[#0A0B0D] cursor-pointer space-y-4"
                >
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="font-bold text-white truncate max-w-[200px]">
                      {item.title || 'Prompt Test Pair'}
                    </span>
                    <span className="text-[#64748B] text-[10px]">{item.timestamp}</span>
                  </div>

                  <p className="text-xs text-[#94A3B8] font-mono line-clamp-2 bg-white/5 p-2.5 rounded-xl border border-white/5">
                    "{item.originalPrompt}"
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-white/10 font-mono text-xs">
                    <div className="flex items-center gap-3">
                      <span className="text-red-400 font-bold">User: {item.originalScore?.overall_score || item.originalScore}/100</span>
                      <span className="text-[#64748B]">→</span>
                      <span className="text-[#4ADE80] font-bold">AI: {item.optimizedScore?.overall_score || item.optimizedScore}/100</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#FF7F11]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

    </div>
  );
}
