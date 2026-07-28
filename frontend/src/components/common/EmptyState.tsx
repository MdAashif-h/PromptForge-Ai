import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, type LucideIcon } from 'lucide-react';

interface ActionButton {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  icon?: LucideIcon;
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actions?: ActionButton[];
  samplePrompts?: { title: string; prompt: string; onClick: (text: string) => void }[];
  align?: 'left' | 'center';
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actions,
  samplePrompts,
  align = 'center',
  className = '',
}) => {
  const isLeft = align === 'left';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`w-full ${
        isLeft 
          ? 'max-w-2xl ml-0 mr-auto text-left items-start justify-start' 
          : 'max-w-3xl mx-auto text-center items-center justify-center'
      } rounded-3xl border border-[#3A3A3A] bg-[#262626]/90 backdrop-blur-2xl p-8 md:p-10 space-y-6 shadow-2xl relative overflow-hidden flex flex-col my-6 ${className}`}
    >
      {/* Background Radial Glow */}
      <div 
        className={`absolute ${
          isLeft 
            ? 'top-0 left-0 translate-x-0 translate-y-0' 
            : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
        } w-80 h-80 bg-gradient-to-tr from-[#FF7F11]/15 to-transparent rounded-full blur-3xl pointer-events-none`} 
      />

      {/* Icon Badge */}
      <div className={`flex w-full ${isLeft ? 'justify-start' : 'justify-center'} z-10`}>
        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-[#FF7F11]/20 flex items-center justify-center text-[#FF7F11] shadow-[0_0_25px_rgba(255,127,17,0.1)]">
          <Icon className="w-7 h-7 text-[#FF7F11]" />
        </div>
      </div>

      {/* Text Content */}
      <div className={`space-y-2 z-10 w-full ${isLeft ? 'text-left' : 'text-center max-w-lg mx-auto'}`}>
        <h3 className="text-xl font-bold text-white tracking-tight leading-snug">{title}</h3>
        <p className="text-xs md:text-sm text-[#A3A3A3] leading-relaxed font-sans">
          {description}
        </p>
      </div>

      {/* Primary & Secondary Actions */}
      {actions && actions.length > 0 && (
        <div className={`flex flex-wrap ${isLeft ? 'justify-start' : 'justify-center'} items-center gap-3 z-10 pt-1`}>
          {actions.map((act, idx) => {
            const ActIcon = act.icon;
            const isPrimary = act.variant !== 'secondary';
            return (
              <button
                key={idx}
                onClick={act.onClick}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-xl cursor-pointer ${
                  isPrimary
                    ? 'bg-[#FF7F11] text-[#0A0A0A] hover:scale-105 shadow-[0_0_20px_rgba(255,127,17,0.2)] border-none'
                    : 'bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10'
                }`}
              >
                {ActIcon && <ActIcon className="w-4 h-4" />}
                <span>{act.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* One-click Sample Content Loaders */}
      {samplePrompts && samplePrompts.length > 0 && (
        <div className={`w-full pt-5 border-t border-white/10 space-y-3 z-10 flex flex-col ${isLeft ? 'items-start' : 'items-center justify-center'}`}>
          <span className={`text-[11px] font-mono text-[#A3A3A3] uppercase tracking-widest flex items-center gap-1.5 font-semibold w-full ${isLeft ? 'justify-start' : 'justify-center'}`}>
            <Sparkles className="w-3.5 h-3.5 text-[#FF7F11]" /> Try a Quick Sample
          </span>
          <div className={`flex flex-wrap ${isLeft ? 'justify-start' : 'justify-center'} items-center gap-3 w-full`}>
            {samplePrompts.map((sample, idx) => (
              <button
                key={idx}
                onClick={() => sample.onClick(sample.prompt)}
                className="px-4 py-2.5 rounded-xl border border-white/15 bg-white/[0.04] hover:bg-[#FF7F11]/20 hover:border-[#FF7F11]/50 text-xs text-slate-200 transition-all font-mono shadow-md cursor-pointer font-semibold"
              >
                {sample.title}
              </button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};
