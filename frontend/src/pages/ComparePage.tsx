import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeftRight, Loader2, AlertCircle, Clock
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import { scorePrompt } from '@/services/api';
import { usePromptContext } from '@/context/PromptContext';
import { estimateTokens, estimateCost } from '@/utils';
import { pageTransition, fadeInUp } from '@/animations/variants';
import type { ScoreResponse } from '@/types';
import { EmptyState } from '@/components/common/EmptyState';

// Pre-scored high-quality benchmark runs to prevent empty page feel and allow quick interaction
const RECENT_COMPARISONS = [
  {
    id: 'rc-1',
    title: 'Python PDF Text Parser',
    category: 'Coding Assistance',
    originalPrompt: 'fix my python pdf script',
    optimizedPrompt: 'You are a senior Python architect. Write a modular BeautifulSoup & PyPDF2 script to extract text and tables from PDF documents. Include exponential backoff retries, JSON serialization, and unit tests.',
    originalScore: {
      overall_score: 42,
      categories: {
        clarity: 45,
        specificity: 30,
        context: 35,
        output_format: 50,
        constraints: 30,
        examples: 10,
        prompt_complexity: 80,
        hallucination_risk: 70
      },
      suggestions: ['Define a systematic persona', 'Specify exact libraries permitted', 'Integrate error handling output standard']
    },
    optimizedScore: {
      overall_score: 93,
      categories: {
        clarity: 92,
        specificity: 95,
        context: 90,
        output_format: 95,
        constraints: 92,
        examples: 85,
        prompt_complexity: 94,
        hallucination_risk: 15
      },
      suggestions: ['Excellent structure & context scope']
    },
    explanation: 'Systematically rewrote the instruction to declare a Senior Python Architect persona, defined precise libraries (PyPDF2, bs4), detailed precise exception handling, and standard serialization criteria.'
  },
  {
    id: 'rc-2',
    title: 'SQL Monthly Aggregates & Indexing',
    category: 'PostgreSQL optimization',
    originalPrompt: 'optimize SELECT * FROM orders JOIN users',
    optimizedPrompt: 'You are a PostgreSQL DBA. Analyze indexing strategies and rewrite this query calculating monthly order count and revenue per user for Q3 2026. Return results ordered by total spend with EXPLAIN ANALYZE.',
    originalScore: {
      overall_score: 51,
      categories: {
        clarity: 50,
        specificity: 40,
        context: 45,
        output_format: 60,
        constraints: 40,
        examples: 0,
        prompt_complexity: 75,
        hallucination_risk: 60
      },
      suggestions: ['Specify indexing requirement', 'Specify database engine (Postgres/MySQL)']
    },
    optimizedScore: {
      overall_score: 89,
      categories: {
        clarity: 88,
        specificity: 92,
        context: 80,
        output_format: 90,
        constraints: 88,
        examples: 80,
        prompt_complexity: 90,
        hallucination_risk: 20
      },
      suggestions: ['Good database dialect constraints']
    },
    explanation: 'Created targeted DBA instructions restricting query criteria to monthly aggregations, added index-related specifications, and requested SQL EXPLAIN performance tips.'
  },
  {
    id: 'rc-3',
    title: 'SaaS Product Launch Email Sequence',
    category: 'Marketing Copywriting',
    originalPrompt: 'write product launch email helper',
    optimizedPrompt: 'You are a SaaS Copywriter. Write a 3-part product launch email drip sequence targeting software developers. Include high-converting subject line options, social proof hooks, and clear action items.',
    originalScore: {
      overall_score: 38,
      categories: {
        clarity: 35,
        specificity: 25,
        context: 35,
        output_format: 40,
        constraints: 20,
        examples: 0,
        prompt_complexity: 85,
        hallucination_risk: 75
      },
      suggestions: ['Identify target segment', 'Adopt a structured copywriting framework']
    },
    optimizedScore: {
      overall_score: 95,
      categories: {
        clarity: 95,
        specificity: 98,
        context: 90,
        output_format: 95,
        constraints: 90,
        examples: 90,
        prompt_complexity: 94,
        hallucination_risk: 10
      },
      suggestions: ['Excellent marketing sequence structure']
    },
    explanation: 'Re-framed context for SaaS copywriter to build a 3-step sequences, targeted developer segments specifically, optimized metrics, and enforced length limits.'
  }
];

export default function ComparePage() {
  const ctx = usePromptContext();
  const [originalInput, setOriginalInput] = useState(ctx.originalPrompt);
  const [optimizedInput, setOptimizedInput] = useState(ctx.optimizedPrompt);
  const [originalScore, setOriginalScore] = useState<ScoreResponse | null>(ctx.originalScore);
  const [optimizedScore, setOptimizedScore] = useState<ScoreResponse | null>(ctx.optimizedScore);
  const [loadingOriginal, setLoadingOriginal] = useState(false);
  const [loadingOptimized, setLoadingOptimized] = useState(false);
  const [localExplanation, setLocalExplanation] = useState<string | null>(null);

  // Sync explanation from context
  useEffect(() => {
    if (ctx.explanation) {
      setLocalExplanation(ctx.explanation);
    }
  }, [ctx.explanation]);

  // Auto-score when both prompts are present and scores are missing
  useEffect(() => {
    if (ctx.originalPrompt && !originalScore) {
      fetchScore(ctx.originalPrompt, 'original');
    }
    if (ctx.optimizedPrompt && !optimizedScore) {
      fetchScore(ctx.optimizedPrompt, 'optimized');
    }
  }, []);

  const fetchScore = async (prompt: string, side: 'original' | 'optimized') => {
    if (!prompt.trim()) return;
    if (side === 'original') setLoadingOriginal(true);
    else setLoadingOptimized(true);

    try {
      const result = await scorePrompt({ prompt });
      if (side === 'original') {
        setOriginalScore(result);
        ctx.setOriginalScore(result);
      } else {
        setOptimizedScore(result);
        ctx.setOptimizedScore(result);
      }
    } catch {
      toast.error(`Failed to score ${side} prompt`);
    } finally {
      if (side === 'original') setLoadingOriginal(false);
      else setLoadingOptimized(false);
    }
  };

  const handleScoreBoth = () => {
    fetchScore(originalInput, 'original');
    fetchScore(optimizedInput, 'optimized');
  };

  const getChartData = (score: ScoreResponse) =>
    Object.entries(score.categories).map(([key, value]) => ({
      subject: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value,
      fullMark: 100,
    }));

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#4ADE80';
    if (score >= 60) return '#FACC15';
    if (score >= 40) return '#FF7F11';
    return '#EF4444';
  };

  const handleLoadBenchmark = (comp: typeof RECENT_COMPARISONS[0]) => {
    setOriginalInput(comp.originalPrompt);
    setOptimizedInput(comp.optimizedPrompt);
    setOriginalScore(comp.originalScore);
    setOptimizedScore(comp.optimizedScore);
    setLocalExplanation(comp.explanation);

    // Sync back to state context
    ctx.setOriginalPrompt(comp.originalPrompt);
    ctx.setOptimizedPrompt(comp.optimizedPrompt);
    ctx.setOriginalScore(comp.originalScore);
    ctx.setOptimizedScore(comp.optimizedScore);
    ctx.setExplanation(comp.explanation);

    toast.success(`Loaded "${comp.title}" benchmark suite`);
  };

  const hasData = originalInput.trim() || optimizedInput.trim();

  return (
    <motion.div
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="w-full max-w-7xl mx-auto flex flex-col gap-8 md:gap-12 pb-16"
    >
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-8 p-8 md:p-10 rounded-3xl border border-[#3A3A3A] bg-gradient-to-r from-[#262626] via-[#2E2E2E] to-[#262626] shadow-2xl">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Side-by-Side Prompt Comparison
          </h1>
          <p className="text-sm text-[#A3A3A3] font-sans leading-relaxed">
            Compare original raw instructions against optimized prompts with live radar scoring.
          </p>
        </div>
        {hasData && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setOriginalInput('');
                setOptimizedInput('');
                setOriginalScore(null);
                setOptimizedScore(null);
                setLocalExplanation(null);
                ctx.setOriginalPrompt('');
                ctx.setOptimizedPrompt('');
                ctx.setOriginalScore(null);
                ctx.setOptimizedScore(null);
                ctx.setExplanation('');
              }}
              className="px-5 py-3 rounded-2xl text-xs font-bold font-mono bg-white/5 hover:bg-white/10 text-slate-300 border border-[#3A3A3A] transition-all cursor-pointer"
            >
              Clear Comparison
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleScoreBoth}
              disabled={loadingOriginal || loadingOptimized}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold font-mono cursor-pointer disabled:opacity-50 shadow-xl border-none bg-[#FF7F11] text-[#0A0A0A]"
            >
              {(loadingOriginal || loadingOptimized) ? <Loader2 size={14} className="animate-spin" /> : <ArrowLeftRight size={14} />}
              Score Both Prompts
            </motion.button>
          </div>
        )}
      </div>

      {!hasData ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Lighter, Left-aligned EmptyState Container */}
          <div className="lg:col-span-7">
            <EmptyState
              align="left"
              icon={ArrowLeftRight}
              title="Compare Optimized Outputs"
              description="Analyze original raw system guidelines side-by-side with your engineered output. Measure token density, scoring breakdowns, and optimization improvements immediately."
              samplePrompts={[
                {
                  title: 'Load Code Optimizer View',
                  prompt: 'rc-1',
                  onClick: () => handleLoadBenchmark(RECENT_COMPARISONS[0]),
                },
                {
                  title: 'Load RAG Prompt View',
                  prompt: 'rc-2',
                  onClick: () => handleLoadBenchmark(RECENT_COMPARISONS[1]),
                },
              ]}
            />
          </div>

          {/* Right Column: Pre-scored Benchmarks quick actions */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl border border-[#3A3A3A] bg-[#262626] p-6 md:p-8 space-y-6 shadow-xl">
              <div>
                <h3 className="text-sm font-bold text-[#F5F5F5] flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#FF7F11]" /> Pre-Scored Benchmarks
                </h3>
                <p className="text-xs text-[#737373] mt-0.5">Quick-load sample runs with pre-measured metrics</p>
              </div>

              <div className="space-y-3">
                {RECENT_COMPARISONS.map((comp) => (
                  <button
                    key={comp.id}
                    onClick={() => handleLoadBenchmark(comp)}
                    className="w-full text-left p-4 rounded-2xl border border-[#3A3A3A] bg-[#0A0A0A] hover:border-[#FF7F11]/40 hover:bg-[#2E2E2E] transition-all flex flex-col justify-between gap-3 text-xs font-mono group cursor-pointer"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="px-2.5 py-1 rounded-lg border text-[10px] font-bold bg-white/10 text-white/80 border-white/20 uppercase">
                        {comp.category}
                      </span>
                      <span className="text-[10px] text-[#737373] px-2 py-0.5 rounded bg-white/5 border border-[#3A3A3A]">
                        Score: {comp.optimizedScore.overall_score}/100
                      </span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[#F5F5F5] font-semibold block transition-colors group-hover:text-[#FF7F11]">
                        {comp.title}
                      </span>
                      <span className="text-[#737373] block text-[11px] truncate">
                        Original: "{comp.originalPrompt}"
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10">
          {/* Original Side */}
          <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="flex flex-col gap-6">
            <div className="rounded-3xl border border-[#3A3A3A] bg-[#262626]/90 p-6 md:p-8 space-y-4 shadow-xl">
              <div className="flex items-center gap-2 pb-2 border-b border-[#3A3A3A] font-mono text-xs">
                <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
                <h3 className="font-bold text-white uppercase tracking-wider">Original Prompt</h3>
              </div>
              <textarea
                value={originalInput}
                onChange={(e) => setOriginalInput(e.target.value)}
                className="w-full rounded-2xl p-4 text-xs leading-relaxed resize-none outline-none font-mono bg-[#0A0A0A] border border-[#3A3A3A] text-slate-200 min-h-[160px]"
              />
              <div className="flex items-center justify-between pt-2 text-xs font-mono text-slate-400">
                <span>~{estimateTokens(originalInput)} tokens</span>
                <span>Est. cost: {estimateCost(estimateTokens(originalInput))}</span>
              </div>
            </div>

            {/* Original Score */}
            {loadingOriginal ? (
              <div className="rounded-3xl border border-[#3A3A3A] bg-[#262626]/90 p-8 flex items-center justify-center font-mono text-xs text-slate-400 shadow-xl">
                <Loader2 size={18} className="animate-spin text-[#FF7F11] mr-2" /> Scoring original...
              </div>
            ) : originalScore ? (
              <div className="rounded-3xl border border-[#3A3A3A] bg-[#262626]/90 p-6 md:p-8 space-y-4 shadow-xl">
                <div className="flex items-center gap-3 pb-2 border-b border-[#3A3A3A] font-mono">
                  <div className="text-3xl font-extrabold" style={{ color: getScoreColor(originalScore.overall_score) }}>
                    {originalScore.overall_score}
                  </div>
                  <span className="text-xs text-slate-500">/100</span>
                </div>
                <div className="h-52 w-full">
                  <ResponsiveContainer>
                    <RadarChart data={getChartData(originalScore)}>
                      <PolarGrid stroke="#3A3A3A" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#A3A3A3', fontSize: 9 }} />
                      <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar dataKey="value" stroke="#EF4444" fill="#EF4444" fillOpacity={0.15} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : null}
          </motion.div>

          {/* Optimized Side */}
          <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="flex flex-col gap-6" transition={{ delay: 0.1 }}>
            <div className="rounded-3xl border border-[#3A3A3A] bg-[#262626]/90 p-6 md:p-8 space-y-4 shadow-xl">
              <div className="flex items-center gap-2 pb-2 border-b border-[#3A3A3A] font-mono text-xs">
                <div className="w-2.5 h-2.5 rounded-full bg-[#4ADE80]" />
                <h3 className="font-bold text-white uppercase tracking-wider">Optimized Prompt</h3>
              </div>
              <textarea
                value={optimizedInput}
                onChange={(e) => setOptimizedInput(e.target.value)}
                className="w-full rounded-2xl p-4 text-xs leading-relaxed resize-none outline-none font-mono bg-[#0A0A0A] border border-[#3A3A3A] text-slate-200 min-h-[160px]"
              />
              <div className="flex items-center justify-between pt-2 text-xs font-mono text-slate-400">
                <span>~{estimateTokens(optimizedInput)} tokens</span>
                <span>Est. cost: {estimateCost(estimateTokens(optimizedInput))}</span>
              </div>
            </div>

            {/* Optimized Score */}
            {loadingOptimized ? (
              <div className="rounded-3xl border border-[#3A3A3A] bg-[#262626]/90 p-8 flex items-center justify-center font-mono text-xs text-slate-400 shadow-xl">
                <Loader2 size={18} className="animate-spin text-[#FF7F11] mr-2" /> Scoring optimized...
              </div>
            ) : optimizedScore ? (
              <div className="rounded-3xl border border-[#3A3A3A] bg-[#262626]/90 p-6 md:p-8 space-y-4 shadow-xl">
                <div className="flex items-center gap-3 pb-2 border-b border-[#3A3A3A] font-mono">
                  <div className="text-3xl font-extrabold" style={{ color: getScoreColor(optimizedScore.overall_score) }}>
                    {optimizedScore.overall_score}
                  </div>
                  <span className="text-xs text-slate-500">/100</span>
                  {originalScore && (
                    <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full border ${
                      optimizedScore.overall_score > originalScore.overall_score ? 'bg-emerald-500/15 text-[#4ADE80] border-emerald-500/30' : 'bg-red-500/15 text-red-500 border-red-500/30'
                    }`}>
                      {optimizedScore.overall_score > originalScore.overall_score ? '+' : ''}{optimizedScore.overall_score - originalScore.overall_score} pts
                    </span>
                  )}
                </div>
                <div className="h-52 w-full">
                  <ResponsiveContainer>
                    <RadarChart data={getChartData(optimizedScore)}>
                      <PolarGrid stroke="#3A3A3A" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#A3A3A3', fontSize: 9 }} />
                      <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar dataKey="value" stroke="#4ADE80" fill="#4ADE80" fillOpacity={0.15} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : null}
          </motion.div>
        </div>
      )}

      {/* Improvement Summary */}
      {localExplanation && (
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="rounded-3xl border border-[#3A3A3A] bg-[#262626]/90 p-6 md:p-8 space-y-3 shadow-xl"
        >
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="text-[#FF7F11] shrink-0 mt-0.5" />
            <div>
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">Optimization Breakdown</h3>
              <p className="text-xs text-[#A3A3A3] leading-relaxed font-sans mt-1">{localExplanation}</p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
