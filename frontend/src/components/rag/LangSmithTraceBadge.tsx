import React, { useState } from 'react';
import { ExternalLink, Activity, Cpu, Zap, Coins, HelpCircle, Info } from 'lucide-react';
import type { LangSmithTraceMeta } from '@/types/rag';

interface LangSmithTraceBadgeProps {
  trace: LangSmithTraceMeta;
}

export const LangSmithTraceBadge: React.FC<LangSmithTraceBadgeProps> = ({ trace }) => {
  const [showInfo, setShowInfo] = useState(false);
  if (!trace) return null;

  return (
    <div className="space-y-2 mt-4 font-mono text-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl border border-[#FF7F11]/30 bg-[#FF7F11]/10 text-xs font-mono shadow-lg">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="flex items-center gap-1.5 font-semibold text-[#FF7F11]">
            <Activity className="w-4 h-4" />
            LangSmith Trace Active
          </span>

          <span className="text-[#A3A3A3]">
            ID: <span className="text-slate-200">{trace.trace_id}</span>
          </span>

          <span className="flex items-center gap-1 text-[#4ADE80]">
            <Zap className="w-3.5 h-3.5" />
            {trace.latency_ms} ms
          </span>

          <span className="flex items-center gap-1 text-purple-400">
            <Coins className="w-3.5 h-3.5" />
            {trace.total_tokens} tokens
          </span>

          <span className="flex items-center gap-1 text-[#FF7F11]">
            <Cpu className="w-3.5 h-3.5" />
            {trace.model_used}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 transition-colors cursor-pointer"
            title="LangSmith Workspace Access Help"
          >
            <HelpCircle size={14} />
          </button>

          <a
            href={trace.trace_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-[#FF7F11] hover:text-white transition-colors bg-[#FF7F11]/20 px-3 py-1.5 rounded-xl border border-[#FF7F11]/40 font-semibold cursor-pointer"
          >
            <span>Inspect Trace</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {showInfo && (
        <div className="p-4 rounded-2xl border border-[#FF7F11]/30 bg-[#FF7F11]/10 text-slate-200 font-sans text-xs space-y-2">
          <div className="flex items-center gap-2 text-[#FF7F11] font-bold font-mono">
            <Info size={16} /> Why does LangSmith show "No Access"?
          </div>
          <p className="leading-relaxed">
            LangSmith project traces belong to the owner of the API key set in <code className="text-[#FF7F11] font-mono">backend/.env</code> (<code className="text-[#FF7F11] font-mono">LANGSMITH_API_KEY</code>). If your browser is logged into a different personal LangSmith workspace, smith.langchain.com will show "No Access".
          </p>
          <p className="leading-relaxed">
            To view traces directly in your own LangSmith organization, replace <code className="text-[#FF7F11] font-mono">LANGSMITH_API_KEY</code> in <code className="text-[#FF7F11] font-mono">backend/.env</code> with your own free API key from <a href="https://smith.langchain.com" target="_blank" rel="noreferrer" className="text-[#FF7F11] underline font-mono">smith.langchain.com</a>.
          </p>
        </div>
      )}
    </div>
  );
};
