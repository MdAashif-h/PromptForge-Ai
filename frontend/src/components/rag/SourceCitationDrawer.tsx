import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Copy, Check, ChevronDown, ChevronUp, Layers, Hash, Percent } from 'lucide-react';
import type { SourceCitation } from '@/types/rag';

interface SourceCitationDrawerProps {
  citations: SourceCitation[];
}

export const SourceCitationDrawer: React.FC<SourceCitationDrawerProps> = ({ citations }) => {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  if (!citations || citations.length === 0) {
    return null;
  }

  const handleCopy = (citationId: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(citationId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-3 mt-6 border-t border-[#3A3A3A] pt-5">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
        <Layers className="w-4 h-4 text-[#FF7F11]" />
        Source Citations ({citations.length} Grounded Context Chunks)
      </h4>

      <div className="grid grid-cols-1 gap-2.5">
        {citations.map((cit) => {
          const isExpanded = expandedId === cit.citation_id;
          const isCopied = copiedId === cit.citation_id;

          return (
            <motion.div
              key={cit.citation_id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-[#3A3A3A] bg-[#262626]/90 overflow-hidden hover:border-[#FF7F11]/40 transition-all"
            >
              <div className="p-3.5 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-6 h-6 rounded-full bg-[#FF7F11]/20 border border-[#FF7F11]/40 text-[#FF7F11] font-mono font-bold flex items-center justify-center text-[11px] shrink-0">
                    {cit.citation_id}
                  </span>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-200 truncate">{cit.document_name}</span>
                      <span className="text-[10px] font-mono text-[#4ADE80] bg-[#4ADE80]/10 px-2 py-0.5 rounded border border-[#4ADE80]/20 flex items-center gap-0.5">
                        <Percent className="w-2.5 h-2.5" />
                        {cit.similarity_percent}% Match
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-[#A3A3A3] font-mono mt-0.5">
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3 text-[#737373]" /> Page {cit.page_number}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Hash className="w-3 h-3 text-[#737373]" /> Chunk #{cit.chunk_number}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleCopy(cit.citation_id, cit.full_content)}
                    className="p-1.5 rounded-lg text-[#737373] hover:text-slate-200 hover:bg-white/5 transition-colors cursor-pointer"
                    title="Copy Chunk Text"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-[#4ADE80]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => setExpandedId(isExpanded ? null : cit.citation_id)}
                    className="p-1.5 rounded-lg text-[#737373] hover:text-slate-200 hover:bg-white/5 transition-colors cursor-pointer"
                    title="Expand Full Chunk"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Preview text when collapsed */}
              {!isExpanded && (
                <div className="px-3.5 pb-3 text-xs text-[#A3A3A3] font-mono line-clamp-2 border-t border-white/5 pt-2">
                  "{cit.content_preview}"
                </div>
              )}

              {/* Expanded text */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="p-3.5 border-t border-white/5 bg-white/[0.02] text-xs font-mono text-slate-300 space-y-2"
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{cit.full_content}</p>
                    <div className="pt-2 text-[10px] text-[#737373] border-t border-white/5 flex items-center justify-between">
                      <span>Chunk ID: {cit.chunk_id}</span>
                      <span>Strategy: {cit.metadata.strategy || 'Recursive'}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
