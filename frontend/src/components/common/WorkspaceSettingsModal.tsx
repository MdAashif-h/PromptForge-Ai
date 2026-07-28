import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, X, Cpu, Layers, Key, ShieldCheck, Check } from 'lucide-react';
import { toast } from 'sonner';

interface WorkspaceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WorkspaceSettingsModal: React.FC<WorkspaceSettingsModalProps> = ({ isOpen, onClose }) => {
  const [defaultModel, setDefaultModel] = useState('gpt-4o-mini');
  const [defaultChunkStrategy, setDefaultChunkStrategy] = useState('Recursive');
  const [defaultTopK, setDefaultTopK] = useState(4);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    toast.success('Workspace preferences saved!');
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-lg rounded-2xl border border-[#3A3A3A] bg-[#262626] shadow-2xl p-6 z-10 space-y-6 font-sans"
        >
          <div className="flex items-center justify-between border-b border-[#3A3A3A] pb-4">
            <h3 className="text-lg font-bold text-[#F5F5F5] flex items-center gap-2">
              <Settings className="w-5 h-5 text-[#FF7F11]" />
              Workspace Settings & Preferences
            </h3>

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-[#737373] hover:text-[#F5F5F5] hover:bg-white/5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-5 text-xs font-mono">
            {/* Model Default */}
            <div>
              <label className="block text-[#A3A3A3] font-semibold mb-1 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-white/60" /> Default LLM Model:
              </label>
              <select
                value={defaultModel}
                onChange={(e) => setDefaultModel(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-[#3A3A3A] rounded-xl p-3 text-[#F5F5F5] focus:border-[#FF7F11] outline-none"
              >
                <option value="gpt-4o-mini">gpt-4o-mini (Fast & Cost Effective)</option>
                <option value="gpt-4o">gpt-4o (High Precision Reasoning)</option>
              </select>
            </div>

            {/* Default Chunking */}
            <div>
              <label className="block text-[#A3A3A3] font-semibold mb-1 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-purple-400" /> Default Chunking Strategy:
              </label>
              <select
                value={defaultChunkStrategy}
                onChange={(e) => setDefaultChunkStrategy(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-[#3A3A3A] rounded-xl p-3 text-[#F5F5F5] focus:border-[#FF7F11] outline-none"
              >
                <option value="Recursive">Recursive Character Splitter</option>
                <option value="Fixed Size">Fixed Size Chunking</option>
                <option value="Semantic">Semantic Chunking (Experimental)</option>
              </select>
            </div>

            {/* Default Top K */}
            <div>
              <label className="block text-[#A3A3A3] font-semibold mb-1 flex items-center justify-between">
                <span>Default Vector Top-K Results:</span>
                <span className="text-[#FF7F11] font-bold">{defaultTopK}</span>
              </label>
              <input
                type="range"
                min={2}
                max={10}
                value={defaultTopK}
                onChange={(e) => setDefaultTopK(Number(e.target.value))}
                className="w-full accent-[#FF7F11] bg-[#1A1A1A] h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* API Status Cards */}
            <div className="p-3 rounded-xl border border-white/5 bg-white/[0.02] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[#737373] flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-[#FF7F11]" /> OpenAI API Key:
                </span>
                <span className="text-[#4ADE80] font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Configured (.env)
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#737373] flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-white/60" /> LangSmith Key:
                </span>
                <span className="text-[#4ADE80] font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Active Tracing
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#FF7F11] text-[#0A0A0A] font-semibold text-xs flex items-center gap-2 hover:opacity-90 transition-all shadow-lg border-none cursor-pointer"
              >
                {saved ? <Check className="w-4 h-4 text-[#0A0A0A]" /> : null}
                <span>{saved ? 'Preferences Saved' : 'Save Preferences'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
