import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, ArrowRight, ChevronDown,
  FileText, Cpu, BarChart3, Shield, Zap, Lock, HelpCircle, CheckCircle2,
  Play, Server
} from 'lucide-react';
import { AuthModal } from '@/components/auth/AuthModal';
import { sectionReveal, sectionRevealItem, buttonPress } from '@/animations/variants';

/* ============================================
   Animated Count-Up Hook
   ============================================ */
function useCountUp(end: number, duration = 1800, startOnView = true) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const hasRun = useRef(false);

  useEffect(() => {
    if (!startOnView || !inView || hasRun.current) return;
    hasRun.current = true;
    const startTime = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setCount(Math.round(eased * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, end, duration, startOnView]);

  return { count, ref };
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const [heroPrompt, setHeroPrompt] = useState('Write a Python scraper to extract PDF text and store in pandas dataframe.');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [heroOutput, setHeroOutput] = useState<string | null>(null);

  const openAuth = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  const handleHeroOptimize = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      setIsOptimizing(false);
      setHeroOutput('Act as a Senior Python Architect. Build a modular BeautifulSoup & PyPDF script with exponential backoff retries, type hints, ChromaDB vector indexing, and CSV export.');
    }, 800);
  };

  // Count-up hooks for hero stats
  const accuracy = useCountUp(95);
  const prompts = useCountUp(10);
  const engineers = useCountUp(50);

  const faqItems = [
    {
      q: 'How accurate is PromptForge AI optimization & radar scoring?',
      a: 'PromptForge AI utilizes multi-dimensional scoring (Clarity, Specificity, Context, Structure, Tone, Safety) evaluated against gpt-4o models to achieve over 95%+ instruction compliance and token efficiency.',
    },
    {
      q: 'What document formats can I upload to the Knowledge Base?',
      a: 'We support PDF, DOCX, TXT, Markdown (.md), and CSV files up to 50MB. All uploaded documents pass through an 8-stage extraction, chunking, and ChromaDB vector embedding pipeline.',
    },
    {
      q: 'How does LangSmith trace integration work?',
      a: 'Every prompt optimization, comparison run, and RAG retrieval automatically logs latency, token consumption, model IDs, and trace links directly to your configured LangSmith project.',
    },
    {
      q: 'Is PromptForge AI enterprise SOC2 and GDPR compliant?',
      a: 'Yes. We support local ChromaDB vector indexing and SQLite metadata storage so your raw text data stays encrypted within your infrastructure environment.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5F5F5] font-sans selection:bg-[#FF7F11]/20 selection:text-[#FF7F11] flex flex-col items-center w-full overflow-x-hidden">

      {/* =========== AURORA MESH BACKGROUND =========== */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-200px] left-[-100px] w-[600px] h-[600px] rounded-full bg-[#FF7F11] blur-[160px] opacity-[0.07]" style={{ animation: 'aurora-float 18s ease-in-out infinite 0s' }} />
        <div className="absolute top-[50%] right-[-150px] w-[500px] h-[500px] rounded-full bg-[#3A3A3A] blur-[160px] opacity-[0.10]" style={{ animation: 'aurora-float 18s ease-in-out infinite -6s' }} />
        <div className="absolute bottom-[-100px] left-[30%] w-[450px] h-[450px] rounded-full bg-[#FF7F11] blur-[140px] opacity-[0.04]" style={{ animation: 'aurora-float 18s ease-in-out infinite -12s' }} />
      </div>

      {/* =========== HEADER =========== */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-2xl bg-[#0A0A0A]/88 border-b border-[#3A3A3A]">
        <div className="w-full max-w-7xl mx-auto px-6 md:px-8 h-20 flex items-center justify-between">
          <div onClick={() => navigate('/')} className="flex items-center gap-3 cursor-pointer group">
            <div className="w-10 h-10 rounded-xl bg-[#FF7F11] flex items-center justify-center shadow-lg shadow-[#FF7F11]/20 group-hover:scale-105 transition-transform">
              <Shield className="w-5 h-5 text-[#0A0A0A]" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-[#F5F5F5] group-hover:text-[#FF7F11] transition-colors">
                PromptForge <span className="text-[#FF7F11] font-mono text-xs font-semibold">AI</span>
              </span>
              <span className="block text-[9px] text-[#737373] uppercase font-mono tracking-widest">
                Enterprise AI Engineering
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm text-[#A3A3A3]">
            <a href="#how-it-works" className="hover:text-[#F5F5F5] transition-colors">How It Works</a>
            <a href="#features" className="hover:text-[#F5F5F5] transition-colors">Capabilities</a>
            <a href="#specs" className="hover:text-[#F5F5F5] transition-colors">Architecture</a>
            <a href="#faq" className="hover:text-[#F5F5F5] transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-4">
            <button
              onClick={() => openAuth('signin')}
              className="text-sm text-[#A3A3A3] hover:text-[#F5F5F5] transition-colors px-3 py-2 cursor-pointer"
            >
              Sign In
            </button>
            <motion.button
              onClick={() => openAuth('signup')}
              variants={buttonPress}
              initial="rest" whileHover="hover" whileTap="tap"
              className="px-5 py-2.5 rounded-full bg-[#FF7F11] text-[#0A0A0A] text-sm font-bold shadow-lg shadow-[#FF7F11]/20 cursor-pointer"
            >
              Get Started
            </motion.button>
          </div>
        </div>
      </header>

      {/* =========== MAIN CONTENT =========== */}
      <main className="w-full flex flex-col items-center relative z-10">

        {/* ============ CHAPTER 1: HERO ============ */}
        <section className="w-full max-w-7xl mx-auto px-6 md:px-8 min-h-[85vh] pt-20 md:pt-24 pb-16 md:pb-20 flex flex-col items-center justify-center text-center">
          {/* Eyebrow badge */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#FF7F11]/30 bg-[#FF7F11]/8 text-xs font-mono text-[#FF7F11] mb-6"
          >
            <Sparkles className="w-3.5 h-3.5" />
            98.4% ML Prompt Optimization Accuracy
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-[-0.02em] leading-[1.08] text-[#F5F5F5] max-w-4xl mx-auto mb-6"
          >
            Design Better Prompts.{' '}
            <span className="text-[#FF7F11]">Build Better AI.</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="text-base sm:text-lg text-[#A3A3A3] max-w-2xl mx-auto leading-relaxed mb-10"
          >
            Advanced ML-powered prompt engineering platform. Optimize instructions in real-time with explainable radar scoring and grounded RAG search.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
            className="flex flex-wrap items-center justify-center gap-4 mb-16"
          >
            <motion.button
              variants={buttonPress} initial="rest" whileHover="hover" whileTap="tap"
              onClick={() => openAuth('signup')}
              className="px-8 py-4 rounded-full bg-[#FF7F11] text-[#0A0A0A] font-bold text-sm shadow-lg shadow-[#FF7F11]/25 flex items-center gap-2.5 cursor-pointer"
            >
              Get Started Free <ArrowRight size={16} />
            </motion.button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-8 py-4 rounded-full border border-[#3A3A3A] bg-white/[0.03] hover:bg-white/[0.06] text-[#F5F5F5] font-semibold text-sm transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Play size={14} className="text-white/70" /> Interactive Live Demo
            </button>
          </motion.div>

          {/* Showcase Card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55, duration: 0.6 }}
            className="w-full max-w-3xl mx-auto"
          >
            <div className="rounded-2xl border border-[#3A3A3A] bg-[#262626] p-6 md:p-8 text-left space-y-6 shadow-xl">
              {/* Card header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#3A3A3A]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[#FF7F11]">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#F5F5F5]">PromptForge Studio</h3>
                    <p className="text-xs text-[#737373] font-mono">ML Optimization Engine</p>
                  </div>
                </div>
                <span className="text-xs font-mono px-3 py-1 rounded-full bg-[#4ADE80]/10 text-[#4ADE80] border border-[#4ADE80]/20 font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] animate-pulse" />
                  Active
                </span>
              </div>

              {/* Input + button */}
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="text"
                    value={heroPrompt}
                    onChange={(e) => setHeroPrompt(e.target.value)}
                    placeholder="Enter prompt to optimize..."
                    className="w-full bg-[#0A0A0A] border border-[#3A3A3A] rounded-xl p-4 pr-12 text-sm text-[#F5F5F5] focus:border-[#FF7F11]/50 outline-none font-mono transition-colors"
                  />
                  <Lock className="w-4 h-4 text-[#737373] absolute right-4 top-4" />
                </div>
                <motion.button
                  variants={buttonPress} initial="rest" whileHover="hover" whileTap="tap"
                  onClick={handleHeroOptimize}
                  disabled={isOptimizing}
                  className="w-full py-3.5 rounded-xl bg-[#FF7F11] text-[#0A0A0A] text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-60"
                >
                  <Sparkles size={16} />
                  {isOptimizing ? 'Optimizing…' : 'Analyze & Optimize with AI'}
                </motion.button>
              </div>

              {/* Output */}
              {heroOutput && (
                <div className="p-4 rounded-xl bg-[#0A0A0A] border border-[#3A3A3A] text-xs font-mono space-y-1.5">
                  <span className="text-white/80 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-[#FF7F11]" /> Optimized (Score: 98/100)
                  </span>
                  <p className="text-[#A3A3A3] text-xs leading-relaxed font-sans">{heroOutput}</p>
                </div>
              )}

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[#3A3A3A]">
                <div className="p-4 rounded-xl bg-[#0A0A0A] border border-[#3A3A3A] text-center">
                  <p className="text-2xl font-bold text-[#FF7F11] font-mono">
                    <span ref={accuracy.ref}>{accuracy.count}</span>%+
                  </p>
                  <p className="text-xs text-[#737373] mt-1">Accuracy</p>
                </div>
                <div className="p-4 rounded-xl bg-[#0A0A0A] border border-[#3A3A3A] text-center">
                  <p className="text-2xl font-bold text-[#F5F5F5] font-mono">
                    <span ref={prompts.ref}>{prompts.count}</span>M+
                  </p>
                  <p className="text-xs text-[#737373] mt-1">Prompts Analyzed</p>
                </div>
                <div className="p-4 rounded-xl bg-[#0A0A0A] border border-[#3A3A3A] text-center">
                  <p className="text-2xl font-bold text-[#A3A3A3] font-mono">
                    <span ref={engineers.ref}>{engineers.count}</span>K+
                  </p>
                  <p className="text-xs text-[#737373] mt-1">Engineers</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Scroll indicator */}
          <div className="mt-12 flex flex-col items-center gap-2 text-[#737373] font-mono text-xs uppercase tracking-widest animate-bounce">
            <span>Explore</span>
            <ChevronDown size={18} className="text-[#FF7F11]" />
          </div>

          {/* Dedicated Post-Chapter Spacer */}
          <div className="h-16 md:h-24 w-full" />
        </section>

        {/* ============ CHAPTER 2: HOW IT WORKS ============ */}
        <section id="how-it-works" className="w-full max-w-7xl mx-auto px-6 md:px-8 pt-20 md:pt-24 pb-16 md:pb-20 scroll-mt-24 border-t border-[#3A3A3A] flex flex-col items-center justify-center text-center">
          <motion.div
            variants={sectionReveal} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
            className="w-full flex flex-col items-center"
          >
            {/* Centered Header Block */}
            <div className="flex flex-col items-center justify-center text-center max-w-3xl mx-auto mb-12 md:mb-16">
              <motion.div variants={sectionRevealItem} className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs font-mono text-white/70 mb-6">
                <Shield className="w-3.5 h-3.5" /> How It Works
              </motion.div>
              <motion.h2 variants={sectionRevealItem} className="text-3xl sm:text-5xl font-bold tracking-[-0.02em] text-[#F5F5F5] mb-6">
                Engineering in <span className="text-[#FF7F11]">Four Steps</span>
              </motion.h2>
              <motion.p variants={sectionRevealItem} className="text-[#A3A3A3] text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
                Our advanced AI pipeline delivers instant, accurate prompt optimization with complete transparency.
              </motion.p>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
              {[
                { icon: FileText, title: 'Submit Prompt', desc: 'Paste any raw prompt into our studio. Support for single instructions, system personas, and multi-turn templates.', num: '01' },
                { icon: Cpu, title: 'AI Optimization', desc: 'Our LLM optimizer applies 8 design patterns (Chain-of-Thought, ReAct, Few-Shot) to eliminate ambiguity.', num: '02' },
                { icon: BarChart3, title: 'Radar Scoring', desc: 'Get transparent radar evaluation scores showing clarity, structure, context depth, and safety compliance.', num: '03' },
                { icon: Shield, title: 'RAG & Telemetry', desc: 'Query grounded ChromaDB vector documents and inspect full LangSmith trace logs in real-time.', num: '04' },
              ].map((card) => (
                <motion.div
                  key={card.num}
                  variants={sectionRevealItem}
                  whileHover={{ y: -4, borderColor: 'rgba(255,127,17,0.3)' }}
                  className="relative rounded-2xl border border-[#3A3A3A] bg-[#262626] p-8 space-y-5 transition-shadow duration-200 hover:shadow-lg hover:shadow-[#FF7F11]/5 w-full flex flex-col justify-between"
                >
                  <span className="absolute top-6 right-6 text-xs font-mono font-bold text-[#FF7F11]">{card.num}</span>
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-white/60">
                    <card.icon className="w-6 h-6" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-[#F5F5F5]">{card.title}</h3>
                    <p className="text-sm text-[#A3A3A3] leading-relaxed">{card.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Dedicated Post-Chapter Spacer */}
          <div className="h-16 md:h-24 w-full" />
        </section>

        {/* ============ CHAPTER 3: CAPABILITIES ============ */}
        <section id="features" className="w-full max-w-7xl mx-auto px-6 md:px-8 pt-20 md:pt-24 pb-16 md:pb-20 scroll-mt-24 border-t border-[#3A3A3A] flex flex-col items-center justify-center text-center">
          <motion.div
            variants={sectionReveal} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
            className="w-full flex flex-col items-center"
          >
            {/* Centered Header Block */}
            <div className="flex flex-col items-center justify-center text-center max-w-3xl mx-auto mb-12 md:mb-16">
              <motion.div variants={sectionRevealItem} className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs font-mono text-white/70 mb-6">
                <Shield className="w-3.5 h-3.5" /> Capabilities
              </motion.div>
              <motion.h2 variants={sectionRevealItem} className="text-3xl sm:text-5xl font-bold tracking-[-0.02em] text-[#F5F5F5] mb-6">
                Everything You Need to Build <span className="text-[#FF7F11]">Enterprise AI</span>
              </motion.h2>
              <motion.p variants={sectionRevealItem} className="text-[#A3A3A3] text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
                Comprehensive prompt engineering powered by cutting-edge AI architecture.
              </motion.p>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
              {[
                { icon: Cpu, title: 'AI-Powered Optimization', desc: 'Advanced machine learning algorithms with 95%+ accuracy for real-time prompt instruction optimization.' },
                { icon: Zap, title: 'Lightning Fast RAG', desc: 'Index documents in milliseconds with our optimized ChromaDB vector retrieval engine and caching.' },
                { icon: BarChart3, title: 'LangSmith Observability', desc: 'Track execution latency, model cost per token, similarity scores, and inspect trace logs.' },
              ].map((card, i) => (
                <motion.div
                  key={i}
                  variants={sectionRevealItem}
                  whileHover={{ y: -4, borderColor: 'rgba(255,127,17,0.3)' }}
                  className="rounded-2xl border border-[#3A3A3A] bg-[#262626] p-8 space-y-5 transition-shadow duration-200 hover:shadow-lg hover:shadow-[#FF7F11]/5 w-full flex flex-col justify-between"
                >
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-white/60">
                    <card.icon className="w-6 h-6" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-[#F5F5F5]">{card.title}</h3>
                    <p className="text-sm text-[#A3A3A3] leading-relaxed">{card.desc}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono text-[#A3A3A3] pt-2">
                    <CheckCircle2 size={14} className="text-[#FF7F11]" /> Production Ready
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Dedicated Post-Chapter Spacer */}
          <div className="h-16 md:h-24 w-full" />
        </section>

        {/* ============ CHAPTER 4: ARCHITECTURE ============ */}
        <section id="specs" className="w-full max-w-7xl mx-auto px-6 md:px-8 pt-20 md:pt-24 pb-16 md:pb-20 scroll-mt-24 border-t border-[#3A3A3A] flex flex-col items-center justify-center text-center">
          <motion.div
            variants={sectionReveal} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
            className="w-full flex flex-col items-center"
          >
            {/* Centered Header Block */}
            <div className="flex flex-col items-center justify-center text-center max-w-3xl mx-auto mb-12 md:mb-16">
              <motion.div variants={sectionRevealItem} className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs font-mono text-white/70 mb-6">
                <Server className="w-3.5 h-3.5" /> Technical Specs
              </motion.div>
              <motion.h2 variants={sectionRevealItem} className="text-3xl sm:text-5xl font-bold tracking-[-0.02em] text-[#F5F5F5] mb-6">
                Enterprise Stack <span className="text-[#FF7F11]">Architecture</span>
              </motion.h2>
              <motion.p variants={sectionRevealItem} className="text-[#A3A3A3] text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
                Built on battle-tested Python & React infrastructure for maximum reliability.
              </motion.p>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
              {[
                { title: 'FastAPI Engine', desc: 'Asynchronous Python backend supporting streaming completions, background tasks, and CORS security.' },
                { title: 'ChromaDB Vector Store', desc: 'Persistent vector database with cosine similarity search and text-embedding-3-small integration.' },
                { title: 'LangSmith Observability', desc: 'Complete trace telemetry tracking latency, prompt tokens, completion tokens, and execution runs.' },
                { title: 'Multi-Radar Scoring', desc: 'Evaluates clarity, specificity, context depth, structure, tone, and safety compliance.' },
              ].map((card, i) => (
                <motion.div
                  key={i}
                  variants={sectionRevealItem}
                  whileHover={{ y: -4, borderColor: 'rgba(255,127,17,0.3)' }}
                  className="rounded-2xl border border-[#3A3A3A] bg-[#262626] p-8 space-y-4 transition-shadow duration-200 hover:shadow-lg hover:shadow-[#FF7F11]/5 w-full flex flex-col justify-between text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-bold font-mono text-sm text-[#FF7F11]">
                    0{i + 1}
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-base font-bold text-[#F5F5F5]">{card.title}</h4>
                    <p className="text-sm text-[#A3A3A3] leading-relaxed">{card.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Dedicated Post-Chapter Spacer */}
          <div className="h-16 md:h-24 w-full" />
        </section>

        {/* ============ CHAPTER 5: FAQ ============ */}
        <section id="faq" className="w-full max-w-7xl mx-auto px-6 md:px-8 pt-20 md:pt-24 pb-16 md:pb-20 scroll-mt-24 border-t border-[#3A3A3A] flex flex-col items-center justify-center text-center">
          <motion.div
            variants={sectionReveal} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
            className="w-full max-w-3xl mx-auto flex flex-col items-center justify-center text-center"
          >
            {/* Centered Header Block */}
            <div className="flex flex-col items-center justify-center text-center w-full max-w-3xl mx-auto mb-12 md:mb-16">
              <motion.div variants={sectionRevealItem} className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs font-mono text-white/70 mb-6">
                <HelpCircle className="w-3.5 h-3.5" /> FAQ
              </motion.div>
              <motion.h2 variants={sectionRevealItem} className="text-3xl sm:text-5xl font-bold tracking-[-0.02em] text-[#F5F5F5] mb-6 text-center">
                Frequently Asked <span className="text-[#FF7F11]">Questions</span>
              </motion.h2>
              <motion.p variants={sectionRevealItem} className="text-[#A3A3A3] text-base sm:text-lg leading-relaxed max-w-2xl mx-auto text-center">
                Everything you need to know about PromptForge AI features, integration, security, and performance.
              </motion.p>
            </div>

            {/* Accordion List */}
            <div className="space-y-4 w-full">
              {faqItems.map((item, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <motion.div
                    key={idx}
                    variants={sectionRevealItem}
                    className="rounded-2xl border border-[#3A3A3A] bg-[#262626] overflow-hidden w-full text-left"
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full p-6 md:p-8 flex items-center justify-between text-left text-sm sm:text-base font-semibold text-[#F5F5F5] hover:text-[#FF7F11] transition-colors cursor-pointer"
                    >
                      <span className="pr-4">{item.q}</span>
                      <motion.div
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ChevronDown className={`w-5 h-5 shrink-0 ml-4 ${isOpen ? 'text-[#FF7F11]' : 'text-[#737373]'}`} />
                      </motion.div>
                    </button>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 md:px-8 pb-6 md:pb-8 text-sm text-[#A3A3A3] leading-relaxed border-t border-[#3A3A3A] pt-4 font-sans">
                            {item.a}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Dedicated Post-Chapter Spacer */}
          <div className="h-16 md:h-24 w-full" />
        </section>

      </main>

      {/* =========== FOOTER =========== */}
      <footer className="w-full max-w-7xl mx-auto px-6 md:px-8 pt-16 pb-8 border-t border-[#3A3A3A] text-sm text-[#737373] flex flex-col md:flex-row items-center justify-between gap-4">
        <div>© 2026 PromptForge AI Inc. Enterprise AI Engineering Platform.</div>
        <div className="flex items-center gap-6">
          <a href="#how-it-works" className="hover:text-[#A3A3A3] transition-colors">How It Works</a>
          <a href="#features" className="hover:text-[#A3A3A3] transition-colors">Capabilities</a>
          <a href="#specs" className="hover:text-[#A3A3A3] transition-colors">Architecture</a>
          <button onClick={() => openAuth('signin')} className="hover:text-[#A3A3A3] transition-colors cursor-pointer">Sign In</button>
        </div>
      </footer>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} initialMode={authMode} />
    </div>
  );
}
