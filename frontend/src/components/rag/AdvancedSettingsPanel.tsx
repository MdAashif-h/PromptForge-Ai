import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sliders, ChevronDown, ChevronUp, Cpu, Layers, Target, Thermometer } from 'lucide-react';

interface AdvancedSettingsPanelProps {
  topK: number;
  setTopK: (val: number) => void;
  similarityThreshold: number;
  setSimilarityThreshold: (val: number) => void;
  temperature: number;
  setTemperature: (val: number) => void;
  model: string;
  setModel: (val: string) => void;
  chunkStrategy: string;
  setChunkStrategy: (val: string) => void;
}

export const AdvancedSettingsPanel: React.FC<AdvancedSettingsPanelProps> = ({
  topK,
  setTopK,
  similarityThreshold,
  setSimilarityThreshold,
  temperature,
  setTemperature,
  model,
  setModel,
  chunkStrategy,
  setChunkStrategy,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-xl border border-[#3A3A3A] bg-[#262626]/90 backdrop-blur-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-3.5 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-300 hover:bg-white/5 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-[#FF7F11]" />
          <span>Advanced Retrieval Settings</span>
          <span className="text-[10px] font-mono text-[#FF7F11] bg-[#FF7F11]/10 px-2 py-0.5 rounded-full border border-[#FF7F11]/20">
            Top-K: {topK} | Threshold: {(similarityThreshold * 100).toFixed(0)}%
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
            className="p-4 border-t border-white/5 space-y-4 text-xs font-mono"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Top K */}
              <div>
                <div className="flex justify-between text-[#A3A3A3] mb-1">
                  <span className="flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-[#FF7F11]" />
                    Top-K Selection:
                  </span>
                  <span className="text-[#FF7F11] font-bold">{topK}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={topK}
                  onChange={(e) => setTopK(Number(e.target.value))}
                  className="w-full accent-[#FF7F11] bg-[#0A0A0A] h-1.5 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Similarity Threshold */}
              <div>
                <div className="flex justify-between text-[#A3A3A3] mb-1">
                  <span className="flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-[#4ADE80]" />
                    Similarity Threshold:
                  </span>
                  <span className="text-[#4ADE80] font-bold">{(similarityThreshold * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min={0.3}
                  max={0.95}
                  step={0.05}
                  value={similarityThreshold}
                  onChange={(e) => setSimilarityThreshold(Number(e.target.value))}
                  className="w-full accent-[#FF7F11] bg-[#0A0A0A] h-1.5 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Temperature */}
              <div>
                <div className="flex justify-between text-[#A3A3A3] mb-1">
                  <span className="flex items-center gap-1.5">
                    <Thermometer className="w-3.5 h-3.5 text-purple-400" />
                    LLM Temperature:
                  </span>
                  <span className="text-purple-400 font-bold">{temperature.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min={0.0}
                  max={1.0}
                  step={0.1}
                  value={temperature}
                  onChange={(e) => setTemperature(Number(e.target.value))}
                  className="w-full accent-[#FF7F11] bg-[#0A0A0A] h-1.5 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Model */}
              <div>
                <label className="block text-[#A3A3A3] mb-1 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-[#FF7F11]" />
                  LLM Model:
                </label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-[#3A3A3A] rounded-lg p-2 text-slate-200 focus:border-[#FF7F11] outline-none"
                >
                  <option value="gpt-4o-mini">gpt-4o-mini (Fast & Efficient)</option>
                  <option value="gpt-4o">gpt-4o (High Precision Reasoning)</option>
                </select>
              </div>

              {/* Chunk Strategy */}
              <div className="sm:col-span-2">
                <label className="block text-[#A3A3A3] mb-1 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#FF7F11]" />
                  Chunking Strategy:
                </label>
                <div className="flex gap-2">
                  {['Recursive', 'Fixed Size', 'Semantic (Preview)'].map((strat) => (
                    <button
                      key={strat}
                      type="button"
                      onClick={() => setChunkStrategy(strat.split(' ')[0])}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
                        chunkStrategy === strat.split(' ')[0]
                          ? 'border-[#FF7F11] bg-[#FF7F11]/20 text-slate-100 font-semibold'
                          : 'border-white/5 bg-white/[0.02] text-[#737373] hover:border-white/20'
                      }`}
                    >
                      {strat}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
