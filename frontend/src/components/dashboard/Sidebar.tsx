import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Wand2,
  ArrowLeftRight,
  Library,
  BookOpen,
  Settings,
  X,
  ChevronLeft,
  ChevronRight,
  Bot,
  Activity,
  Layers,
  ShieldCheck,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Multi-Agent Studio', path: '/dashboard/multi-agent', icon: Bot },
  { label: 'RAG Evaluation', path: '/dashboard/rag-eval', icon: ShieldCheck },
  { label: 'Prompt Studio', path: '/dashboard/studio', icon: Wand2 },
  { label: 'Compare', path: '/dashboard/compare', icon: ArrowLeftRight },
  { label: 'Library', path: '/dashboard/library', icon: Library },
  { label: 'Knowledge Base', path: '/dashboard/knowledge-base', icon: BookOpen },
  { label: 'Analytics', path: '/dashboard/analytics', icon: Activity },
  { label: 'Architecture', path: '/dashboard/architecture', icon: Layers },
  { label: 'Settings', path: '/dashboard/settings', icon: Settings },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Sidebar({ isOpen, onClose, isCollapsed, onToggleCollapse }: SidebarProps) {
  const location = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-full flex flex-col transition-all duration-300 ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
        style={{
          background: '#121212',
          borderRight: '1px solid #3A3A3A',
        }}
      >
        {/* Logo & Collapse */}
        <div className="flex items-center justify-between px-4 h-16" style={{ borderBottom: '1px solid #3A3A3A' }}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-md"
              style={{ background: '#FF7F11' }}
            >
              <span className="text-[#0A0A0A] font-bold text-base">P</span>
            </div>
            {!isCollapsed && (
              <span className="font-semibold text-sm text-[#F5F5F5] tracking-wide whitespace-nowrap">
                Prompt<span className="text-[#FF7F11]">Forge</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onToggleCollapse}
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              className="hidden md:flex p-1.5 rounded-lg text-[#737373] hover:text-[#F5F5F5] hover:bg-white/5 transition-colors cursor-pointer border-none bg-transparent"
            >
              {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
            <button
              onClick={onClose}
              className="md:hidden p-1.5 rounded-lg text-[#737373] hover:text-[#F5F5F5] transition-colors cursor-pointer border-none bg-transparent"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1 relative">
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path !== '/dashboard' && location.pathname.startsWith(item.path));

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                title={isCollapsed ? item.label : undefined}
                className={`relative flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all text-sm ${
                  isActive
                    ? 'text-[#FF7F11] font-medium'
                    : 'text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-white/5'
                } ${isCollapsed ? 'justify-center px-0' : ''}`}
              >
                {/* Animated active pill */}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-xl bg-[#FF7F11]/8 border border-[#FF7F11]/20"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                <item.icon size={20} className="shrink-0 relative z-10" />
                {!isCollapsed && <span className="relative z-10 tracking-wide">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Status */}
        <div className="px-3 py-4 font-mono text-xs" style={{ borderTop: '1px solid #3A3A3A' }}>
          <div className={`p-3 rounded-xl border border-[#3A3A3A] bg-white/[0.02] ${isCollapsed ? 'flex justify-center' : 'space-y-2'}`}>
            {!isCollapsed ? (
              <>
                <div className="flex items-center justify-between text-[11px] font-semibold text-[#A3A3A3]">
                  <span>Workspace Status</span>
                  <div className="w-2 h-2 rounded-full bg-[#4ADE80] animate-pulse" />
                </div>
                <div className="space-y-1 text-[10px] text-[#737373]">
                  {['FastAPI', 'OpenAI', 'ChromaDB', 'LangSmith'].map((s) => (
                    <div key={s} className="flex items-center justify-between">
                      <span>{s}</span>
                      <span className="text-[#4ADE80] font-bold">✓</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="w-2.5 h-2.5 rounded-full bg-[#4ADE80] animate-pulse" title="Workspace Engines: Online" />
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
