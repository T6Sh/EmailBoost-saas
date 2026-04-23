import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PLANS = [
  {
    name: 'Free', price: '$0', period: '/month', highlight: 'Perfect for trying',
    features: ['3 subject line generations per month', 'Basic interface', 'No credit card needed'],
    cta: 'Get Started', ctaStyle: 'outline', featured: false, plan: null,
  },
  {
    name: 'Pro', price: '$19', period: '/month', highlight: 'Most Popular', badge: 'BEST VALUE',
    features: ['Unlimited generations', 'Download results as CSV', 'Save favorite subject lines', 'See trending subject lines', 'Email summaries weekly'],
    cta: 'Start Free Trial', ctaStyle: 'solid', note: '7-day free trial, no credit card needed', featured: true, plan: 'pro',
  },
  {
    name: 'Enterprise', price: '$99', period: '/month', highlight: 'For teams',
    features: ['Everything in Pro', 'Team collaboration (5 members)', 'Custom audience targeting', 'API access', 'Priority support'],
    cta: 'Contact Sales', ctaStyle: 'outline', featured: false, plan: 'enterprise',
  },
];

export default function Pricing() {
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingPlan, setPendingPlan] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(null);

  const handlePlanClick = async (plan) => {
    if (!plan) return; // Free plan
    if (!user) {
      setPendingPlan(plan);
      setShowAuthModal(true);
      return;
    }
    initiateCheckout(plan);
  };

  const initiateCheckout = async (plan) => {
    setCheckoutLoading(plan);
    try {
      const { data } = await axios.post(`${API}/stripe/checkout`, { plan, origin: window.location.origin }, { withCredentials: true });
      window.location.href = data.url;
    } catch (err) {
      toast.error('Failed to start checkout. Please try again.');
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    if (pendingPlan) {
      setTimeout(() => initiateCheckout(pendingPlan), 500);
      setPendingPlan(null);
    }
  };

  const userPlan = user?.tier;

  return (
    <section id="pricing" className="py-24 md:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          className="text-center mb-16"
        >
          <div className="text-xs font-bold tracking-[0.2em] uppercase text-[#525252] mb-4">Pricing</div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[#0A0A0A] mb-3" style={{ fontFamily: "'Cabinet Grotesk', Inter, sans-serif" }}>
            Simple, Transparent Pricing
          </h2>
          <p className="text-[#525252] text-base">No credit card required for Free tier</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          {PLANS.map((plan, i) => {
            const isCurrentPlan = userPlan === plan.name.toLowerCase();
            const isLoading = plan.plan !== null && checkoutLoading === plan.plan;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                data-testid={`pricing-${plan.name.toLowerCase()}`}
                className={`relative rounded-2xl p-8 border transition-all duration-300 ${
                  plan.featured
                    ? 'bg-[#2563EB] text-white border-[#2563EB] md:-translate-y-8 shadow-2xl shadow-blue-300/30'
                    : 'bg-white text-[#0A0A0A] border-gray-200 hover:border-gray-300 hover:shadow-lg'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-[#FF6B35] text-white text-xs font-black px-4 py-1.5 rounded-full tracking-widest uppercase shadow-lg shadow-orange-200">
                      {plan.badge}
                    </span>
                  </div>
                )}
                {isCurrentPlan && (
                  <div className="absolute -top-3.5 right-4">
                    <span className="bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">Current Plan</span>
                  </div>
                )}

                <div className="mb-6">
                  <div className={`text-xs font-bold tracking-widest uppercase mb-1 ${plan.featured ? 'text-blue-200' : 'text-[#525252]'}`}>{plan.highlight}</div>
                  <div className={`text-sm font-semibold mb-4 ${plan.featured ? 'text-blue-100' : 'text-[#525252]'}`}>{plan.name}</div>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-4xl font-black tracking-tight ${plan.featured ? 'text-white' : 'text-[#0A0A0A]'}`} style={{ fontFamily: "'Cabinet Grotesk', Inter, sans-serif" }}>
                      {plan.price}
                    </span>
                    <span className={`text-sm ${plan.featured ? 'text-blue-200' : 'text-[#525252]'}`}>{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feat, j) => (
                    <li key={j} className="flex items-start gap-3 text-sm">
                      <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${plan.featured ? 'text-blue-200' : 'text-[#2563EB]'}`} />
                      <span className={plan.featured ? 'text-blue-100' : 'text-[#525252]'}>{feat}</span>
                    </li>
                  ))}
                </ul>

                <button
                  data-testid={`pricing-${plan.name.toLowerCase()}-cta`}
                  onClick={() => handlePlanClick(plan.plan)}
                  disabled={isCurrentPlan || isLoading}
                  className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-center gap-2 ${
                    isCurrentPlan
                      ? 'bg-green-50 text-green-600 cursor-default'
                      : plan.featured
                      ? 'bg-white text-[#2563EB] hover:bg-blue-50 hover:shadow-lg'
                      : plan.ctaStyle === 'outline'
                      ? 'border-2 border-gray-200 text-[#525252] hover:border-[#2563EB] hover:text-[#2563EB]'
                      : 'bg-[#2563EB] text-white hover:bg-[#1D4ED8] hover:shadow-lg'
                  }`}
                >
                  {isLoading ? <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" /> : isCurrentPlan ? 'Current Plan' : plan.cta}
                </button>

                {plan.note && (
                  <p className={`text-xs text-center mt-3 ${plan.featured ? 'text-blue-200' : 'text-[#525252]'}`}>{plan.note}</p>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => { setShowAuthModal(false); setPendingPlan(null); }}
        defaultTab="signup"
        onSuccess={handleAuthSuccess}
      />
    </section>
  );
}
