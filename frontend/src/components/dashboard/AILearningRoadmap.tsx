import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export interface Milestone {
  id: string;
  moduleNum: number;
  name: string;
  category: string;
  description: string;
  status: 'completed' | 'active' | 'upcoming' | 'locked';
  availability: string;
}

const MILESTONES: Milestone[] = [
  {
    id: 'm1',
    moduleNum: 1,
    name: 'Enterprise RAG Workspace',
    category: 'Ingestion & Vector DB',
    description: 'Document loaders, 8-stage visual pipeline, MMR re-ranking, and source citations.',
    status: 'completed',
    availability: 'Active Module',
  },
  {
    id: 'm2',
    moduleNum: 2,
    name: 'RAG Explorer',
    category: 'Inspection',
    description: 'Step-by-step vector similarity visualization and prompt construction inspector.',
    status: 'active',
    availability: 'In Active Development',
  },
  {
    id: 'm3',
    moduleNum: 3,
    name: 'Chunk Visualizer',
    category: 'Parsing',
    description: 'Interactive chunk breakdown, token count, and metadata viewer.',
    status: 'upcoming',
    availability: 'Target: Q3 2026',
  },
  {
    id: 'm4',
    moduleNum: 4,
    name: 'Retrieval Inspector',
    category: 'Metrics',
    description: 'Chunk ranking, similarity %, and response latency metrics.',
    status: 'upcoming',
    availability: 'Target: Q3 2026',
  },
  {
    id: 'm5',
    moduleNum: 5,
    name: 'Hybrid Search',
    category: 'Retrieval',
    description: 'Vector search + BM25 keyword search + metadata filtering.',
    status: 'upcoming',
    availability: 'Target: Q4 2026',
  },
  {
    id: 'm6',
    moduleNum: 6,
    name: 'RAG Evaluation',
    category: 'Benchmarking',
    description: 'Relevance, Faithfulness, and Context Precision/Recall evaluation dashboard.',
    status: 'upcoming',
    availability: 'Target: Q4 2026',
  },
  {
    id: 'm7',
    moduleNum: 7,
    name: 'LangGraph Workflow Builder',
    category: 'Orchestration',
    description: 'Visual drag-and-drop agent workflow editor and state persistence.',
    status: 'locked',
    availability: 'Target: Phase 4',
  },
  {
    id: 'm8',
    moduleNum: 8,
    name: 'LangSmith Observability',
    category: 'Tracing',
    description: 'Deep execution trace viewer, token tracking, and latency diagnostics.',
    status: 'completed',
    availability: 'Active Module',
  },
  {
    id: 'm9',
    moduleNum: 9,
    name: 'Multi-Agent Studio',
    category: 'Agents',
    description: 'Collaborative multi-agent orchestration with dedicated roles and tools.',
    status: 'locked',
    availability: 'Target: Phase 4',
  },
  {
    id: 'm10',
    moduleNum: 10,
    name: 'Embedding Explorer',
    category: 'Vectors',
    description: 'Nearest neighbor prompt vector relationship graph.',
    status: 'locked',
    availability: 'Target: Phase 5',
  },
  {
    id: 'm11',
    moduleNum: 11,
    name: 'Architecture Visualizer',
    category: 'System',
    description: 'Interactive system flow diagram and live telemetry stream.',
    status: 'locked',
    availability: 'Target: Phase 5',
  },
  {
    id: 'm12',
    moduleNum: 12,
    name: 'AI Analytics',
    category: 'Metrics',
    description: 'Workspace token usage, model distribution, latency, and cost analytics.',
    status: 'locked',
    availability: 'Target: Phase 5',
  },
];

export const AILearningRoadmap: React.FC = () => {
  return (
    <div className="rounded-3xl border border-[#3A3A3A] bg-[#262626]/90 backdrop-blur-xl p-6 md:p-8 space-y-8 shadow-2xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#3A3A3A]">
        <div className="space-y-1">
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-[#FF7F11]" />
            Platform Overview & Roadmap
          </h2>
          <p className="text-xs text-[#A3A3A3] font-sans leading-relaxed">
            Enterprise roadmap transforming PromptForge AI into a full-stack AI Engineering platform.
          </p>
        </div>

        <span className="text-xs font-mono font-semibold px-3.5 py-1.5 rounded-full bg-[#FF7F11]/10 text-[#FF7F11] border border-[#FF7F11]/20 shadow-md">
          2 of 12 Modules Active
        </span>
      </div>

      {/* Clean Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {MILESTONES.map((m, idx) => {
          let cardGlow = '';
          let badgeColor = '';

          if (m.status === 'completed') {
            cardGlow = 'border-[#4ADE80]/30 bg-[#4ADE80]/4 hover:border-[#4ADE80]/60 shadow-[0_0_20px_rgba(74,222,128,0.06)]';
            badgeColor = 'bg-[#4ADE80]/15 text-[#4ADE80] border-[#4ADE80]/30';
          } else if (m.status === 'active') {
            cardGlow = 'border-[#FF7F11]/30 bg-[#FF7F11]/4 hover:border-[#FF7F11]/60 shadow-[0_0_20px_rgba(255,127,17,0.06)]';
            badgeColor = 'bg-[#FF7F11]/15 text-[#FF7F11] border-[#FF7F11]/30';
          } else if (m.status === 'upcoming') {
            cardGlow = 'border-white/15 bg-white/[0.02] hover:border-white/30';
            badgeColor = 'bg-white/10 text-white/80 border-white/20';
          } else {
            cardGlow = 'border-[#3A3A3A] bg-[#0A0A0A]/50 hover:border-white/10 opacity-60';
            badgeColor = 'bg-slate-500/15 text-slate-400 border-slate-500/30';
          }

          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              whileHover={{ y: -2 }}
              className={`p-6 md:p-8 rounded-2xl border transition-all duration-300 flex flex-col justify-between space-y-4 ${cardGlow}`}
            >
              <div className="space-y-3">
                {/* Single Clean Status Badge */}
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${badgeColor}`}>
                    {m.status === 'completed' ? '✓ Completed' : m.status === 'active' ? '⚡ Active' : m.status === 'upcoming' ? '• Upcoming' : '🔒 Locked'}
                  </span>
                  <span className="text-[10px] font-mono text-[#737373]">Module {m.moduleNum}</span>
                </div>

                {/* Module Name (Card Title) */}
                <h3 className="text-base font-bold text-slate-100 tracking-tight">
                  {m.name}
                </h3>

                {/* Short Description */}
                <p className="text-xs text-[#A3A3A3] leading-relaxed font-sans">
                  {m.description}
                </p>
              </div>

              {/* Progress Label at Bottom */}
              <div className="pt-3 border-t border-white/5 font-mono text-[10px] text-[#A3A3A3] flex items-center justify-between">
                <span className="text-[#737373] uppercase tracking-wider">Status</span>
                <span className="text-slate-200 font-semibold">{m.availability}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
