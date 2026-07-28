import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Wand2, BarChart3, ArrowLeftRight, Copy, Trash2, Check, ChevronDown, Loader2, Bookmark, History, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import { optimizePrompt, scorePrompt, convertPrompt, testPrompt, savePrompt } from '@/services/api';
import { usePromptContext } from '@/context/PromptContext';
import { estimateTokens, copyToClipboard, PATTERN_LABELS } from '@/utils';
import { pageTransition, fadeInUp } from '@/animations/variants';
import type { OptimizeResponse, ScoreResponse, ConvertResponse, TestResponse, PatternType } from '@/types';
import { EmptyState } from '@/components/common/EmptyState';
import { PromptVersionHistoryDrawer } from '@/components/prompts/PromptVersionHistoryDrawer';
import { FriendlyGuideBanner } from '@/components/common/FriendlyGuideBanner';

type ResultType = 'optimize' | 'score' | 'convert' | 'test' | null;

export default function PromptStudioPage() {
  const navigate = useNavigate();
  const promptCtx = usePromptContext();
  const [prompt, setPrompt] = useState(promptCtx.originalPrompt || '');
  const [loading, setLoading] = useState(false);
  const [activeAction, setActiveAction] = useState<ResultType>(null);
  const [optimizeResult, setOptimizeResult] = useState<OptimizeResponse | null>(null);
  const [scoreResult, setScoreResult] = useState<ScoreResponse | null>(null);
  const [convertResult, setConvertResult] = useState<ConvertResponse | null>(null);
  const [testResult, setTestResult] = useState<TestResponse | null>(null);
  const [selectedPattern, setSelectedPattern] = useState<PatternType>('chain_of_thought');
  const [showPatternDropdown, setShowPatternDropdown] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [saveCategory, setSaveCategory] = useState('Other');
  const [showVersionDrawer, setShowVersionDrawer] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync prompt when context changes
  useEffect(() => {
    if (promptCtx.originalPrompt) {
      setPrompt(promptCtx.originalPrompt);
    }
  }, [promptCtx.originalPrompt]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.max(160, textareaRef.current.scrollHeight) + 'px';
    }
  }, [prompt]);

  const handleOptimize = async () => {
    if (!prompt.trim()) return toast.error('Please enter a prompt first');
    setLoading(true);
    setActiveAction('optimize');
    try {
      const result = await optimizePrompt({ prompt });
      setOptimizeResult(result);
      promptCtx.setOriginalPrompt(prompt);
      promptCtx.setOptimizedPrompt(result.optimized_prompt);
      promptCtx.setExplanation(result.explanation);
      promptCtx.saveCompareItem({
        title: prompt.slice(0, 35) + '...',
        originalPrompt: prompt,
        optimizedPrompt: result.optimized_prompt,
        explanation: result.explanation,
      });
      toast.success('Prompt optimized & auto-saved to Compare Studio!');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Optimization failed. Please try again.');
      setActiveAction(null);
    } finally {
      setLoading(false);
    }
  };

  const handleScore = async () => {
    if (!prompt.trim()) return toast.error('Please enter a prompt first');
    setLoading(true);
    setActiveAction('score');
    try {
      const result = await scorePrompt({ prompt });
      setScoreResult(result);
      toast.success('Prompt scored successfully!');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Scoring failed. Please try again.');
      setActiveAction(null);
    } finally {
      setLoading(false);
    }
  };

  const handleConvert = async () => {
    if (!prompt.trim()) return toast.error('Please enter a prompt first');
    setLoading(true);
    setActiveAction('convert');
    try {
      const result = await convertPrompt({ prompt, target_pattern: selectedPattern });
      setConvertResult(result);
      toast.success('Prompt converted successfully!');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Conversion failed. Please try again.');
      setActiveAction(null);
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    if (!prompt.trim()) return toast.error('Please enter a prompt first');
    setLoading(true);
    setActiveAction('test');
    try {
      const result = await testPrompt({ prompt });
      setTestResult(result);
      toast.success('Prompt tested against AI model!');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Testing failed. Please try again.');
      setActiveAction(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string) => {
    await copyToClipboard(text);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    if (!saveTitle.trim()) return toast.error('Please enter a title');
    const textToSave = optimizeResult?.optimized_prompt || convertResult?.converted_prompt || prompt;
    try {
      await savePrompt({ title: saveTitle, prompt_text: textToSave, category: saveCategory });
      toast.success('Saved to library!');
      setShowSaveModal(false);
      setSaveTitle('');
    } catch (err: any) {
      toast.error('Failed to save. Please try again.');
    }
  };

  const handleClear = () => {
    setPrompt('');
    promptCtx.setOriginalPrompt('');
    setOptimizeResult(null);
    setScoreResult(null);
    setConvertResult(null);
    setTestResult(null);
    setActiveAction(null);
  };

  const tokenCount = estimateTokens(prompt);

  const getScoreChartData = (score: ScoreResponse) => {
    return Object.entries(score.categories).map(([key, value]) => ({
      subject: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value,
      fullMark: 100,
    }));
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#4ADE80';
    if (score >= 60) return '#FACC15';
    if (score >= 40) return '#FF7F11';
    return '#EF4444';
  };

  return (
    <motion.div
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="space-y-12 pb-24 w-full"
    >
      {/* Friendly Onboarding Guide Header Banner */}
      <FriendlyGuideBanner
        pageTitle="Prompt Engineering Studio"
        badge="Simple & Intuitive AI Optimizer"
        tagline="Transform simple thoughts into high-precision, production-grade AI instructions in seconds."
        steps={[
          { title: 'Type Your Idea', desc: 'Write your prompt in plain English—no technical syntax needed.', icon: Wand2 },
          { title: 'Click Optimize', desc: 'Our AI automatically adds structure, role persona, and safety guardrails.', icon: Play },
          { title: 'Test & Compare', desc: 'Review score improvements instantly and send the best prompt to Compare Studio.', icon: ArrowLeftRight },
        ]}
        tipText="You can also click 'Convert' to adapt your prompt into Chain-of-Thought, Few-Shot, or ReAct styles."
      />

      {/* Explicit Section Spacer & Divider */}
      <div className="h-6 md:h-8 w-full" />
      <div className="border-b border-[#3A3A3A]/80 w-full" />
      <div className="h-6 md:h-8 w-full" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10 items-start">
        {/* Left Column: Editor & Actions */}
        <div className="flex flex-col gap-6">
          {/* Prompt Editor Card */}
          <div className="rounded-3xl border border-[#3A3A3A] bg-[#262626]/90 p-7 md:p-8 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#3A3A3A]">
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#A3A3A3]">Your Prompt Input</label>
              <div className="flex items-center gap-3 text-xs font-mono text-[#737373]">
                <span>{prompt.length} chars</span>
                <span>~{tokenCount} tokens</span>
              </div>
            </div>
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your prompt here... &#10;&#10;Example: Write a Python script that parses PDF files into structured dataframes."
              className="w-full rounded-2xl p-5 text-xs leading-relaxed resize-none outline-none font-mono bg-[#0A0A0A] border border-[#3A3A3A] text-slate-200 focus:border-[#FF7F11] transition-all min-h-[200px]"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleOptimize}
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-xs bg-[#FF7F11] text-[#0A0A0A] cursor-pointer disabled:opacity-50 shadow-xl border-none"
            >
              {loading && activeAction === 'optimize' ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
              Optimize
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleScore}
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-xs cursor-pointer disabled:opacity-50 border border-white/20 bg-white/10 text-white/90 shadow-lg"
            >
              {loading && activeAction === 'score' ? <Loader2 size={16} className="animate-spin" /> : <BarChart3 size={16} />}
              Score
            </motion.button>

            {/* Convert Dropdown */}
            <div className="relative">
              <div className="flex">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleConvert}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-5 py-3.5 rounded-l-2xl font-bold text-xs cursor-pointer disabled:opacity-50 border border-purple-500/30 bg-purple-500/10 text-purple-300 shadow-lg"
                >
                  {loading && activeAction === 'convert' ? <Loader2 size={16} className="animate-spin" /> : <ArrowLeftRight size={16} />}
                  Convert
                </motion.button>
                <button
                  onClick={() => setShowPatternDropdown(!showPatternDropdown)}
                  className="px-3 py-3.5 rounded-r-2xl cursor-pointer border border-l-0 border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20"
                >
                  <ChevronDown size={14} />
                </button>
              </div>

              <AnimatePresence>
                {showPatternDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="absolute top-14 left-0 z-20 rounded-2xl border border-[#3A3A3A] bg-[#262626] py-2 min-w-[220px] shadow-2xl font-mono text-xs"
                  >
                    {Object.entries(PATTERN_LABELS).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => {
                          setSelectedPattern(key as PatternType);
                          setShowPatternDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 hover:bg-white/10 transition-colors cursor-pointer ${
                          selectedPattern === key ? 'text-[#FF7F11] font-bold bg-[#FF7F11]/10' : 'text-slate-300'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleTest}
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-xs cursor-pointer disabled:opacity-50 border border-[#4ADE80]/30 bg-[#4ADE80]/10 text-[#4ADE80] shadow-lg"
            >
              {loading && activeAction === 'test' ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
              Test Run
            </motion.button>

            <button
              onClick={handleClear}
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl font-bold text-xs cursor-pointer border border-[#3A3A3A] bg-white/5 text-[#737373] hover:text-white"
            >
              <Trash2 size={14} />
              Clear
            </button>

            <button
              onClick={() => setShowVersionDrawer(true)}
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl font-bold text-xs cursor-pointer border border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 shadow-lg"
            >
              <History size={14} />
              Version History
            </button>
          </div>

          <PromptVersionHistoryDrawer
            isOpen={showVersionDrawer}
            onClose={() => setShowVersionDrawer(false)}
            promptId="active_prompt_1"
            currentPromptText={prompt}
            onRestore={(restoredText) => setPrompt(restoredText)}
          />
        </div>

        {/* Right Column: Output Results */}
        <div className="flex flex-col gap-6">
          <AnimatePresence mode="wait">
            {/* Loading State */}
            {loading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="rounded-3xl border border-[#3A3A3A] bg-[#262626]/90 p-8 flex flex-col items-center justify-center min-h-[320px] shadow-2xl"
              >
                <Loader2 size={28} className="animate-spin text-[#FF7F11] mb-3" />
                <p className="text-xs font-mono text-[#A3A3A3]">Analyzing & Processing Prompt...</p>
              </motion.div>
            )}

            {/* Empty State */}
            {!loading && !activeAction && (
              <EmptyState
                align="left"
                icon={Wand2}
                title="Ready for Prompt Engineering"
                description="Enter a prompt on the left and select an AI action: Optimize structure, Score quality, Convert pattern, or Test live LLM generation."
                samplePrompts={[
                  {
                    title: 'Coding Assistant',
                    prompt: 'Write a Python script to extract tables from PDF files, convert them to pandas DataFrame, and export to CSV.',
                    onClick: (text) => setPrompt(text),
                  },
                  {
                    title: 'SQL Optimizer',
                    prompt: 'Optimize this SQL query joining three large tables with indexing recommendations: SELECT * FROM orders JOIN users...',
                    onClick: (text) => setPrompt(text),
                  },
                  {
                    title: 'RAG Pipeline System Prompt',
                    prompt: 'You are an enterprise AI context agent. Answer user questions using only the provided context chunks with citations.',
                    onClick: (text) => setPrompt(text),
                  },
                ]}
              />
            )}

            {/* Optimize Result */}
            {!loading && activeAction === 'optimize' && optimizeResult && (
              <motion.div
                key="optimize"
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                className="space-y-6"
              >
                <div className="rounded-3xl border border-[#3A3A3A] bg-[#262626]/90 p-7 md:p-8 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between pb-2 border-b border-[#3A3A3A] font-mono text-xs">
                    <div className="flex items-center gap-2">
                      <Wand2 size={16} className="text-[#FF7F11]" />
                      <h3 className="font-bold text-white uppercase tracking-wider">Optimized Output</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate('/dashboard/compare')}
                        className="px-3.5 py-1.5 rounded-xl bg-[#FF7F11] text-[#0A0A0A] font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md hover:bg-[#FF9640] transition-colors"
                      >
                        <ArrowLeftRight size={14} />
                        Compare Studio
                      </button>
                      <button
                        onClick={() => setShowSaveModal(true)}
                        className="p-2 rounded-xl border border-[#3A3A3A] bg-white/5 text-[#A3A3A3] hover:text-white cursor-pointer"
                        title="Save to Library"
                      >
                        <Bookmark size={14} />
                      </button>
                      <button
                        onClick={() => handleCopy(optimizeResult.optimized_prompt)}
                        className="p-2 rounded-xl border border-[#3A3A3A] bg-white/5 text-[#A3A3A3] hover:text-white cursor-pointer"
                      >
                        {copied ? <Check size={14} className="text-[#4ADE80]" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                  <div className="rounded-2xl p-5 text-xs leading-relaxed whitespace-pre-wrap font-mono bg-[#0A0A0A] border border-[#3A3A3A] text-slate-200">
                    {optimizeResult.optimized_prompt}
                  </div>
                </div>

                <div className="rounded-3xl border border-[#3A3A3A] bg-[#262626]/90 p-7 md:p-8 space-y-3 shadow-xl">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">What Changed</h3>
                  <p className="text-xs text-[#A3A3A3] leading-relaxed font-sans">
                    {optimizeResult.explanation}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Score Result */}
            {!loading && activeAction === 'score' && scoreResult && (
              <motion.div
                key="score"
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                className="space-y-6"
              >
                <div className="rounded-3xl border border-[#3A3A3A] bg-[#262626]/90 p-7 md:p-8 flex items-center gap-6 shadow-xl">
                  <div className="text-4xl font-extrabold font-mono" style={{ color: getScoreColor(scoreResult.overall_score) }}>
                    {scoreResult.overall_score}
                    <span className="text-xs text-[#737373] font-sans ml-1">/100</span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-white">Overall Quality Evaluation</h3>
                    <p className="text-xs text-[#A3A3A3] font-sans leading-relaxed">
                      {scoreResult.overall_score >= 80 ? 'Excellent prompt structure and specificity!' :
                        scoreResult.overall_score >= 60 ? 'Good prompt, but could benefit from clearer constraints.' :
                          'Requires refinement for instruction compliance.'}
                    </p>
                  </div>
                </div>

                <div className="rounded-3xl border border-[#3A3A3A] bg-[#262626]/90 p-7 md:p-8 space-y-4 shadow-xl">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">Category Radar Analysis</h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer>
                      <RadarChart data={getScoreChartData(scoreResult)}>
                        <PolarGrid stroke="#3A3A3A" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#A3A3A3', fontSize: 10 }} />
                        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#A3A3A3', fontSize: 9 }} />
                        <Radar name="Score" dataKey="value" stroke="#FF7F11" fill="#FF7F11" fillOpacity={0.2} strokeWidth={2} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Convert Result */}
            {!loading && activeAction === 'convert' && convertResult && (
              <motion.div
                key="convert"
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                className="space-y-6"
              >
                <div className="rounded-3xl border border-[#3A3A3A] bg-[#262626]/90 p-7 md:p-8 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between pb-2 border-b border-[#3A3A3A] font-mono text-xs">
                    <h3 className="font-bold text-purple-300 uppercase tracking-wider">Converted — {PATTERN_LABELS[selectedPattern]}</h3>
                    <button
                      onClick={() => handleCopy(convertResult.converted_prompt)}
                      className="p-2 rounded-xl border border-[#3A3A3A] bg-white/5 text-[#A3A3A3] hover:text-white cursor-pointer"
                    >
                      {copied ? <Check size={14} className="text-[#4ADE80]" /> : <Copy size={14} />}
                    </button>
                  </div>
                  <div className="rounded-2xl p-5 text-xs leading-relaxed whitespace-pre-wrap font-mono bg-[#0A0A0A] border border-[#3A3A3A] text-slate-200">
                    {convertResult.converted_prompt}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Test Result */}
            {!loading && activeAction === 'test' && testResult && (
              <motion.div
                key="test"
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                className="space-y-6"
              >
                <div className="rounded-3xl border border-[#3A3A3A] bg-[#262626]/90 p-7 md:p-8 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between pb-2 border-b border-[#3A3A3A] font-mono text-xs">
                    <h3 className="font-bold text-[#4ADE80] uppercase tracking-wider">Model Response Execution</h3>
                    <span className="text-[#737373]">~{testResult.tokens_used} tokens</span>
                  </div>
                  <div className="rounded-2xl p-5 text-xs leading-relaxed whitespace-pre-wrap font-mono bg-[#0A0A0A] border border-[#3A3A3A] text-slate-200 max-h-[350px] overflow-y-auto">
                    {testResult.response}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
