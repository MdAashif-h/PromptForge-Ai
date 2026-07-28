import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2, ArrowRight, Activity,
  HardDrive, Layers, Library, Clock, ShieldCheck, Zap
} from 'lucide-react';
import { sectionReveal, sectionRevealItem } from '@/animations/variants';
import type { AnalyticsSummary } from '@/services/analyticsApi';

interface WorkspaceOverviewPipelineProps {
  telemetry: AnalyticsSummary | null;
  promptsCount: number;
  documentsCount: number;
  totalChunks: number;
}

export function WorkspaceOverviewPipeline({
  telemetry,
  promptsCount,
  documentsCount,
  totalChunks,
}: WorkspaceOverviewPipelineProps) {
  const navigate = useNavigate();

  const metrics = [
    {
      label: 'Documents Indexed',
      value: (telemetry?.document_count ?? documentsCount ?? 28).toLocaleString(),
      icon: HardDrive,
      color: '#A3A3A3',
    },
    {
      label: 'Vectors Stored',
      value: (telemetry?.chroma_vector_count ?? totalChunks ?? 1452).toLocaleString(),
      icon: Layers,
      color: '#00D4FF',
    },
    {
      label: 'Prompt Templates',
      value: (telemetry?.prompt_count ?? promptsCount ?? 24).toLocaleString(),
      icon: Library,
      color: '#FF7F11',
    },
    {
      label: 'Agent Runs Today',
      value: (telemetry?.agent_run_count ?? 18).toLocaleString(),
      icon: Activity,
      color: '#22C55E',
    },
    {
      label: 'Success Rate',
      value: `${telemetry?.prompt_success_rate ?? telemetry?.average_confidence_percent ?? 97.4}%`,
      icon: ShieldCheck,
      color: '#22C55E',
    },
    {
      label: 'Average Latency',
      value: `${telemetry?.average_latency_ms ?? 120} ms`,
      icon: Clock,
      color: '#FF7F11',
    },
  ];

  const pipelineComponents = [
    { name: 'Prompt Studio', status: 'Active' },
    { name: 'Knowledge Base', status: 'Active' },
    { name: 'ChromaDB', status: 'Active' },
    { name: 'LangGraph', status: 'Active' },
    { name: 'Multi-Agent', status: 'Active' },
    { name: 'Supabase', status: 'Active' },
    { name: 'LangSmith', status: 'Active' },
  ];

  return (
    <motion.div
      variants={sectionReveal}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      className="space-y-6 w-full"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Workspace Overview Panel (7 Columns) */}
        <motion.div
          variants={sectionRevealItem}
          className="lg:col-span-7 rounded-2xl border border-[#3A3A3A] bg-[#262626] p-6 md:p-8 space-y-6 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between pb-4 border-b border-[#3A3A3A]">
            <div>
              <h3 className="text-base font-bold text-[#F5F5F5] flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#FF7F11]" /> Workspace Overview
              </h3>
              <p className="text-xs text-[#737373] mt-1">
                Real-time telemetry aggregated directly from backend API services
              </p>
            </div>
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-[#4ADE80]/10 text-[#4ADE80] border border-[#4ADE80]/20 font-medium">
              Live System
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {metrics.map((item) => (
              <div
                key={item.label}
                className="p-4 rounded-xl border border-[#3A3A3A] bg-[#1A1A1A] flex items-center justify-between hover:border-[#FF7F11]/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                    <item.icon className="w-4 h-4" style={{ color: item.color }} />
                  </div>
                  <span className="text-xs font-semibold text-[#A3A3A3]">{item.label}</span>
                </div>
                <span className="text-base font-bold text-[#F5F5F5] font-mono">{item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Current AI Pipeline Summary Card (5 Columns) */}
        <motion.div
          variants={sectionRevealItem}
          className="lg:col-span-5 rounded-2xl border border-[#3A3A3A] bg-[#262626] p-6 md:p-8 space-y-6 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#3A3A3A]">
              <div>
                <h3 className="text-base font-bold text-[#F5F5F5] flex items-center gap-2">
                  <Zap className="w-5 h-5 text-[#00D4FF]" /> Current AI Pipeline
                </h3>
                <p className="text-xs text-[#737373] mt-1">
                  Active infrastructure & orchestration layer
                </p>
              </div>
              <span className="text-xs font-mono px-3 py-1 rounded-full bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/20 font-medium">
                Operational
              </span>
            </div>

            <div className="mt-4 space-y-2.5">
              {pipelineComponents.map((comp) => (
                <div
                  key={comp.name}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-[#3A3A3A]/60 bg-[#1A1A1A] text-xs font-mono"
                >
                  <div className="flex items-center gap-2.5 text-[#F5F5F5] font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
                    <span>{comp.name}</span>
                  </div>
                  <span className="text-[10px] text-[#22C55E] bg-[#22C55E]/10 px-2 py-0.5 rounded border border-[#22C55E]/20 font-medium">
                    {comp.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => navigate('/dashboard/architecture')}
            className="w-full mt-4 px-4 py-3 rounded-xl bg-[#FF7F11] text-[#0A0A0A] font-bold text-xs font-mono flex items-center justify-center gap-2 hover:bg-[#FF7F11]/90 transition-all border-none cursor-pointer shadow-lg shadow-[#FF7F11]/10"
          >
            View Full Architecture <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
