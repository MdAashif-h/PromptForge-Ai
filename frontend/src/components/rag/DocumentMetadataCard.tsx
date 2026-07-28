import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Trash2, ChevronDown, ChevronUp, Layers, HardDrive, Tag } from 'lucide-react';
import type { DocumentMetadata } from '@/types/rag';

interface DocumentMetadataCardProps {
  doc: DocumentMetadata;
  onDelete: (id: string) => void;
}

export const DocumentMetadataCard: React.FC<DocumentMetadataCardProps> = ({ doc, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileBadgeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case '.pdf':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      case '.docx':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case '.csv':
        return 'bg-[#4ADE80]/10 text-[#4ADE80] border-[#4ADE80]/30';
      default:
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="rounded-xl border border-[#3A3A3A] bg-[#262626]/90 hover:border-[#FF7F11]/40 transition-all duration-300 overflow-hidden shadow-lg"
    >
      <div className="p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`p-2.5 rounded-lg border ${getFileBadgeColor(doc.file_type)}`}>
            <FileText className="w-5 h-5" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-slate-200 truncate">{doc.filename}</h4>
              <span className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full border ${getFileBadgeColor(doc.file_type)}`}>
                {doc.file_type}
              </span>
              {doc.workspace_id === 'system_default' ? (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 font-semibold">
                  Default Guide
                </span>
              ) : (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FF7F11]/15 text-[#FF7F11] border border-[#FF7F11]/30 font-semibold">
                  Workspace Doc
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-[#A3A3A3] mt-1 font-mono">
              <span className="flex items-center gap-1">
                <HardDrive className="w-3.5 h-3.5 text-[#737373]" />
                {formatBytes(doc.file_size)}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-[#FF7F11]" />
                {doc.chunk_count} Chunks
              </span>
              <span>•</span>
              <span>{doc.page_count} Pages</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg text-[#737373] hover:text-slate-200 hover:bg-white/5 transition-colors cursor-pointer"
            title="Toggle Rich Metadata"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          <button
            onClick={() => onDelete(doc.id)}
            className="p-1.5 rounded-lg text-[#737373] hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
            title="Delete Document"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/5 bg-white/[0.02] p-4 text-xs space-y-3"
          >
            <div className="grid grid-cols-2 gap-3 text-slate-300 font-mono">
              <div>
                <span className="text-[#737373] block text-[10px] uppercase">Document ID</span>
                <span className="truncate block">{doc.id}</span>
              </div>
              <div>
                <span className="text-[#737373] block text-[10px] uppercase">Embedding Model</span>
                <span className="text-[#FF7F11]">{doc.embedding_model}</span>
              </div>
              <div>
                <span className="text-[#737373] block text-[10px] uppercase">Chunk Strategy</span>
                <span className="text-purple-400">{doc.chunk_strategy}</span>
              </div>
              <div>
                <span className="text-[#737373] block text-[10px] uppercase">Word / Char Count</span>
                <span>{doc.word_count.toLocaleString()} words ({doc.char_count.toLocaleString()} chars)</span>
              </div>
              <div>
                <span className="text-[#737373] block text-[10px] uppercase">Author / Version</span>
                <span>{doc.author} (v{doc.version})</span>
              </div>
              <div>
                <span className="text-[#737373] block text-[10px] uppercase">Uploaded At</span>
                <span>{new Date(doc.created_at).toLocaleString()}</span>
              </div>
            </div>

            {doc.tags.length > 0 && (
              <div className="flex items-center gap-1.5 pt-2 border-t border-white/5">
                <Tag className="w-3.5 h-3.5 text-[#737373]" />
                <div className="flex flex-wrap gap-1">
                  {doc.tags.map((t) => (
                    <span key={t} className="px-2 py-0.5 rounded bg-white/5 text-[10px] text-slate-300 font-mono border border-white/10">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
