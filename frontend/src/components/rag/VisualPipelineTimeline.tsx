import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, Clock, AlertCircle } from 'lucide-react';
import type { PipelineStageLog } from '@/types/rag';

interface VisualPipelineTimelineProps {
  logs: PipelineStageLog[];
  isProcessing: boolean;
  error?: string;
}

const STAGES = [
  'Validate File',
  'Extract Text',
  'Clean & Normalize Text',
  'Chunk Document',
  'Generate Embeddings',
  'Generate Metadata',
  'Store Metadata in SQLite',
  'Store Embeddings in ChromaDB',
];

export const VisualPipelineTimeline: React.FC<VisualPipelineTimelineProps> = ({
  logs,
  isProcessing,
  error,
}) => {
  const currentStageIndex = logs.length > 0 ? logs[logs.length - 1].stage - 1 : isProcessing ? 0 : -1;

  return (
    <div className="rounded-2xl border border-[#3A3A3A] bg-[#262626]/80 backdrop-blur-xl p-5 shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold tracking-wider text-slate-300 uppercase flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#FF7F11] animate-pulse" />
          Enterprise RAG Ingestion Pipeline
        </h4>
        {isProcessing && (
          <span className="text-xs text-[#FF7F11] flex items-center gap-1 font-mono">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing Stages...
          </span>
        )}
      </div>

      <div className="space-y-3">
        {STAGES.map((stageName, idx) => {
          let status: 'completed' | 'processing' | 'pending' | 'error' = 'pending';
          const stageLog = logs.find((l) => l.stage === idx + 1);

          if (stageLog) {
            status = 'completed';
          } else if (isProcessing && idx === currentStageIndex + 1) {
            status = 'processing';
          } else if (error && idx === currentStageIndex + 1) {
            status = 'error';
          }

          return (
            <motion.div
              key={stageName}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`flex items-start justify-between p-3 rounded-xl border transition-all duration-300 ${
                status === 'completed'
                  ? 'border-[#4ADE80]/30 bg-[#4ADE80]/5 text-[#4ADE80]'
                  : status === 'processing'
                  ? 'border-[#FF7F11]/50 bg-[#FF7F11]/10 text-slate-100'
                  : status === 'error'
                  ? 'border-red-500/50 bg-red-500/10 text-red-300'
                  : 'border-white/5 bg-white/[0.02] text-[#737373]'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {status === 'completed' && <CheckCircle2 className="w-4 h-4 text-[#4ADE80]" />}
                  {status === 'processing' && <Loader2 className="w-4 h-4 text-[#FF7F11] animate-spin" />}
                  {status === 'pending' && <Clock className="w-4 h-4 text-[#737373]" />}
                  {status === 'error' && <AlertCircle className="w-4 h-4 text-red-400" />}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono opacity-60">Stage {idx + 1}</span>
                    <span className="text-xs font-medium">{stageName}</span>
                  </div>
                  {stageLog?.detail && (
                    <p className="text-[11px] text-[#A3A3A3] mt-0.5 font-mono">{stageLog.detail}</p>
                  )}
                </div>
              </div>

              <span
                className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full border ${
                  status === 'completed'
                    ? 'border-[#4ADE80]/40 bg-[#4ADE80]/20 text-[#4ADE80]'
                    : status === 'processing'
                    ? 'border-[#FF7F11]/40 bg-[#FF7F11]/20 text-[#FF7F11]'
                    : status === 'error'
                    ? 'border-red-500/40 bg-red-500/20 text-red-300'
                    : 'border-slate-700 bg-slate-800/50 text-[#737373]'
                }`}
              >
                {status}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
