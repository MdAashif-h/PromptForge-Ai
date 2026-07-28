import { useState } from 'react';
import { motion } from 'framer-motion';
import { Server, Cpu, Check, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { pageTransition } from '@/animations/variants';

export default function SettingsPage() {
  const [model, setModel] = useState('gpt-4o-mini');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    toast.success('Settings saved locally');
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <motion.div variants={pageTransition} initial="initial" animate="animate" exit="exit" className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Settings</h1>
        <p className="text-sm text-[#A3A3A3]">
          Configure API connection and default model parameters.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {/* Model Selection */}
        <div className="glass-card p-6 border border-[#3A3A3A] bg-[#262626]">
          <div className="flex items-center gap-2 mb-4">
            <Cpu size={18} className="text-[#FF7F11]" />
            <h3 className="text-base font-semibold text-white">Default Model</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            {[
              { id: 'gpt-4o-mini', name: 'GPT-4o Mini', badge: 'Fast & Cheap', desc: 'Ideal for prompt testing & scoring' },
              { id: 'gpt-4o', name: 'GPT-4o', badge: 'Most Capable', desc: 'Best for complex reasoning' },
              { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', badge: 'Legacy', desc: 'Standard completions model' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setModel(m.id)}
                className="p-4 rounded-xl text-left cursor-pointer transition-all border"
                style={{
                  background: model === m.id ? 'rgba(255, 127, 17, 0.15)' : '#0A0A0A',
                  borderColor: model === m.id ? '#FF7F11' : '#3A3A3A',
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-white">{m.name}</span>
                  {model === m.id && <Check size={14} className="text-[#FF7F11]" />}
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium mb-2 inline-block bg-white/5 text-[#A3A3A3]">
                  {m.badge}
                </span>
                <p className="text-xs text-[#737373]">{m.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Backend Info */}
        <div className="glass-card p-6 border border-[#3A3A3A] bg-[#262626]">
          <div className="flex items-center gap-2 mb-4">
            <Server size={18} className="text-[#FF7F11]" />
            <h3 className="text-base font-semibold text-white">Backend Connection</h3>
          </div>
          <div className="flex flex-col gap-3 text-sm font-mono">
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#0A0A0A] border border-[#3A3A3A]">
              <span className="text-[#A3A3A3]">API Base URL</span>
              <code className="text-xs px-2 py-1 rounded bg-[#1A1A1A] text-[#FF7F11]">http://localhost:8000</code>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#0A0A0A] border border-[#3A3A3A]">
              <span className="text-[#A3A3A3]">Vector DB</span>
              <span className="text-xs text-[#4ADE80]">ChromaDB Persistent (Cosine)</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#0A0A0A] border border-[#3A3A3A]">
              <span className="text-[#A3A3A3]">Metadata Storage</span>
              <span className="text-xs text-[#4ADE80]">SQLite (promptforge.db)</span>
            </div>
          </div>
        </div>

        {/* Security & API Key */}
        <div className="glass-card p-6 border border-[#3A3A3A] bg-[#262626]">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={18} className="text-[#FF7F11]" />
            <h3 className="text-base font-semibold text-white">API Key Management</h3>
          </div>
          <p className="text-xs leading-relaxed mb-3 text-[#A3A3A3]">
            OpenAI API key is configured on the backend via <code className="text-[#FF7F11]">.env</code> file. No plain text keys are stored in client-side local storage or logs.
          </p>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="px-6 py-2.5 rounded-lg text-sm font-semibold text-[#0A0A0A] bg-[#FF7F11] cursor-pointer border-none"
          >
            {saved ? 'Saved!' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
