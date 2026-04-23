import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Load Razorpay script
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const PLANS = [
  {
    name: 'Free', price: '₹0', period: '/month', highlight: 'Perfect for trying',
    features: ['3 subject line generations per month', 'Basic interface', 'No credit card needed'],
    cta: 'Get Started', ctaStyle: 'outline', featured: false, plan: null,
  },
  {
    name: 'Pro', price: '₹1,999', period: '/month', highlight: 'Most Popular', badge: 'BEST VALUE',
    features: ['Unlimited generations', 'Download results as CSV', 'Save favorite subject lines', 'See trending subject lines', 'Email summaries weekly'],
    cta: 'Start Free Trial', ctaStyle: 'solid', note: '7-day free trial, no credit card needed', featured: true, plan: 'pro',
  },
  {
    name: 'Enterprise', price: '₹9,999', period: '/month', highlight: 'For teams',
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
      // Load Razorpay script
      const razorpayLoaded = await loadRazorpayScript();
      if (!razorpayLoaded) {
        toast.error('Failed to load Razorpay. Please try again.');
        setCheckoutLoading(null);
        return;
      }

      // Create order on backend
      const { data } = await axios.post(
        `${API}/razorpay/create-order`,
        { plan },
        { 
          headers: {
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`
          }
        }
      );

      const { order_id, amount, key_id } = data;

      // Razorpay checkout options
      const options = {
        key: key_id,
        amount: amount,
        currency: 'INR',
        order_id: order_id,
        name: 'EmailBoost',
        description: `Upgrade to ${plan.toUpperCase()} Plan`,
        theme: {
          color: '#2563EB'
        },
        handler: async (response) => {
          try {
            // Verify payment on backend
            const verifyResponse = await axios.post(
              `${API}/razorpay/verify-payment`,
              {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature
              },
              {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem('auth_token')}`
                }
              }
            );

            if (verifyResponse.data.success) {
              toast.success(`Successfully upgraded to ${plan.toUpperCase()}!`);
              // Redirect after 2 seconds
              setTimeout(() => {
                window.location.href = verifyResponse.data.redirect_url;
              }, 2000);
            }
          } catch (err) {
            toast.error('Payment verification failed. Please contact support.');
            console.error('Payment verification error:', err);
          }
        },
        modal: {
          ondismiss: () => {
            toast.info('Checkout cancelled');
            setCheckoutLoading(null);
          }
        }
      };

      // Open Razorpay checkout
      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      console.error('Checkout error:', err);
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
            Simple, Transparent Pricing (₹ INR)
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
                  <div className="absolute -top-3 left-6 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                    {plan.badge}
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                  <p className={`text-sm ${plan.featured ? 'text-blue-100' : 'text-gray-600'}`}>{plan.highlight}</p>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className={plan.featured ? 'text-blue-100' : 'text-gray-600'}>{plan.period}</span>
                  </div>
                  {plan.note && <p className={`text-xs mt-2 ${plan.featured ? 'text-blue-100' : 'text-gray-600'}`}>{plan.note}</p>}
                </div>

                <button
                  onClick={() => handlePlanClick(plan.plan)}
                  disabled={isCurrentPlan || isLoading}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all mb-6 ${
                    isCurrentPlan
                      ? `${plan.featured ? 'bg-blue-400 text-white' : 'bg-gray-200 text-gray-600'} cursor-default`
                      : plan.featured
                      ? 'bg-white text-blue-600 hover:bg-gray-50'
                      : 'border border-gray-300 hover:border-gray-400 text-gray-700'
                  } ${isLoading ? 'opacity-75 cursor-wait' : ''}`}
                >
                  {isCurrentPlan ? 'Current Plan' : isLoading ? 'Processing...' : plan.cta}
                </button>

                <ul className={`space-y-3 ${plan.featured ? 'text-white' : 'text-gray-700'}`}>
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-3">
                      <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>
      </div>

      {showAuthModal && <AuthModal onSuccess={handleAuthSuccess} onClose={() => setShowAuthModal(false)} />}
    </section>
  );
}
