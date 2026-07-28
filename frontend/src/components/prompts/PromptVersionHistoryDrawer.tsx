import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, GitBranch, ArrowLeftRight, RotateCcw, Plus, X, Tag, FileText, Check } from 'lucide-react';
import { toast } from 'sonner';
import { fetchPromptVersions, createPromptVersion, restorePromptVersion, fetchPromptVersionDiff } from '@/services/api';
import type { PromptVersion } from '@/types';

interface PromptVersionHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  promptId: string;
  currentPromptText: string;
  onRestore: (restoredText: string) => void;
}

export function PromptVersionHistoryDrawer({
  isOpen,
  onClose,
  promptId,
  currentPromptText,
  onRestore,
}: PromptVersionHistoryDrawerProps) {
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [changeNotes, setChangeNotes] = useState('');
  const [tagInput, setTagInput] = useState('v1.1-release');

  // Diff modal states
  const [showDiffModal, setShowDiffModal] = useState(false);
  const [versionA, setVersionA] = useState<number>(1);
  const [versionB, setVersionB] = useState<number>(1);
  const [diffHtml, setDiffHtml] = useState<string>('');
  const [diffLoading, setDiffLoading] = useState(false);

  const loadVersions = async () => {
    if (!promptId) return;
    setLoading(true);
    try {
      const list = await fetchPromptVersions(promptId);
      setVersions(list);
      if (list.length >= 2) {
        setVersionA(list[list.length - 1].version_number);
        setVersionB(list[0].version_number);
      }
    } catch (err) {
      toast.error('Failed to load version history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadVersions();
    }
  }, [isOpen, promptId]);

  const handleCommitVersion = async () => {
    if (!changeNotes.trim()) {
      toast.error('Please add change notes before committing version.');
      return;
    }
    const toastId = toast.loading('Committing new prompt version...');
    try {
      await createPromptVersion(promptId, {
        prompt_text: currentPromptText,
        change_notes: changeNotes,
        tags: [tagInput]
      });
      toast.success('New version committed successfully!', { id: toastId });
      setChangeNotes('');
      await loadVersions();
    } catch (err) {
      toast.error('Failed to commit version.', { id: toastId });
    }
  };

  const handleRestore = async (versionNum: number) => {
    const toastId = toast.loading(`Restoring version v${versionNum}...`);
    try {
      const res = await restorePromptVersion(promptId, versionNum);
      onRestore(res.prompt_text);
      toast.success(`Prompt restored to version v${versionNum}!`, { id: toastId });
      onClose();
    } catch (err) {
      toast.error('Failed to restore version.', { id: toastId });
    }
  };

  const handleComputeDiff = async () => {
    setDiffLoading(true);
    try {
      const res = await fetchPromptVersionDiff(promptId, versionA, versionB);
      setDiffHtml(res.diff_html);
      setShowDiffModal(true);
    } catch (err) {
      toast.error('Failed to compute version diff.');
    } finally {
      setDiffLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end">
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="bg-[#121217] border-l border-slate-800 w-full max-w-lg h-full flex flex-col p-6 shadow-2xl space-y-6 text-slate-100"
        >
          {/* Drawer Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-purple-400" />
              <h2 className="text-lg font-bold text-white">Prompt Version Control</h2>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Commit New Version Section */}
          <div className="bg-[#181820] rounded-xl p-4 border border-slate-800 space-y-3">
            <h3 className="text-xs font-semibold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Commit New Version
            </h3>
            <input
              type="text"
              placeholder="Change notes (e.g. Added role grounding & strict schema)..."
              value={changeNotes}
              onChange={(e) => setChangeNotes(e.target.value)}
              className="w-full bg-[#121217] border border-slate-700/60 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
            />
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Tag (e.g., prod-v1)"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                className="flex-1 bg-[#121217] border border-slate-700/60 rounded-lg p-2 text-xs text-slate-200 focus:outline-none"
              />
              <button
                onClick={handleCommitVersion}
                className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/20"
              >
                Commit
              </button>
            </div>
          </div>

          {/* Compare Diff Trigger */}
          {versions.length >= 2 && (
            <div className="bg-[#181820] rounded-xl p-4 border border-slate-800 space-y-3">
              <h3 className="text-xs font-semibold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                <ArrowLeftRight className="w-3.5 h-3.5" /> Compare Version Diff
              </h3>
              <div className="flex items-center gap-2">
                <select
                  value={versionA}
                  onChange={(e) => setVersionA(Number(e.target.value))}
                  className="bg-[#121217] border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
                >
                  {versions.map((v) => (
                    <option key={v.id} value={v.version_number}>
                      v{v.version_number}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-slate-400">vs</span>
                <select
                  value={versionB}
                  onChange={(e) => setVersionB(Number(e.target.value))}
                  className="bg-[#121217] border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
                >
                  {versions.map((v) => (
                    <option key={v.id} value={v.version_number}>
                      v{v.version_number}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleComputeDiff}
                  disabled={diffLoading}
                  className="flex-1 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold"
                >
                  Compare
                </button>
              </div>
            </div>
          )}

          {/* Version History List */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Version Timeline ({versions.length})</h3>

            {versions.map((v) => (
              <div key={v.id} className="p-3.5 bg-[#181820] rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-500/30">
                      v{v.version_number}
                    </span>
                    <span className="text-xs text-slate-300 font-medium">{v.change_notes || 'Version update'}</span>
                  </div>
                  <button
                    onClick={() => handleRestore(v.version_number)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs flex items-center gap-1"
                    title="Restore version"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-purple-400" />
                  </button>
                </div>

                <p className="text-[11px] text-slate-400 font-mono line-clamp-2 bg-[#121217] p-2 rounded-lg border border-slate-800">
                  {v.prompt_text}
                </p>

                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span>Branch: {v.branch_name || 'main'}</span>
                  <span>{new Date(v.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Diff Modal */}
        {showDiffModal && (
          <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
            <div className="bg-[#121217] border border-slate-800 rounded-2xl max-w-4xl w-full p-6 space-y-4 max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ArrowLeftRight className="w-4 h-4 text-cyan-400" /> Version Diff (v{versionA} vs v{versionB})
                </h3>
                <button onClick={() => setShowDiffModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div
                className="flex-1 overflow-auto bg-[#0A0A0C] p-4 rounded-xl text-xs font-mono text-slate-200 border border-slate-800"
                dangerouslySetInnerHTML={{ __html: diffHtml }}
              />
            </div>
          </div>
        )}
      </div>
    </AnimatePresence>
  );
}
