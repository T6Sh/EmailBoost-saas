import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

function formatError(detail) {
  if (!detail) return 'Something went wrong. Please try again.';
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) return detail.map((e) => e?.msg || JSON.stringify(e)).join(' ');
  return String(detail);
}

export default function AuthModal({ isOpen, onClose, defaultTab = 'login', onSuccess }) {
  const [tab, setTab] = useState(defaultTab);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, register } = useAuth();

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({ name: '', email: '', password: '' });

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(loginForm.email, loginForm.password);
      toast.success('Welcome back!');
      onClose();
      onSuccess?.();
    } catch (err) {
      setError(formatError(err.response?.data?.detail) || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    if (signupForm.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await register(signupForm.name, signupForm.email, signupForm.password);
      toast.success('Welcome to EmailBoost!');
      onClose();
      onSuccess?.();
    } catch (err) {
      setError(formatError(err.response?.data?.detail) || err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 z-10"
        >
          <button data-testid="auth-modal-close" onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>

          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 mb-1">
              <div className="w-7 h-7 bg-[#2563EB] rounded-lg flex items-center justify-center">
                <Mail className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-black text-lg text-[#0A0A0A]" style={{ fontFamily: "'Cabinet Grotesk', Inter, sans-serif" }}>
                Email<span className="text-[#2563EB]">Boost</span>
              </span>
            </div>
            <p className="text-xs text-[#525252]">
              {tab === 'login' ? 'Welcome back' : 'Create your free account'}
            </p>
          </div>

          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            {['login', 'signup'].map((t) => (
              <button
                key={t}
                data-testid={`auth-tab-${t}`}
                onClick={() => { setTab(t); setError(''); }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t ? 'bg-white shadow-sm text-[#0A0A0A]' : 'text-[#525252]'}`}
              >
                {t === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
              {error}
            </div>
          )}

          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#0A0A0A] mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input data-testid="login-email-input" type="email" required value={loginForm.email}
                    onChange={(e) => setLoginForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="your@email.com"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#0A0A0A] mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input data-testid="login-password-input" type="password" required value={loginForm.password}
                    onChange={(e) => setLoginForm((p) => ({ ...p, password: e.target.value }))}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                  />
                </div>
              </div>
              <button data-testid="login-submit-btn" type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-[#2563EB] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#1D4ED8] transition-all disabled:opacity-60"
              >
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><span>Sign In</span> <ArrowRight className="w-4 h-4" /></>}
              </button>
              <div className="text-center">
                <button type="button" onClick={() => { setTab('signup'); setError(''); }} className="text-xs text-[#525252] hover:text-[#2563EB] transition-colors">
                  Don't have an account? <span className="font-semibold">Sign up free</span>
                </button>
              </div>
              <div className="text-center">
                <button type="button" onClick={onClose} className="text-xs text-gray-400 hover:text-[#525252] transition-colors">
                  Continue as guest (1 free generation)
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#0A0A0A] mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input data-testid="signup-name-input" type="text" required value={signupForm.name}
                    onChange={(e) => setSignupForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="John Smith"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#0A0A0A] mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input data-testid="signup-email-input" type="email" required value={signupForm.email}
                    onChange={(e) => setSignupForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="your@email.com"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#0A0A0A] mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input data-testid="signup-password-input" type="password" required minLength={6}
                    value={signupForm.password}
                    onChange={(e) => setSignupForm((p) => ({ ...p, password: e.target.value }))}
                    placeholder="Min. 6 characters"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                  />
                </div>
              </div>
              <button data-testid="signup-submit-btn" type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-[#2563EB] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#1D4ED8] transition-all disabled:opacity-60"
              >
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><span>Create Free Account</span> <ArrowRight className="w-4 h-4" /></>}
              </button>
              <p className="text-xs text-center text-[#525252]">
                3 free generations/month. No credit card needed.
              </p>
              <div className="text-center">
                <button type="button" onClick={onClose} className="text-xs text-gray-400 hover:text-[#525252] transition-colors">
                  Continue as guest (1 free generation)
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
