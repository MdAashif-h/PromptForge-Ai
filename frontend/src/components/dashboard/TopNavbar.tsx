import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, User, PanelLeftClose, PanelLeftOpen, Bell, ChevronRight, LogIn, X, Sparkles, CheckCircle2, Plus, FolderPlus, Building2 } from 'lucide-react';
import { ProfileMenu } from '@/components/common/ProfileMenu';
import { AuthModal } from '@/components/auth/AuthModal';
import { useAuth } from '@/context/AuthContext';
import { useWorkspace } from '@/context/WorkspaceContext';

interface TopNavbarProps {
  onMenuClick: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onOpenSearch: () => void;
  onOpenSettings: () => void;
}

export default function TopNavbar({
  onMenuClick,
  isCollapsed,
  onToggleCollapse,
  onOpenSearch,
  onOpenSettings,
}: TopNavbarProps) {
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { workspaces, projects, activeWorkspace, activeProject, setActiveWorkspace, setActiveProject, addWorkspace, addProject } = useWorkspace();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  
  // Modals for creating new workspace/project
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [newWsDesc, setNewWsDesc] = useState('');
  const [newProjName, setNewProjName] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim()) return;
    setIsSubmitting(true);
    try {
      await addWorkspace(newWsName.trim(), newWsDesc.trim());
      setNewWsName('');
      setNewWsDesc('');
      setShowWorkspaceModal(false);
    } catch (err) {
      console.error('Failed to create workspace:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) return;
    setIsSubmitting(true);
    try {
      await addProject(newProjName.trim(), newProjDesc.trim());
      setNewProjName('');
      setNewProjDesc('');
      setShowProjectModal(false);
    } catch (err) {
      console.error('Failed to create project:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between px-6 md:px-8 h-16 transition-all duration-300"
      style={{
        background: 'rgba(10, 10, 10, 0.92)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid #3A3A3A',
      }}
    >
      {/* Left: Collapse, Workspace & Project Switchers */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex p-2 rounded-xl text-[#737373] hover:text-[#F5F5F5] hover:bg-white/5 transition-colors cursor-pointer border-none bg-transparent"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
        </button>

        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-xl text-[#737373] hover:text-[#F5F5F5] hover:bg-white/5 transition-colors cursor-pointer border-none bg-transparent"
        >
          <PanelLeftOpen size={20} />
        </button>

        {/* Workspace & Project Selectors + Create Controls */}
        <div className="hidden lg:flex items-center gap-2 text-xs font-mono">
          <div className="flex items-center gap-1">
            <select
              value={activeWorkspace?.id || 'ws_default'}
              onChange={(e) => {
                const selected = workspaces.find((w) => w.id === e.target.value);
                if (selected) setActiveWorkspace(selected);
              }}
              className="bg-[#1A1A1A] text-[#F5F5F5] border border-[#3A3A3A] rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer text-xs"
            >
              {workspaces.map((w) => (
                <option key={w.id} value={w.id}>
                  Workspace: {w.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowWorkspaceModal(true)}
              title="Create New Workspace"
              className="p-1.5 rounded-lg bg-[#262626] border border-[#3A3A3A] hover:border-[#FF7F11] text-[#A3A3A3] hover:text-[#FF7F11] transition-colors cursor-pointer"
            >
              <Plus size={14} />
            </button>
          </div>

          <span className="text-[#737373]">/</span>

          <div className="flex items-center gap-1">
            <select
              value={activeProject?.id || 'proj_default'}
              onChange={(e) => {
                const selected = projects.find((p) => p.id === e.target.value);
                if (selected) setActiveProject(selected);
              }}
              className="bg-[#1A1A1A] text-[#FF7F11] border border-[#3A3A3A] rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer text-xs font-bold"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  Project: {p.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowProjectModal(true)}
              title="Create New Project in Active Workspace"
              className="p-1.5 rounded-lg bg-[#262626] border border-[#3A3A3A] hover:border-[#FF7F11] text-[#A3A3A3] hover:text-[#FF7F11] transition-colors cursor-pointer"
            >
              <FolderPlus size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4 relative">
        <button
          onClick={onOpenSearch}
          className="hidden md:flex items-center gap-3 px-4 py-2.5 rounded-xl border border-[#3A3A3A] bg-[#262626] hover:border-[#FF7F11]/30 transition-all text-left group cursor-pointer"
          style={{ minWidth: '260px' }}
        >
          <Search size={15} className="text-[#737373] group-hover:text-[#FF7F11] transition-colors" />
          <span className="text-xs text-[#737373] group-hover:text-[#A3A3A3] transition-colors flex-1 font-mono">
            Global Search...
          </span>
          <kbd className="text-[10px] px-2 py-0.5 rounded font-mono bg-white/5 text-[#737373] border border-[#3A3A3A]">
            CTRL + K
          </kbd>
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2.5 rounded-xl text-[#737373] hover:text-[#F5F5F5] hover:bg-white/5 transition-colors relative cursor-pointer"
            title="System Notifications"
          >
            <Bell size={19} />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#FF7F11] animate-pulse" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 top-14 z-50 w-80 p-4 rounded-2xl border border-[#3A3A3A] bg-[#262626] backdrop-blur-2xl shadow-2xl space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#3A3A3A]">
                <span className="font-bold text-[#A3A3A3] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#FF7F11]" /> System Notifications
                </span>
                <button onClick={() => setNotificationsOpen(false)} className="text-[#737373] hover:text-[#A3A3A3]">
                  <X size={14} />
                </button>
              </div>
              <div className="p-3 rounded-xl bg-[#4ADE80]/8 border border-[#4ADE80]/15 text-[#4ADE80] leading-relaxed text-[11px]">
                Workspace-scoped RAG documents index online. Active filtering enabled.
              </div>
              <div className="p-3 rounded-xl bg-[#FF7F11]/8 border border-[#FF7F11]/15 text-[#FF7F11] leading-relaxed text-[11px]">
                Dynamic project vector retrieval isolation operational.
              </div>
            </div>
          )}
        </div>

        {/* Auth / Profile */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#4ADE80]/25 bg-[#4ADE80]/8 text-xs font-mono text-[#4ADE80]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="truncate max-w-[120px] font-semibold">{user?.name}</span>
            </div>
          ) : (
            <button
              onClick={() => {
                setAuthMode('signin');
                setAuthModalOpen(true);
              }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#3A3A3A] bg-white/5 hover:bg-white/8 text-xs font-mono text-[#A3A3A3] transition-colors cursor-pointer"
            >
              <LogIn size={14} /> Sign In
            </button>
          )}

          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer shadow-md hover:scale-105 transition-transform overflow-hidden border border-[#3A3A3A]"
              style={{ background: '#FF7F11' }}
            >
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <User size={17} color="#0A0A0A" />
              )}
            </button>

            <ProfileMenu
              isOpen={profileOpen}
              onClose={() => setProfileOpen(false)}
              onOpenSettings={onOpenSettings}
            />
          </div>
        </div>
      </div>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} initialMode={authMode} />

      {/* CREATE WORKSPACE MODAL */}
      {showWorkspaceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#1A1A1A] border border-[#3A3A3A] rounded-2xl p-6 shadow-2xl space-y-5 font-mono">
            <div className="flex items-center justify-between border-b border-[#3A3A3A] pb-3">
              <div className="flex items-center gap-2 text-[#F5F5F5] font-bold text-sm">
                <Building2 size={18} className="text-[#FF7F11]" />
                <span>Create New Workspace</span>
              </div>
              <button
                onClick={() => setShowWorkspaceModal(false)}
                className="text-[#737373] hover:text-[#F5F5F5] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <div>
                <label className="block text-xs text-[#A3A3A3] mb-1.5">Workspace Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Healthcare AI R&D"
                  value={newWsName}
                  onChange={(e) => setNewWsName(e.target.value)}
                  className="w-full bg-[#262626] border border-[#3A3A3A] text-[#F5F5F5] rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#FF7F11]"
                />
              </div>

              <div>
                <label className="block text-xs text-[#A3A3A3] mb-1.5">Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Workspace scope and domain objectives..."
                  value={newWsDesc}
                  onChange={(e) => setNewWsDesc(e.target.value)}
                  className="w-full bg-[#262626] border border-[#3A3A3A] text-[#F5F5F5] rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-[#FF7F11]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowWorkspaceModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-[#A3A3A3] hover:bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newWsName.trim()}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#FF7F11] text-[#0A0A0A] hover:bg-[#FF7F11]/90 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Creating...' : 'Create Workspace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE PROJECT MODAL */}
      {showProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#1A1A1A] border border-[#3A3A3A] rounded-2xl p-6 shadow-2xl space-y-5 font-mono">
            <div className="flex items-center justify-between border-b border-[#3A3A3A] pb-3">
              <div className="flex items-center gap-2 text-[#F5F5F5] font-bold text-sm">
                <FolderPlus size={18} className="text-[#FF7F11]" />
                <span>Create New Project</span>
              </div>
              <button
                onClick={() => setShowProjectModal(false)}
                className="text-[#737373] hover:text-[#F5F5F5] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div className="p-3 rounded-xl bg-[#262626] border border-[#3A3A3A] text-[11px] text-[#A3A3A3]">
                Target Workspace: <strong className="text-[#FF7F11]">{activeWorkspace?.name || 'Enterprise Workspace'}</strong>
              </div>

              <div>
                <label className="block text-xs text-[#A3A3A3] mb-1.5">Project Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Clinical Guidelines RAG"
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  className="w-full bg-[#262626] border border-[#3A3A3A] text-[#F5F5F5] rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-[#FF7F11]"
                />
              </div>

              <div>
                <label className="block text-xs text-[#A3A3A3] mb-1.5">Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Project details and target vector store..."
                  value={newProjDesc}
                  onChange={(e) => setNewProjDesc(e.target.value)}
                  className="w-full bg-[#262626] border border-[#3A3A3A] text-[#F5F5F5] rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-[#FF7F11]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProjectModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-[#A3A3A3] hover:bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newProjName.trim()}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#FF7F11] text-[#0A0A0A] hover:bg-[#FF7F11]/90 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
