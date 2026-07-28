import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, HelpCircle, ChevronDown, CheckCircle2, ArrowRight } from 'lucide-react';

export interface GuideStep {
  title: string;
  desc: string;
  icon?: any;
}

interface FriendlyGuideBannerProps {
  pageTitle: string;
  badge: string;
  tagline: string;
  steps: GuideStep[];
  tipText?: string;
  defaultExpanded?: boolean;
}

export const FriendlyGuideBanner: React.FC<FriendlyGuideBannerProps> = ({
  pageTitle,
  badge,
  tagline,
  steps,
  tipText,
  defaultExpanded = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="w-full rounded-3xl border border-[#3A3A3A] bg-[#121212] p-6 md:p-8 space-y-6 shadow-xl relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-[#FF7F11]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF7F11]/10 border border-[#FF7F11]/25 text-[11px] font-mono font-semibold text-[#FF7F11]">
            <Sparkles className="w-3.5 h-3.5" />
            {badge}
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            {pageTitle}
          </h1>
          <p className="text-xs md:text-sm text-[#A3A3A3] max-w-2xl font-sans leading-relaxed">
            {tagline}
          </p>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="self-start md:self-center px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-slate-300 hover:bg-white/10 transition-all flex items-center gap-2 cursor-pointer"
        >
          <HelpCircle className="w-4 h-4 text-[#FF7F11]" />
          <span>{isExpanded ? 'Hide Quick Guide' : 'How This Page Works 💡'}</span>
          <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Collapsible 3-Step Visual Guide */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="pt-4 border-t border-[#3A3A3A]/80 space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {steps.map((step, idx) => {
                const StepIcon = step.icon || CheckCircle2;
                return (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-[#0A0A0A] border border-[#3A3A3A] space-y-2 relative group hover:border-[#FF7F11]/50 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-[#FF7F11] font-bold">Step {idx + 1}</span>
                      <div className="p-1.5 rounded-lg bg-[#FF7F11]/10 text-[#FF7F11]">
                        <StepIcon className="w-4 h-4" />
                      </div>
                    </div>
                    <h3 className="text-xs font-bold text-white leading-tight">{step.title}</h3>
                    <p className="text-[11px] text-[#A3A3A3] leading-relaxed font-sans">{step.desc}</p>
                  </div>
                );
              })}
            </div>

            {tipText && (
              <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                <span><strong>Pro Tip:</strong> {tipText}</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
