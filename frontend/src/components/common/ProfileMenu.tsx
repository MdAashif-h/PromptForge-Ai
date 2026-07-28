import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Sliders, Activity, LogOut, ShieldCheck, Sparkles, ExternalLink, HelpCircle } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface ProfileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
}

export const ProfileMenu: React.FC<ProfileMenuProps> = ({ isOpen, onClose, onOpenSettings }) => {
  const { user, signOut, isAuthenticated } = useAuth();
  const [apiHealthy, setApiHealthy] = useState<boolean>(true);
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  useEffect(() => {
    if (isOpen) {
      axios.get(`${API_BASE}/health`)
        .then(() => setApiHealthy(true))
        .catch(() => setApiHealthy(false));
    }
  }, [isOpen, API_BASE]);

  if (!isOpen) return null;

  const displayName = user?.name || 'AI Architect';
  const displayEmail = user?.email || 'architect@promptforge.ai';
  const initials = displayName.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2) || 'AI';

  const handleSignOut = () => {
    signOut();
    toast.info('Signed out of PromptForge AI');
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-[#3A3A3A] bg-[#262626]/95 backdrop-blur-2xl shadow-2xl overflow-hidden font-sans">
        {/* User Header */}
        <div className="p-4 border-b border-[#3A3A3A] bg-gradient-to-br from-[#FF7F11]/15 to-transparent">
          <div className="flex items-center gap-3">
            {user?.avatar ? (
              <img src={user.avatar} alt={displayName} className="w-10 h-10 rounded-xl border border-[#3A3A3A] bg-black/40" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-[#FF7F11] flex items-center justify-center text-[#0A0A0A] font-bold shadow-lg">
                {initials}
              </div>
            )}

            <div className="min-w-0">
              <h4 className="text-sm font-bold text-[#F5F5F5] truncate">{displayName}</h4>
              <p className="text-xs text-[#737373] font-mono truncate">{displayEmail}</p>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-[#A3A3A3]">
            <span>Role: {user?.role || 'Enterprise AI Lead'}</span>
            <span className="text-white/80 bg-white/10 px-2 py-0.5 rounded border border-white/20">
              {isAuthenticated ? 'Authenticated' : 'Guest Mode'}
            </span>
          </div>
        </div>

        {/* Status Indicators & LangSmith Workspace Note */}
        <div className="p-3 border-b border-[#3A3A3A] space-y-2 text-xs font-mono">
          <div className="flex items-center justify-between">
            <span className="text-[#A3A3A3] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#4ADE80]" />
              FastAPI Engine:
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
              apiHealthy
                ? 'border-[#4ADE80]/40 bg-[#4ADE80]/10 text-[#4ADE80] font-semibold'
                : 'border-red-500/40 bg-red-500/10 text-red-400 font-semibold'
            }`}>
              {apiHealthy ? 'Connected' : 'Offline'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#A3A3A3] flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-white/60" />
              LangSmith Tracing:
            </span>
            <a
              href="https://smith.langchain.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-white/80 hover:underline flex items-center gap-1 font-semibold"
            >
              Smith Console <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>

          {/* LangSmith Workspace Help Note */}
          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-[#3A3A3A] text-[10px] text-[#A3A3A3] font-sans space-y-1">
            <div className="flex items-center gap-1 text-[#FF7F11] font-semibold font-mono">
              <HelpCircle size={12} /> LangSmith Workspace Access Note:
            </div>
            <p className="text-[#737373] leading-snug">
              Traces log to <code className="text-white">LANGSMITH_API_KEY</code>. If smith.langchain.com shows "No Access", ensure your browser is logged into the LangSmith account owning this API key!
            </p>
          </div>
        </div>

        {/* Menu Actions */}
        <div className="p-2 space-y-1 text-xs">
          <button
            onClick={() => {
              onClose();
              onOpenSettings();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-white/5 transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4 text-[#FF7F11]" />
            <span>Workspace Settings</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenSettings();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-white/5 transition-colors cursor-pointer"
          >
            <Sliders className="w-4 h-4 text-purple-400" />
            <span>Model Preferences</span>
          </button>
        </div>

        {/* Logout / Sign In */}
        <div className="p-2 border-t border-[#3A3A3A] bg-white/[0.01]">
          {isAuthenticated ? (
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors text-xs cursor-pointer font-semibold"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out ({displayName})</span>
            </button>
          ) : (
            <button
              onClick={() => {
                onClose();
                onOpenSettings();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#FF7F11] hover:bg-[#FF7F11]/10 transition-colors text-xs cursor-pointer font-semibold"
            >
              <Sparkles className="w-4 h-4" />
              <span>Sign In / Create Account</span>
            </button>
          )}
        </div>
      </div>
    </AnimatePresence>
  );
};
