import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Zap, Menu, X, LayoutDashboard, LogOut, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';
import { toast } from 'sonner';

const NAV_LINKS = [
  { label: 'Home', id: 'hero' },
  { label: 'How It Works', id: 'how-it-works' },
  { label: 'Pricing', id: 'pricing' },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id) => {
    if (window.location.pathname !== '/') { navigate('/'); setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 100); }
    else document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
    navigate('/');
    toast.success('Signed out successfully');
  };

  const isPro = user?.tier === 'pro' || user?.tier === 'enterprise';

  return (
    <>
      <header
        data-testid="main-header"
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'backdrop-blur-xl bg-white/90 border-b border-black/5 shadow-sm' : 'bg-transparent'}`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between h-16 md:h-20">
          <button data-testid="logo-btn" className="flex items-center gap-2" onClick={() => scrollTo('hero')}>
            <div className="relative w-9 h-9 flex items-center justify-center bg-[#2563EB] rounded-xl shadow-md shadow-blue-200">
              <Mail className="w-4 h-4 text-white" />
              <Zap className="w-2.5 h-2.5 text-[#FF6B35] absolute -top-1 -right-1 fill-[#FF6B35]" />
            </div>
            <span className="font-black text-xl tracking-tight text-[#0A0A0A]" style={{ fontFamily: "'Cabinet Grotesk', Inter, sans-serif" }}>
              Email<span className="text-[#2563EB]">Boost</span>
            </span>
          </button>

          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(({ label, id }) => (
              <button key={id} data-testid={`nav-${id}`} onClick={() => scrollTo(id)}
                className="text-sm font-medium text-[#525252] hover:text-[#2563EB] transition-colors duration-200"
              >
                {label}
              </button>
            ))}

            {user === undefined ? (
              <div className="w-20 h-8 bg-gray-100 rounded-xl animate-pulse" />
            ) : user ? (
              <div className="relative">
                <button
                  data-testid="user-menu-btn"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl px-3 py-2 transition-all"
                >
                  <div className="w-6 h-6 bg-[#2563EB] rounded-lg flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-sm font-medium text-[#0A0A0A] max-w-[100px] truncate">{user.name?.split(' ')[0]}</span>
                  {isPro && (
                    <span className="text-[10px] font-black text-[#2563EB] bg-blue-50 px-1.5 py-0.5 rounded-full uppercase tracking-wider">Pro</span>
                  )}
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                    <button onClick={() => { navigate('/dashboard'); setShowUserMenu(false); }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[#0A0A0A] hover:bg-gray-50 transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4 text-[#2563EB]" /> Dashboard
                    </button>
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button data-testid="header-logout-btn" onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button data-testid="header-signin-btn" onClick={() => setShowAuthModal(true)}
                  className="text-sm font-medium text-[#525252] hover:text-[#2563EB] transition-colors"
                >
                  Sign In
                </button>
                <button data-testid="header-try-now-btn" onClick={() => setShowAuthModal(true)}
                  className="bg-[#2563EB] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:-translate-y-0.5 hover:shadow-lg hover:bg-[#1D4ED8] transition-all duration-200"
                >
                  Try Now
                </button>
              </div>
            )}
          </nav>

          <button data-testid="mobile-menu-btn" className="md:hidden p-2 text-[#0A0A0A]" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-6 py-4 flex flex-col gap-3 shadow-lg">
            {NAV_LINKS.map(({ label, id }) => (
              <button key={id} onClick={() => scrollTo(id)} className="text-sm font-medium text-[#525252] text-left py-2 border-b border-gray-50">
                {label}
              </button>
            ))}
            {user ? (
              <>
                <button onClick={() => { navigate('/dashboard'); setMobileOpen(false); }} className="flex items-center gap-2 text-sm font-medium text-[#0A0A0A] py-2">
                  <LayoutDashboard className="w-4 h-4" /> Dashboard
                </button>
                <button onClick={handleLogout} className="text-sm font-medium text-red-500 text-left py-2">Sign Out</button>
              </>
            ) : (
              <button onClick={() => { setShowAuthModal(true); setMobileOpen(false); }}
                className="bg-[#2563EB] text-white px-5 py-3 rounded-xl text-sm font-semibold mt-2"
              >
                Sign In / Try Now
              </button>
            )}
          </div>
        )}
      </header>

      {showUserMenu && <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />}

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultTab="login"
        onSuccess={() => setShowAuthModal(false)}
      />
    </>
  );
}
