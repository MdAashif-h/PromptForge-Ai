import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, ChevronDown, ChevronUp } from 'lucide-react';
import type { RAGStepPayload } from '@/types/rag';

interface LightweightRAGExplorerProps {
  steps: RAGStepPayload[];
}

export const LightweightRAGExplorer: React.FC<LightweightRAGExplorerProps> = ({ steps }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!steps || steps.length === 0) return null;

  return (
    <div className="rounded-xl border border-[#3A3A3A] bg-[#262626]/90 backdrop-blur-xl overflow-hidden mt-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-3.5 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-300 hover:bg-white/5 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-[#FF7F11]" />
          <span>Inline RAG Pipeline Explorer</span>
          <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
            {steps.length} Processing Steps
          </span>
        </div>

        {isOpen ? <ChevronUp className="w-4 h-4 text-[#737373]" /> : <ChevronDown className="w-4 h-4 text-[#737373]" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="p-4 border-t border-white/5 space-y-3 font-mono text-xs"
          >
            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-[#FF7F11] before:to-[#4ADE80]">
              {steps.map((stepPayload) => (
                <div key={stepPayload.step} className="relative">
                  <span className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-[#0A0A0A] border-2 border-[#FF7F11] text-[10px] font-bold text-[#FF7F11] flex items-center justify-center">
                    {stepPayload.step}
                  </span>

                  <div className="p-3 rounded-lg border border-white/5 bg-white/[0.02]">
                    <div className="flex items-center justify-between font-semibold text-slate-200">
                      <span className="text-sm">{stepPayload.title}</span>
                      {stepPayload.latency_ms && (
                        <span className="text-[10px] text-[#FF7F11]">{stepPayload.latency_ms} ms</span>
                      )}
                    </div>

                    <p className="text-[#A3A3A3] mt-1">{stepPayload.description}</p>

                    {stepPayload.context_snippet && (
                      <div className="mt-2 p-2 rounded bg-black/40 border border-white/5 text-[11px] text-slate-300">
                        <span className="text-[10px] text-[#737373] uppercase block mb-1">Constructed Context Snippet</span>
                        "{stepPayload.context_snippet}"
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
