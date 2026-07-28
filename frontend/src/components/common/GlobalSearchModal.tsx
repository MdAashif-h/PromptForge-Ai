import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Wand2, BookOpen, History, CornerDownLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getPrompts, getHistory } from '@/services/api';
import { listDocuments } from '@/services/ragApi';
import type { SavedPrompt, HistoryEntry } from '@/types';
import type { DocumentMetadata } from '@/types/rag';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchResultItem {
  id: string;
  type: 'prompt' | 'document' | 'history';
  title: string;
  subtitle: string;
  path: string;
  category?: string;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'prompts' | 'documents' | 'history'>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const [prompts, setPrompts] = useState<SavedPrompt[]>([]);
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch search index items when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      Promise.all([
        getPrompts().catch(() => []),
        listDocuments().catch(() => []),
        getHistory().catch(() => []),
      ]).then(([pList, dList, hList]) => {
        setPrompts(pList);
        setDocuments(dList);
        setHistory(hList);
        setIsLoading(false);
      });

      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Global Ctrl + K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Build filtered search results
  const results: SearchResultItem[] = [];
  const q = query.trim().toLowerCase();

  if (activeTab === 'all' || activeTab === 'prompts') {
    prompts.forEach((p) => {
      if (!q || p.title.toLowerCase().includes(q) || p.prompt_text.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q)) {
        results.push({
          id: p.id,
          type: 'prompt',
          title: p.title,
          subtitle: p.prompt_text.substring(0, 80) + '...',
          category: p.category || 'Prompt Library',
          path: '/dashboard/library',
        });
      }
    });
  }

  if (activeTab === 'all' || activeTab === 'documents') {
    documents.forEach((d) => {
      if (!q || d.filename.toLowerCase().includes(q) || d.embedding_model.toLowerCase().includes(q) || d.file_type.toLowerCase().includes(q)) {
        results.push({
          id: d.id,
          type: 'document',
          title: d.filename,
          subtitle: `${d.chunk_count} Chunks • ${d.page_count} Pages • ${d.file_type}`,
          category: 'Knowledge Base',
          path: '/dashboard/knowledge-base',
        });
      }
    });
  }

  if (activeTab === 'all' || activeTab === 'history') {
    history.forEach((h) => {
      if (!q || h.prompt_text.toLowerCase().includes(q) || h.action_type.toLowerCase().includes(q)) {
        results.push({
          id: h.id,
          type: 'history',
          title: `${h.action_type.toUpperCase()} Action`,
          subtitle: h.prompt_text.substring(0, 80) + '...',
          category: 'Activity History',
          path: '/dashboard/studio',
        });
      }
    });
  }

  const handleSelect = (item: SearchResultItem) => {
    onClose();
    navigate(item.path);
  };

  const handleKeyDownInput = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-md"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          className="relative w-full max-w-2xl rounded-2xl border border-[#3A3A3A] bg-[#262626] shadow-2xl overflow-hidden z-10 font-sans"
        >
          {/* Search Input Field */}
          <div className="flex items-center px-4 h-14 border-b border-[#3A3A3A] bg-[#1A1A1A]">
            <Search className="w-5 h-5 text-[#737373] mr-3 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDownInput}
              placeholder="Search Prompts, Knowledge Documents, History... (CTRL + K)"
              className="w-full bg-transparent text-sm text-[#F5F5F5] placeholder-[#737373] outline-none"
            />
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-[#737373] hover:text-[#F5F5F5] hover:bg-white/5 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5 bg-[#0A0A0A] text-xs font-mono">
            {[
              { id: 'all', label: 'All Results' },
              { id: 'prompts', label: 'Prompts' },
              { id: 'documents', label: 'Knowledge Base' },
              { id: 'history', label: 'History' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setSelectedIndex(0);
                }}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-[#FF7F11]/15 text-[#FF7F11] border border-[#FF7F11]/30 font-semibold'
                    : 'text-[#737373] hover:text-[#A3A3A3]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Results List */}
          <div className="max-h-80 overflow-y-auto p-2 space-y-1">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-[#737373] font-mono">
                Indexing PromptForge workspace items...
              </div>
            ) : results.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#737373] font-mono">
                No matching items found for "{query}".
              </div>
            ) : (
              results.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                let ItemIcon = Wand2;
                if (item.type === 'document') ItemIcon = BookOpen;
                if (item.type === 'history') ItemIcon = History;

                return (
                  <div
                    key={`${item.type}_${item.id}`}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#FF7F11]/15 border border-[#FF7F11]/30 text-[#F5F5F5]'
                        : 'border border-transparent text-[#A3A3A3] hover:bg-white/[0.03]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-2 rounded-lg border ${
                        item.type === 'prompt'
                          ? 'border-[#FF7F11]/30 bg-[#FF7F11]/10 text-[#FF7F11]'
                          : 'border-white/10 bg-white/5 text-white/70'
                      }`}>
                        <ItemIcon className="w-4 h-4" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-[#F5F5F5] truncate">{item.title}</span>
                          <span className="text-[10px] font-mono text-[#737373] bg-white/5 px-2 py-0.5 rounded">
                            {item.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#737373] truncate mt-0.5 font-mono">{item.subtitle}</p>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="flex items-center gap-1 text-[11px] text-[#FF7F11] font-mono shrink-0">
                        <span>Select</span>
                        <CornerDownLeft className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Shortcuts */}
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-[#3A3A3A] bg-[#1A1A1A] text-[10px] text-[#737373] font-mono">
            <div className="flex items-center gap-3">
              <span><kbd className="bg-white/10 px-1 py-0.5 rounded">↑</kbd> <kbd className="bg-white/10 px-1 py-0.5 rounded">↓</kbd> Navigate</span>
              <span><kbd className="bg-white/10 px-1 py-0.5 rounded">↵</kbd> Open</span>
              <span><kbd className="bg-white/10 px-1 py-0.5 rounded">ESC</kbd> Close</span>
            </div>
            <span>PromptForge AI Global Search</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
