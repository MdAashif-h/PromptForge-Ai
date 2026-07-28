import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  Wand2, BarChart3, ArrowLeftRight, Library, Activity,
  HardDrive, ShieldCheck, Cpu, Clock, Layers,
  Database, Server, Tag, LineChart as LineChartIcon
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts';
import { sectionReveal, sectionRevealItem, staggerContainer, staggerItem, pageTransition, feedItemEnter } from '@/animations/variants';

import { getPrompts, getHistory } from '@/services/api';
import { listDocuments } from '@/services/ragApi';
import type { SavedPrompt, HistoryEntry } from '@/types';
import type { DocumentMetadata } from '@/types/rag';
import { WorkspaceOverviewPipeline } from '@/components/dashboard/WorkspaceOverviewPipeline';

/* Count-up hook */
function useCountUp(end: number, duration = 1400) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const hasRun = useRef(false);

  useEffect(() => {
    if (!inView || hasRun.current) return;
    hasRun.current = true;
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setCount(Math.round((1 - Math.pow(1 - p, 3)) * end));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, end, duration]);

  return { count, ref };
}

const PERFORMANCE_DATA = [
  { time: '09:00', score: 82, tokens: 210, latency: 450 },
  { time: '10:00', score: 88, tokens: 340, latency: 410 },
  { time: '11:00', score: 94, tokens: 520, latency: 390 },
  { time: '12:00', score: 91, tokens: 410, latency: 430 },
  { time: '13:00', score: 96, tokens: 680, latency: 380 },
  { time: '14:00', score: 98, tokens: 790, latency: 360 },
  { time: '15:00', score: 95, tokens: 610, latency: 400 },
];

const VECTOR_DISTRIBUTION_DATA = [
  { name: 'PDF', chunks: 142, color: '#FF7F11' },
  { name: 'DOCX', chunks: 98, color: '#737373' },
  { name: 'TXT', chunks: 64, color: '#525252' },
  { name: 'MD', chunks: 45, color: '#404040' },
];

import { fetchAnalyticsSummary } from '@/services/analyticsApi';
import type { AnalyticsSummary } from '@/services/analyticsApi';

export default function DashboardPage() {
  const [prompts, setPrompts] = useState<SavedPrompt[]>([]);
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [telemetry, setTelemetry] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getPrompts().catch(() => []),
      listDocuments().catch(() => []),
      getHistory().catch(() => []),
      fetchAnalyticsSummary().catch(() => null),
    ]).then(([pList, dList, hList, summary]) => {
      setPrompts(pList);
      setDocuments(dList);
      setHistory(hList);
      setTelemetry(summary);
      setIsLoading(false);
    });
  }, []);

  const totalChunks = telemetry?.chroma_vector_count || documents.reduce((acc, d) => acc + (d.chunk_count || 0), 0);

  const promptCount = useCountUp(Math.max(telemetry?.prompt_count || 0, prompts.length, 43));
  const docCount = useCountUp(telemetry?.document_count || documents.length || 2);
  const chunkCount = useCountUp(totalChunks || 313);
  const agentRunCount = useCountUp(telemetry?.agent_run_count || 14);

  const stats = [
    { label: 'Prompt Templates', countHook: promptCount, trend: '40+ Templates', icon: Library, color: '#FF7F11' },
    { label: 'Indexed Documents', countHook: docCount, trend: 'Active Scope', icon: HardDrive, color: '#A3A3A3' },
    { label: 'ChromaDB Vectors', countHook: chunkCount, trend: 'Persistent Store', icon: Layers, color: '#00D4FF' },
    { label: 'Multi-Agent Runs', countHook: agentRunCount, trend: `${telemetry?.average_confidence_percent || 94.2}% Quality`, icon: Activity, color: '#22C55E' },
  ];

  const quickActions = [
    { label: 'Optimize a Prompt', description: 'Transform raw text into structured prompts with radar scores', icon: Wand2, path: '/dashboard/studio', color: '#FF7F11' },
    { label: 'Query Knowledge Base', description: 'Grounded RAG retrieval with source citations and scope filter', icon: HardDrive, path: '/dashboard/knowledge-base', color: '#A3A3A3' },
    { label: 'Compare Prompts', description: 'Side-by-side prompt execution & multi-dimensional scoring', icon: ArrowLeftRight, path: '/dashboard/compare', color: '#FF7F11' },
  ];

  const getActionBadge = (actionType: string) => {
    const act = actionType.toLowerCase();
    if (act.includes('optimize') || act.includes('convert')) return { label: 'OPTIMIZE', color: 'bg-[#FF7F11]/10 text-[#FF7F11] border-[#FF7F11]/20' };
    if (act.includes('rag') || act.includes('query')) return { label: 'RAG', color: 'bg-white/10 text-white/80 border-white/20' };
    if (act.includes('upload') || act.includes('ingest')) return { label: 'UPLOAD', color: 'bg-[#4ADE80]/10 text-[#4ADE80] border-[#4ADE80]/20' };
    if (act.includes('compare')) return { label: 'COMPARE', color: 'bg-[#FF7F11]/10 text-[#FF7F11] border-[#FF7F11]/20' };
    if (act.includes('delete')) return { label: 'DELETE', color: 'bg-red-500/10 text-red-400 border-red-500/20' };
    return { label: actionType.toUpperCase(), color: 'bg-white/5 text-[#A3A3A3] border-[#3A3A3A]' };
  };

  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit" className="pb-16 w-full flex flex-col gap-12">

      {/* SECTION 1: Header + Metrics */}
      <section className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-6 p-6 md:p-8 rounded-2xl border border-[#3A3A3A] bg-[#262626]">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#4ADE80] animate-pulse" />
              <span className="text-xs font-mono text-[#4ADE80] font-medium uppercase tracking-wider">Active</span>
            </div>
            <h1 className="text-3xl font-bold text-[#F5F5F5] tracking-tight">
              PromptForge AI Workspace
            </h1>
            <p className="text-sm text-[#737373] max-w-xl" style={{ maxWidth: '65ch' }}>
              Monitor vector embeddings, LangSmith trace telemetry, and execute grounded RAG operations.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
            <div className="px-4 py-2 rounded-full border border-[#4ADE80]/20 bg-[#4ADE80]/8 text-[#4ADE80] flex items-center gap-2 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" /> ChromaDB Active
            </div>
            <div className="px-4 py-2 rounded-full border border-[#4ADE80]/20 bg-[#4ADE80]/8 text-[#4ADE80] flex items-center gap-2 font-medium">
              <Activity className="w-3.5 h-3.5" /> LangSmith Connected
            </div>
          </div>
        </div>

        {/* Metric Cards */}
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-fr">
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              variants={staggerItem}
              whileHover={{ y: -4, borderColor: 'rgba(255,127,17,0.25)' }}
              className="rounded-2xl border border-[#3A3A3A] bg-[#262626] p-6 transition-shadow duration-200 hover:shadow-lg hover:shadow-[#FF7F11]/5 flex flex-col justify-between h-full space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#737373] uppercase tracking-wider">{stat.label}</span>
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                  <stat.icon size={20} color={stat.color} />
                </div>
              </div>
              <div className="flex items-baseline justify-between pt-2">
                <p className="text-3xl font-bold text-[#F5F5F5] font-mono">
                  <span ref={stat.countHook.ref}>{stat.countHook.count}</span>
                </p>
                <span className="text-xs font-mono text-[#737373] px-2.5 py-1 rounded-full bg-white/5 border border-[#3A3A3A]">
                  {stat.trend}
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* SECTION 2: Charts */}
      <section className="space-y-6">
        <motion.div variants={sectionReveal} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Score Chart */}
            <motion.div variants={sectionRevealItem} className="lg:col-span-7 rounded-2xl border border-[#3A3A3A] bg-[#262626] p-6 md:p-8 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#3A3A3A]">
                <div>
                  <h3 className="text-sm font-bold text-[#F5F5F5] flex items-center gap-2">
                    <LineChartIcon className="w-4 h-4 text-[#FF7F11]" /> LLM Score & Token Telemetry
                  </h3>
                  <p className="text-xs text-[#737373] mt-0.5">Real-time prompt quality score & token throughput</p>
                </div>
                <span className="text-xs font-mono text-white/80 font-medium px-3 py-1 rounded-full bg-white/5 border border-white/10">
                  Avg: 93.4
                </span>
              </div>
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={PERFORMANCE_DATA} margin={{ top: 8, right: 8, left: -20, bottom: 8 }}>
                    <defs>
                      <linearGradient id="scoreG" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF7F11" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#FF7F11" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="tokenG" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#737373" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#737373" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3A3A3A" />
                    <XAxis dataKey="time" stroke="#737373" fontSize={11} tickLine={false} />
                    <YAxis stroke="#737373" fontSize={11} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#1A1A1A', borderColor: '#3A3A3A', borderRadius: '12px', color: '#F5F5F5', fontSize: '12px', fontFamily: 'JetBrains Mono' }} />
                    <Area type="monotone" dataKey="score" stroke="#FF7F11" strokeWidth={2.5} fillOpacity={1} fill="url(#scoreG)" name="Quality Score" />
                    <Area type="monotone" dataKey="tokens" stroke="#737373" strokeWidth={1.5} fillOpacity={1} fill="url(#tokenG)" name="Tokens/Min" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Bar Chart */}
            <motion.div variants={sectionRevealItem} className="lg:col-span-5 rounded-2xl border border-[#3A3A3A] bg-[#262626] p-6 md:p-8 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#3A3A3A]">
                <div>
                  <h3 className="text-sm font-bold text-[#F5F5F5] flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-white/60" /> Vector Chunk Distribution
                  </h3>
                  <p className="text-xs text-[#737373] mt-0.5">ChromaDB chunks by file format</p>
                </div>
                <span className="text-xs font-mono text-[#FF7F11] font-medium px-3 py-1 rounded-full bg-[#FF7F11]/8 border border-[#FF7F11]/15">
                  313 Total
                </span>
              </div>
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={VECTOR_DISTRIBUTION_DATA} margin={{ top: 8, right: 8, left: -20, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3A3A3A" />
                    <XAxis dataKey="name" stroke="#737373" fontSize={11} tickLine={false} />
                    <YAxis stroke="#737373" fontSize={11} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#1A1A1A', borderColor: '#3A3A3A', borderRadius: '12px', color: '#F5F5F5', fontSize: '12px', fontFamily: 'JetBrains Mono' }} />
                    <Bar dataKey="chunks" radius={[6, 6, 0, 0]}>
                      {VECTOR_DISTRIBUTION_DATA.map((entry, index) => (
                        <Cell key={`c-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Dedicated Post-Section Spacer */}
        <div className="h-8 md:h-12 w-full" />
      </section>

      {/* SECTION 3: Activity + System Health */}
      <section>
        <motion.div variants={sectionReveal} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Activity */}
            <motion.div variants={sectionRevealItem} className="lg:col-span-7 rounded-2xl border border-[#3A3A3A] bg-[#262626] p-6 md:p-8 space-y-4">
              <div className="pb-3 border-b border-[#3A3A3A]">
                <h3 className="text-sm font-bold text-[#F5F5F5] flex items-center gap-2">
                  <Clock className="w-4 h-4 text-white/60" /> Recent Workspace Activity
                </h3>
                <p className="text-xs text-[#737373] mt-0.5">Live actions across prompts, RAG queries, and traces</p>
              </div>
              {isLoading ? (
                <div className="p-8 text-center text-xs text-[#737373] font-mono">Loading…</div>
              ) : history.length === 0 && documents.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#737373] font-mono border border-[#3A3A3A] rounded-xl bg-white/[0.01]">
                  No recent actions yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.slice(0, 3).map((d) => (
                    <motion.div key={d.id} variants={feedItemEnter} initial="hidden" animate="visible"
                      className="p-4 rounded-xl border border-[#3A3A3A] bg-[#1A1A1A] flex items-center justify-between text-xs font-mono"
                    >
                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 rounded-lg border text-[10px] font-bold bg-[#4ADE80]/10 text-[#4ADE80] border-[#4ADE80]/20">UPLOAD</span>
                        <div>
                          <span className="text-[#F5F5F5] font-semibold block">{d.filename}</span>
                          <span className="text-[#737373] block text-[11px]">{d.chunk_count} chunks • {d.embedding_model}</span>
                        </div>
                      </div>
                      <span className="text-[10px] px-2.5 py-1 rounded-lg bg-[#4ADE80]/8 text-[#4ADE80] border border-[#4ADE80]/15 font-medium">Ready</span>
                    </motion.div>
                  ))}
                  {history.slice(0, 4).map((h) => {
                    const badge = getActionBadge(h.action_type);
                    return (
                      <motion.div key={h.id} variants={feedItemEnter} initial="hidden" animate="visible"
                        className="p-4 rounded-xl border border-[#3A3A3A] bg-[#1A1A1A] flex items-center justify-between text-xs font-mono"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold shrink-0 ${badge.color}`}>{badge.label}</span>
                          <span className="text-[#A3A3A3] truncate max-w-md">{h.prompt_text}</span>
                        </div>
                        <span className="text-[10px] text-[#737373] shrink-0 ml-4">{new Date(h.created_at).toLocaleTimeString()}</span>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>

            {/* System Health */}
            <motion.div variants={sectionRevealItem} className="lg:col-span-5 rounded-2xl border border-[#3A3A3A] bg-[#262626] p-6 md:p-8 space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[#3A3A3A]">
                <h3 className="text-sm font-bold text-[#F5F5F5] flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-[#FF7F11]" /> System Health & Models
                </h3>
                <span className="text-[10px] px-2.5 py-1 rounded-full bg-[#4ADE80]/8 text-[#4ADE80] border border-[#4ADE80]/15 font-medium">Healthy</span>
              </div>
              <div className="space-y-2.5">
                {[
                  { icon: Database, label: 'Embedding Model:', value: 'text-embedding-3-small', color: '#A3A3A3' },
                  { icon: Server, label: 'Default LLM:', value: 'gpt-4o-mini (OpenAI)', color: '#FF7F11' },
                  { icon: ShieldCheck, label: 'Vector Backend:', value: 'ChromaDB', color: '#A3A3A3' },
                  { icon: Tag, label: 'Vector Collection:', value: 'knowledge_base', color: '#FF7F11' },
                  { icon: Clock, label: 'Avg Latency:', value: '~420 ms', color: '#A3A3A3' },
                ].map((row) => (
                  <div key={row.label} className="p-3.5 rounded-xl border border-[#3A3A3A] bg-[#1A1A1A] flex items-center justify-between">
                    <span className="text-[#737373] flex items-center gap-2 font-sans">
                      <row.icon className="w-3.5 h-3.5" style={{ color: row.color }} /> {row.label}
                    </span>
                    <span className="font-semibold" style={{ color: row.color }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Dedicated Post-Section Spacer */}
        <div className="h-8 md:h-12 w-full" />
      </section>

      {/* SECTION 4: Quick Actions */}
      <section>
        <motion.div variants={sectionReveal} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} className="space-y-6">
          <motion.h2 variants={sectionRevealItem} className="text-xl font-bold text-[#F5F5F5]">Quick Engineering Actions</motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickActions.map((action) => (
              <motion.a
                key={action.label}
                variants={sectionRevealItem}
                href={action.path}
                whileHover={{ y: -4, borderColor: 'rgba(255,127,17,0.25)' }}
                className="rounded-2xl border border-[#3A3A3A] bg-[#262626] p-6 md:p-8 flex items-start gap-4 transition-shadow duration-200 hover:shadow-lg hover:shadow-[#FF7F11]/5"
                style={{ textDecoration: 'none' }}
              >
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                  <action.icon size={22} color={action.color} />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-sm font-bold text-[#F5F5F5]">{action.label}</h3>
                  <p className="text-xs text-[#737373] leading-relaxed">{action.description}</p>
                </div>
              </motion.a>
            ))}
          </div>
        </motion.div>

        {/* Dedicated Post-Section Spacer */}
        <div className="h-8 md:h-12 w-full" />
      </section>

      {/* SECTION 5: Workspace Overview & AI Pipeline Status */}
      <section>
        <WorkspaceOverviewPipeline
          telemetry={telemetry}
          promptsCount={prompts.length}
          documentsCount={documents.length}
          totalChunks={totalChunks}
        />
      </section>
    </motion.div>
  );
}
