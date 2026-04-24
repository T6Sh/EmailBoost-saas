import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

console.log("AUTH MODAL NEW VERSION");
function formatError(detail) {
  if (!detail) return 'Something went wrong. Please try again.';
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) return detail.map((e) => e?.msg || JSON.stringify(e)).join(' ');
  return String(detail);
}

export default function AuthModal({ isOpen, onClose, defaultTab = 'login', onSuccess }) {
  const [tab, setTab] = useState(defaultTab);
  const [step, setStep] = useState('form'); // ✅ NEW: form | otp
  const [otp, setOtp] = useState('');       // ✅ NEW: store OTP
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, register, verifyOtp } = useAuth();

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({ name: '', email: '', password: '' });

  // ---------------- LOGIN ----------------
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


  // ---------------- REGISTER (UPDATED) ----------------
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (signupForm.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const res = await register(
        signupForm.name,
        signupForm.email,
        signupForm.password
      );

      // ✅ IMPORTANT CHANGE: move to OTP step
      if (res.needs_verification) {
        setStep('otp'); // 👉 move to OTP screen
        toast.success('OTP sent to your email');
      } else {
        // fallback (if backend ever auto-login)
        toast.success('Welcome to EmailBoost!');
        onClose();
        onSuccess?.();
      }
    } catch (err) {
      setError(formatError(err.response?.data?.detail) || err.message);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- VERIFY OTP (NEW) ----------------
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await verifyOtp(signupForm.email, otp);

      toast.success('Account verified successfully!');
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
          <button
            data-testid="auth-modal-close"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>

          {/* ---------------- OTP SCREEN ---------------- */}
          {/* ✅ NEW BLOCK: completely new UI for OTP verification */}
          {step === 'otp' ? (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit OTP"
                className="w-full px-4 py-3 border rounded-xl text-center text-lg tracking-widest"
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#2563EB] text-white py-3 rounded-xl font-semibold"
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </form>
          ) : (
            <>
              {/* ORIGINAL UI BELOW (UNCHANGED) */}

              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 bg-[#2563EB] rounded-lg flex items-center justify-center">
                    <Mail className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="font-black text-lg text-[#0A0A0A]">
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
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t
                      ? 'bg-white shadow-sm text-[#0A0A0A]'
                      : 'text-[#525252]'
                      }`}
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
                  <input
                    type="email"
                    required
                    value={loginForm.email}
                    onChange={(e) =>
                      setLoginForm((p) => ({ ...p, email: e.target.value }))
                    }
                    placeholder="Email"
                    className="w-full px-4 py-3 border rounded-xl"
                  />
                  <input
                    type="password"
                    required
                    value={loginForm.password}
                    onChange={(e) =>
                      setLoginForm((p) => ({ ...p, password: e.target.value }))
                    }
                    placeholder="Password"
                    className="w-full px-4 py-3 border rounded-xl"
                  />
                  <button className="w-full bg-[#2563EB] text-white py-3 rounded-xl">
                    Sign In
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-4">
                  <input
                    type="text"
                    required
                    value={signupForm.name}
                    onChange={(e) =>
                      setSignupForm((p) => ({ ...p, name: e.target.value }))
                    }
                    placeholder="Full Name"
                    className="w-full px-4 py-3 border rounded-xl"
                  />
                  <input
                    type="email"
                    required
                    value={signupForm.email}
                    onChange={(e) =>
                      setSignupForm((p) => ({ ...p, email: e.target.value }))
                    }
                    placeholder="Email"
                    className="w-full px-4 py-3 border rounded-xl"
                  />
                  <input
                    type="password"
                    required
                    value={signupForm.password}
                    onChange={(e) =>
                      setSignupForm((p) => ({ ...p, password: e.target.value }))
                    }
                    placeholder="Password"
                    className="w-full px-4 py-3 border rounded-xl"
                  />
                  <button className="w-full bg-[#2563EB] text-white py-3 rounded-xl">
                    Create Account
                  </button>
                </form>
              )}
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
