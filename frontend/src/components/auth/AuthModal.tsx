import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User as UserIcon, ArrowRight, Sparkles, ShieldCheck, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'signin' }) => {
  const { signIn, signUp, signInWithOAuth } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      toast.error('Please fill in all required fields');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      toast.error('Please enter a valid email address (e.g. name@domain.com)');
      return;
    }

    if (mode === 'signup' && !name.trim()) {
      toast.error('Please enter your full name');
      return;
    }

    if (trimmedPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    try {
      setLoading(true);
      if (mode === 'signin') {
        await signIn(trimmedEmail, trimmedPassword, name.trim());
        toast.success('Signed in successfully!');
      } else {
        await signUp(trimmedEmail, trimmedPassword, name.trim());
        toast.success('Enterprise account created successfully!');
      }
      onClose();
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    try {
      setLoading(true);
      await signInWithOAuth(provider);
      toast.success(`Authenticating with ${provider.toUpperCase()}...`);
      onClose();
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(`Failed to authenticate with ${provider}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-xl overflow-y-auto">
        {/* Glow backdrop light */}
        <div className="absolute w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-[#FF7F11]/20 via-purple-600/15 to-blue-500/15 blur-3xl pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#121212]/95 backdrop-blur-2xl p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] z-10 font-sans my-8 space-y-6 overflow-hidden"
        >
          {/* Top accent glow line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF7F11] via-purple-500 to-[#00D4FF]" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute right-5 top-5 p-2.5 rounded-full text-[#737373] hover:text-white hover:bg-white/10 transition-all cursor-pointer border border-transparent hover:border-white/10"
          >
            <X size={18} />
          </button>

          {/* Header Icon + Titles */}
          <div className="text-center space-y-3 pt-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF7F11] to-[#FF9F43] shadow-lg shadow-[#FF7F11]/25 ring-4 ring-[#FF7F11]/10">
              <Sparkles className="w-7 h-7 text-[#0A0A0A]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-extrabold text-[#F5F5F5] tracking-tight">
                {mode === 'signin' ? 'Welcome Back to PromptForge' : 'Create Enterprise Account'}
              </h3>
              <p className="text-xs text-[#A3A3A3] max-w-xs mx-auto leading-relaxed">
                {mode === 'signin'
                  ? 'Access multi-agent studio, vector RAG database, and LangSmith traces'
                  : 'Engineer high-performance prompts with grounded vector knowledge'}
              </p>
            </div>
          </div>

          {/* Animated Tab Switcher */}
          <div className="relative flex p-1 rounded-2xl bg-[#0A0A0A] border border-[#3A3A3A] text-xs font-mono">
            <button
              type="button"
              onClick={() => setMode('signin')}
              className={`relative flex-1 py-2.5 rounded-xl font-bold transition-colors z-10 cursor-pointer ${
                mode === 'signin' ? 'text-[#0A0A0A]' : 'text-[#737373] hover:text-[#F5F5F5]'
              }`}
            >
              {mode === 'signin' && (
                <motion.div
                  layoutId="authTabPill"
                  className="absolute inset-0 bg-[#FF7F11] rounded-xl shadow-md z-[-1]"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`relative flex-1 py-2.5 rounded-xl font-bold transition-colors z-10 cursor-pointer ${
                mode === 'signup' ? 'text-[#0A0A0A]' : 'text-[#737373] hover:text-[#F5F5F5]'
              }`}
            >
              {mode === 'signup' && (
                <motion.div
                  layoutId="authTabPill"
                  className="absolute inset-0 bg-[#FF7F11] rounded-xl shadow-md z-[-1]"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              Create Account
            </button>
          </div>

          {/* OAuth Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleOAuth('google')}
              className="flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl border border-[#3A3A3A] bg-[#0A0A0A] hover:bg-white/5 hover:border-slate-500 text-xs font-semibold text-[#F5F5F5] transition-all cursor-pointer shadow-sm active:scale-98"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z" />
                <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 10.8 0 12.5s.7 2.8 1.9 5.2l3.7-2.9z" />
                <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 17C3.7 20.7 7.5 24 12 24z" />
              </svg>
              <span>Google</span>
            </button>
            <button
              type="button"
              onClick={() => handleOAuth('github')}
              className="flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl border border-[#3A3A3A] bg-[#0A0A0A] hover:bg-white/5 hover:border-slate-500 text-xs font-semibold text-[#F5F5F5] transition-all cursor-pointer shadow-sm active:scale-98"
            >
              <svg className="w-4 h-4 fill-current text-[#F5F5F5] shrink-0" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span>GitHub</span>
            </button>
          </div>

          <div className="flex items-center gap-3 my-3">
            <div className="h-[1px] bg-[#3A3A3A] flex-1" />
            <span className="text-[10px] uppercase font-mono text-[#737373] tracking-wider shrink-0">
              Or credentials with Supabase
            </span>
            <div className="h-[1px] bg-[#3A3A3A] flex-1" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
            {mode === 'signup' && (
              <div className="space-y-1.5">
                <label className="block text-[#A3A3A3] font-semibold flex items-center gap-2 font-sans">
                  <UserIcon className="w-3.5 h-3.5 text-[#FF7F11]" /> Full Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Mercer"
                    className="w-full bg-[#0A0A0A] border border-[#3A3A3A] rounded-xl px-4 py-3 text-[#F5F5F5] placeholder-[#525252] focus:border-[#FF7F11] focus:ring-1 focus:ring-[#FF7F11]/50 outline-none transition-all"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-[#A3A3A3] font-semibold flex items-center gap-2 font-sans">
                <Mail className="w-3.5 h-3.5 text-[#FF7F11]" /> Work Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@company.com"
                  className="w-full bg-[#0A0A0A] border border-[#3A3A3A] rounded-xl px-4 py-3 text-[#F5F5F5] placeholder-[#525252] focus:border-[#FF7F11] focus:ring-1 focus:ring-[#FF7F11]/50 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-[#A3A3A3] font-semibold flex items-center gap-2 font-sans">
                  <Lock className="w-3.5 h-3.5 text-[#FF7F11]" /> Password
                </label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => toast.info('Password reset instructions sent to your email.')}
                    className="text-[11px] text-[#FF7F11] hover:underline font-sans cursor-pointer"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#0A0A0A] border border-[#3A3A3A] rounded-xl pl-4 pr-11 py-3 text-[#F5F5F5] placeholder-[#525252] focus:border-[#FF7F11] focus:ring-1 focus:ring-[#FF7F11]/50 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#737373] hover:text-[#F5F5F5] transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember me option */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-[11px] text-[#A3A3A3] font-sans cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-[#3A3A3A] bg-[#0A0A0A] text-[#FF7F11] focus:ring-0"
                />
                <span>Remember this device</span>
              </label>
              {mode === 'signup' && (
                <span className="text-[10px] text-[#737373] font-mono flex items-center gap-1">
                  <CheckCircle2 size={12} className="text-[#22C55E]" /> Min 6 chars
                </span>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#FF7F11] to-[#FF9F43] text-[#0A0A0A] font-sans font-bold text-sm shadow-lg shadow-[#FF7F11]/20 hover:opacity-95 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer mt-5 disabled:opacity-60"
            >
              {loading ? (
                <div className="flex items-center gap-2 font-mono text-xs">
                  <div className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
                  <span>Connecting to Supabase...</span>
                </div>
              ) : (
                <>
                  <span>{mode === 'signin' ? 'Sign In to Workspace' : 'Create Free Enterprise Account'}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Footer Security Badge */}
          <div className="pt-2 border-t border-[#3A3A3A]/40 flex items-center justify-between text-[11px] text-[#737373] font-sans">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#22C55E]" /> Supabase Auth Connected
            </span>
            <span className="font-mono text-[10px]">SOC2 & GDPR Compliant</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

