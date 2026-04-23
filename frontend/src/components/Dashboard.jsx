import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Heart, Trash2, Download, User, Mail, Zap, ArrowLeft, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    if (user === null) navigate('/');
  }, [user, navigate]);

  useEffect(() => {
    if (user) fetchFavorites();
  }, [user]);

  const fetchFavorites = async () => {
    try {
      const { data } = await axios.get(`${API}/favorites`, { withCredentials: true });
      setFavorites(data);
    } catch { toast.error('Failed to load favorites'); }
    finally { setLoading(false); }
  };

  const deleteFavorite = async (id) => {
    try {
      await axios.delete(`${API}/favorites/${id}`, { withCredentials: true });
      setFavorites((prev) => prev.filter((f) => f.id !== id));
      toast.success('Removed');
    } catch { toast.error('Failed to remove'); }
  };

  const exportFavoritesCSV = () => {
    const headers = ['Subject Line', 'Tone', 'Predicted Open Rate', 'Saved At'];
    const rows = favorites.map((f) => [f.text, f.tone, `${f.estimated_open_rate}%`, f.created_at]);
    const csv = [headers, ...rows].map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EmailBoost_Favorites_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Favorites exported!');
  };

  const handleUpgrade = async () => {
    setCheckoutLoading(true);
    try {
      const { data } = await axios.post(`${API}/stripe/checkout`, { plan: 'pro', origin: window.location.origin }, { withCredentials: true });
      window.location.href = data.url;
    } catch { toast.error('Failed to start checkout. Please try again.'); }
    finally { setCheckoutLoading(false); }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
    toast.success('Signed out');
  };

  if (user === undefined) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#2563EB]/20 border-t-[#2563EB] rounded-full animate-spin" /></div>;
  }

  const isPro = user?.tier === 'pro' || user?.tier === 'enterprise';
  const generationsLeft = Math.max(0, 3 - (user?.generations_this_month || 0));

  return (
    <div className="min-h-screen bg-[#FAFAFA] pt-20">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-black text-[#0A0A0A]" style={{ fontFamily: "'Cabinet Grotesk', Inter, sans-serif" }}>Dashboard</h1>
              <p className="text-[#525252] text-sm mt-1">Manage your account and saved subject lines</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/')} className="flex items-center gap-2 text-sm text-[#525252] hover:text-[#2563EB] transition-colors">
                <ArrowLeft className="w-4 h-4" /> Home
              </button>
              <button data-testid="logout-btn" onClick={handleLogout} className="text-sm font-medium text-red-500 hover:text-red-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50">
                Sign Out
              </button>
            </div>
          </div>

          {/* Profile + Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="md:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#2563EB] rounded-xl flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-[#0A0A0A] text-lg">{user?.name}</div>
                    <div className="text-sm text-[#525252] flex items-center gap-1.5 mt-0.5">
                      <Mail className="w-3.5 h-3.5" />{user?.email}
                    </div>
                  </div>
                </div>
                <span data-testid="user-tier-badge" className={`text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider ${isPro ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                  {isPro ? 'Pro' : 'Free'}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="text-xs font-bold uppercase tracking-wider text-[#525252] mb-3">Monthly Usage</div>
              {isPro ? (
                <>
                  <div className="text-2xl font-black text-[#2563EB]">Unlimited</div>
                  <div className="text-xs text-[#525252] mt-1">Pro plan active</div>
                </>
              ) : (
                <>
                  <div className="text-2xl font-black text-[#0A0A0A]">
                    {generationsLeft}<span className="text-sm text-[#525252] font-normal"> / 3 left</span>
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className={`flex-1 h-2 rounded-full ${i < (user?.generations_this_month || 0) ? 'bg-[#FF6B35]' : 'bg-gray-100'}`} />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Upgrade banner for free users */}
          {!isPro && (
            <div className="bg-gradient-to-r from-[#2563EB] to-blue-700 rounded-2xl p-5 mb-6 flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="font-bold text-white text-lg">Upgrade to Pro</div>
                <div className="text-blue-200 text-sm mt-0.5">Unlock unlimited generations, CSV export & more</div>
              </div>
              <button
                data-testid="dashboard-upgrade-btn"
                onClick={handleUpgrade}
                disabled={checkoutLoading}
                className="flex items-center gap-2 bg-white text-[#2563EB] font-bold px-6 py-2.5 rounded-xl text-sm hover:-translate-y-0.5 hover:shadow-lg transition-all disabled:opacity-70"
              >
                {checkoutLoading ? <div className="w-4 h-4 border-2 border-[#2563EB]/30 border-t-[#2563EB] rounded-full animate-spin" /> : <><CreditCard className="w-4 h-4" /> Upgrade — $19/mo</>}
              </button>
            </div>
          )}

          {/* Saved Favorites */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="font-bold text-[#0A0A0A]" style={{ fontFamily: "'Cabinet Grotesk', Inter, sans-serif" }}>Saved Favorites</h2>
                <p className="text-sm text-[#525252]">{favorites.length} subject lines saved</p>
              </div>
              {favorites.length > 0 && (
                <button
                  data-testid="export-favorites-csv-btn"
                  onClick={exportFavoritesCSV}
                  className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-[#525252] px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                >
                  <Download className="w-4 h-4" /> Export CSV
                </button>
              )}
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-[#2563EB]/20 border-t-[#2563EB] rounded-full animate-spin" />
              </div>
            ) : favorites.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-[#525252] text-sm">No saved favorites yet</p>
                <p className="text-xs text-gray-400 mt-1">Generate subject lines and save your best ones</p>
                <button onClick={() => navigate('/#demo')} className="mt-4 text-sm text-[#2563EB] font-semibold hover:underline">
                  Try the demo →
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {favorites.map((fav) => (
                  <div key={fav.id} data-testid={`favorite-item`} className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#0A0A0A]">{fav.text}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {fav.tone && <span className="text-xs text-[#525252]">{fav.tone}</span>}
                        <span className="text-xs font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded">{fav.estimated_open_rate}% open rate</span>
                      </div>
                    </div>
                    <button onClick={() => deleteFavorite(fav.id)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 hover:text-red-500 text-gray-300 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="mt-6 flex gap-3 justify-center">
            <button onClick={() => { window.location.href = '/#demo'; }} className="flex items-center gap-2 text-sm font-medium text-[#2563EB] bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-colors">
              <Zap className="w-4 h-4" /> Generate More
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
