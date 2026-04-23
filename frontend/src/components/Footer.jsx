import { useState } from 'react';
import { Mail, Zap, Twitter, Linkedin } from 'lucide-react';
import { toast } from 'sonner';

const FOOTER_LINKS = [
  { label: 'Home', id: 'hero' },
  { label: 'How It Works', id: 'how-it-works' },
  { label: 'Pricing', id: 'pricing' },
  { label: 'Demo', id: 'demo' },
];

export default function Footer() {
  const [email, setEmail] = useState('');

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (email.trim()) {
      toast.success("You're subscribed! Email tips coming soon.");
      setEmail('');
    }
  };

  return (
    <footer className="bg-white border-t border-gray-100 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <button className="flex items-center gap-2 mb-4" onClick={() => scrollTo('hero')}>
              <div className="relative w-9 h-9 flex items-center justify-center bg-[#2563EB] rounded-xl shadow-md shadow-blue-200">
                <Mail className="w-4 h-4 text-white" />
                <Zap className="w-2.5 h-2.5 text-[#FF6B35] absolute -top-1 -right-1 fill-[#FF6B35]" />
              </div>
              <span className="font-black text-lg tracking-tight text-[#0A0A0A]" style={{ fontFamily: "'Cabinet Grotesk', Inter, sans-serif" }}>
                Email<span className="text-[#2563EB]">Boost</span>
              </span>
            </button>
            <p className="text-sm text-[#525252] leading-relaxed">
              AI-powered email subject line optimization for modern marketers.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-[#0A0A0A] text-sm mb-4 tracking-wide">Quick Links</h4>
            <ul className="space-y-2.5">
              {FOOTER_LINKS.map(({ label, id }) => (
                <li key={label}>
                  <button
                    data-testid={`footer-${label.toLowerCase().replace(/ /g, '-')}`}
                    onClick={() => scrollTo(id)}
                    className="text-sm text-[#525252] hover:text-[#2563EB] transition-colors"
                  >
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal + Social */}
          <div>
            <h4 className="font-bold text-[#0A0A0A] text-sm mb-4 tracking-wide">Company</h4>
            <ul className="space-y-2.5 mb-6">
              {['Privacy', 'Terms', 'Contact'].map((item) => (
                <li key={item}>
                  <button
                    data-testid={`footer-${item.toLowerCase()}`}
                    className="text-sm text-[#525252] hover:text-[#2563EB] transition-colors"
                  >
                    {item}
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <a
                href="#"
                data-testid="social-twitter"
                className="w-9 h-9 bg-gray-100 hover:bg-[#2563EB] hover:text-white text-[#525252] rounded-lg flex items-center justify-center transition-all duration-200"
                aria-label="Twitter"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="#"
                data-testid="social-linkedin"
                className="w-9 h-9 bg-gray-100 hover:bg-[#2563EB] hover:text-white text-[#525252] rounded-lg flex items-center justify-center transition-all duration-200"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href="#"
                data-testid="social-producthunt"
                className="w-9 h-9 bg-gray-100 hover:bg-[#FF6B35] hover:text-white text-[#525252] rounded-lg flex items-center justify-center transition-all duration-200 text-[10px] font-black"
                aria-label="ProductHunt"
              >
                PH
              </a>
            </div>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-bold text-[#0A0A0A] text-sm mb-2 tracking-wide">Stay Updated</h4>
            <p className="text-xs text-[#525252] mb-4 leading-relaxed">
              Get weekly email tips and subject line trends delivered to your inbox.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col gap-2">
              <input
                data-testid="newsletter-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all"
              />
              <button
                data-testid="newsletter-submit"
                type="submit"
                className="bg-[#2563EB] text-white px-4 py-2.5 rounded-lg text-xs font-semibold hover:bg-[#1D4ED8] transition-colors"
              >
                Subscribe to Tips
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#525252]">
            &copy; 2024 EmailBoost. All rights reserved.
          </p>
          <div className="flex gap-6">
            <button className="text-xs text-[#525252] hover:text-[#2563EB] transition-colors">Privacy Policy</button>
            <button className="text-xs text-[#525252] hover:text-[#2563EB] transition-colors">Terms of Service</button>
          </div>
        </div>
      </div>
    </footer>
  );
}
