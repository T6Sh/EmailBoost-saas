import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Zap, Heart, Download, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';
import UpgradeModal from './UpgradeModal';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const INDUSTRIES = ['Marketing', 'SaaS', 'E-commerce', 'Tech', 'Other'];
const EMAIL_TYPES = ['Newsletter', 'Promotional', 'Announcement', 'Follow-up'];

const getRateColor = (rate) => {
  if (rate >= 50) return 'text-green-700 bg-green-50 border border-green-100';
  if (rate >= 40) return 'text-blue-700 bg-blue-50 border border-blue-100';
  return 'text-orange-700 bg-orange-50 border border-orange-100';
};

export default function Demo() {
  const { user } = useAuth();
  const [emailDraft, setEmailDraft] = useState('');
  const [industry, setIndustry] = useState('');
  const [emailType, setEmailType] = useState('');
  const [results, setResults] = useState([]);
  const [generated, setGenerated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [savedItems, setSavedItems] = useState(new Set());
  const [generationsRemaining, setGenerationsRemaining] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    if (user && user.tier === 'free') {
      setGenerationsRemaining(Math.max(0, 3 - (user.generations_this_month || 0)));
    } else if (user && user.tier !== 'free') {
      setGenerationsRemaining(null);
    }
  }, [user]);

  const handleGenerate = async () => {
    // Guest check
    if (!user) {
      const guestUsed = parseInt(localStorage.getItem('guestGenerationsUsed') || '0');
      if (guestUsed >= 1) {
        setShowAuthModal(true);
        return;
      }
    }

    setLoading(true);
    setError('');
    setGenerated(false);

    try {
      const { data } = await axios.post(
        `${API}/generate`,
        { email_draft: emailDraft || 'General email content', industry: industry || 'General', email_type: emailType || 'Email' },
        { withCredentials: true }
      );

      setResults(data.subject_lines || []);
      setGenerated(true);
      setSavedItems(new Set());

      if (!user) {
        localStorage.setItem('guestGenerationsUsed', '1');
      }
      if (data.generations_remaining !== null && data.generations_remaining !== undefined) {
        setGenerationsRemaining(data.generations_remaining);
      }
    } catch (err) {
      if (err.response?.status === 402) {
        setShowUpgradeModal(true);
      } else if (err.response?.status === 401) {
        setShowAuthModal(true);
      } else {
        setError(err.response?.data?.detail || 'Generation failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleSave = async (item, index) => {
    if (!user) { setShowAuthModal(true); return; }
    if (savedItems.has(index)) { toast.info('Already saved'); return; }
    try {
      await axios.post(
        `${API}/favorites`,
        { text: item.text, tone: item.tone || 'General', estimated_open_rate: item.estimatedOpenRate || 0 },
        { withCredentials: true }
      );
      setSavedItems((prev) => new Set([...prev, index]));
      toast.success('Saved to favorites!');
    } catch (err) {
      if (err.response?.data?.message === 'Already saved') {
        setSavedItems((prev) => new Set([...prev, index]));
        toast.info('Already in favorites');
      } else {
        toast.error('Failed to save');
      }
    }
  };

  const exportCSV = () => {
    const headers = ['Subject Line', 'Tone', 'Predicted Open Rate', 'Email Type', 'Industry'];
    const rows = results.map((r) => [r.text, r.tone || '', `${r.estimatedOpenRate || 0}%`, emailType || 'General', industry || 'General']);
    const csv = [headers, ...rows].map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EmailBoost_SubjectLines_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('CSV downloaded!');
  };

  const handleUpgradeFromModal = async () => {
    if (!user) { setShowUpgradeModal(false); setShowAuthModal(true); return; }
    setCheckoutLoading(true);
    try {
      const { data } = await axios.post(`${API}/stripe/checkout`, { plan: 'pro', origin: window.location.origin }, { withCredentials: true });
      window.location.href = data.url;
    } catch {
      toast.error('Failed to start checkout. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <section id="demo" className="py-24 md:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          className="text-center mb-12"
        >
          <div className="text-xs font-bold tracking-[0.2em] uppercase text-[#525252] mb-4">Live Demo</div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[#0A0A0A] mb-3" style={{ fontFamily: "'Cabinet Grotesk', Inter, sans-serif" }}>
            See It In Action
          </h2>
          <p className="text-[#525252] text-base max-w-md mx-auto">
            {user ? (user.tier !== 'free' ? 'Unlimited generations — enjoy!' : `${generationsRemaining ?? 3 - (user.generations_this_month || 0)} free generations remaining this month`) : 'Try our AI subject line generator — no signup required'}
          </p>

          {/* Usage bar for free users */}
          {user && user.tier === 'free' && (
            <div className="flex items-center justify-center gap-3 mt-4">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div key={i} className={`w-6 h-2 rounded-full transition-all ${i < (user.generations_this_month || 0) ? 'bg-[#FF6B35]' : 'bg-gray-200'}`} />
                ))}
              </div>
              <span className="text-xs text-[#525252] font-medium">
                {user.generations_this_month || 0}/3 used this month
              </span>
            </div>
          )}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            className="bg-gray-50 rounded-2xl p-8 border border-gray-100"
          >
            <h3 className="font-bold text-[#0A0A0A] mb-6 text-lg" style={{ fontFamily: "'Cabinet Grotesk', Inter, sans-serif" }}>
              Your Email Details
            </h3>

            <div className="mb-5">
              <label className="block text-sm font-semibold text-[#0A0A0A] mb-2">Email Draft</label>
              <textarea
                data-testid="email-draft-input"
                value={emailDraft}
                onChange={(e) => setEmailDraft(e.target.value)}
                placeholder="We're launching a new product next week, excited about the features..."
                rows={5}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] resize-none transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-[#0A0A0A] mb-2">Industry</label>
                <select data-testid="industry-select" value={industry} onChange={(e) => setIndustry(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all cursor-pointer"
                >
                  <option value="">Select Industry</option>
                  {INDUSTRIES.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#0A0A0A] mb-2">Email Type</label>
                <select data-testid="email-type-select" value={emailType} onChange={(e) => setEmailType(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all cursor-pointer"
                >
                  <option value="">Select Type</option>
                  {EMAIL_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
            </div>

            {error && (
              <div className="mb-4 flex items-start gap-2 bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-xl">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <button
              data-testid="generate-subject-lines-btn"
              onClick={handleGenerate}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#FF6B35] hover:bg-[#E85D25] text-white font-semibold py-3.5 rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed disabled:translate-y-0"
            >
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Generating with AI...</>
              ) : (
                <><Zap className="w-4 h-4 fill-white" />Generate Subject Lines</>
              )}
            </button>
          </motion.div>

          {/* Output */}
          <motion.div
            initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ delay: 0.1 }}
            className="bg-gray-50 rounded-2xl p-8 border border-gray-100"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-[#0A0A0A] text-lg" style={{ fontFamily: "'Cabinet Grotesk', Inter, sans-serif" }}>
                Generated Subject Lines
              </h3>
              <div className="flex items-center gap-2">
                {generated && results.length > 0 && (
                  <>
                    <span className="text-xs font-bold text-green-700 bg-green-50 border border-green-100 px-2.5 py-1 rounded-full">
                      {results.length} results
                    </span>
                    <button
                      data-testid="export-csv-btn"
                      onClick={exportCSV}
                      title="Export as CSV"
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-200 transition-colors text-[#525252]"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {!generated && !loading && (
              <div className="flex flex-col items-center justify-center h-52 text-center">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                  <Zap className="w-7 h-7 text-[#2563EB]" />
                </div>
                <p className="text-[#525252] text-sm max-w-xs leading-relaxed">
                  Fill in your email details and click Generate to see AI-powered subject lines
                </p>
              </div>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center h-52">
                <div className="w-10 h-10 border-[3px] border-[#2563EB]/20 border-t-[#2563EB] rounded-full animate-spin mb-4" />
                <p className="text-[#525252] text-sm font-medium">Claude AI is writing subject lines...</p>
                <p className="text-xs text-gray-400 mt-1">Usually takes 5-10 seconds</p>
              </div>
            )}

            {generated && results.length > 0 && (
              <div data-testid="subject-lines-output" className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {results.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: i * 0.04 }}
                    data-testid={`subject-line-${i + 1}`}
                    className="group flex items-center gap-2 bg-white rounded-xl px-3 py-2.5 border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#0A0A0A] leading-snug">{item.text}</p>
                      {item.tone && <span className="text-[10px] text-gray-400 uppercase tracking-wider">{item.tone}</span>}
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0 ${getRateColor(item.estimatedOpenRate)}`}>
                      {item.estimatedOpenRate}%
                    </span>
                    <button
                      data-testid={`save-btn-${i + 1}`}
                      onClick={() => handleSave(item, i)}
                      title="Save to favorites"
                      className={`flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${savedItems.has(i) ? 'text-red-500' : 'text-gray-300 hover:text-red-400 hover:bg-red-50'}`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${savedItems.has(i) ? 'fill-red-500' : ''}`} />
                    </button>
                    <button
                      data-testid={`copy-btn-${i + 1}`}
                      onClick={() => handleCopy(item.text, i)}
                      title="Copy to clipboard"
                      className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-[#525252]"
                    >
                      {copiedIndex === i ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultTab="signup"
        onSuccess={() => setShowAuthModal(false)}
      />
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onUpgrade={handleUpgradeFromModal}
        loading={checkoutLoading}
      />
    </section>
  );
}
