import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState('checking');
  const [plan, setPlan] = useState('pro');

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (!sessionId) { navigate('/'); return; }
    pollStatus(sessionId, 0);
  }, []); // eslint-disable-line

  const pollStatus = async (sessionId, attempts) => {
    if (attempts >= 8) { setStatus('timeout'); return; }
    try {
      const { data } = await axios.get(`${API}/stripe/status/${sessionId}`, { withCredentials: true });
      if (data.plan) setPlan(data.plan);
      if (data.payment_status === 'paid') {
        await refreshUser();
        setStatus('success');
      } else {
        setTimeout(() => pollStatus(sessionId, attempts + 1), 2500);
      }
    } catch {
      setTimeout(() => pollStatus(sessionId, attempts + 1), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center pt-20 px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12 text-center max-w-md w-full"
      >
        {status === 'checking' && (
          <>
            <div className="w-14 h-14 border-[3px] border-[#2563EB]/20 border-t-[#2563EB] rounded-full animate-spin mx-auto mb-6" />
            <h2 className="text-2xl font-black text-[#0A0A0A] mb-2" style={{ fontFamily: "'Cabinet Grotesk', Inter, sans-serif" }}>
              Confirming Payment...
            </h2>
            <p className="text-[#525252] text-sm">Please wait while we verify your payment.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-black text-[#0A0A0A] mb-2" style={{ fontFamily: "'Cabinet Grotesk', Inter, sans-serif" }}>
              Welcome to {plan === 'enterprise' ? 'Enterprise' : 'Pro'}!
            </h2>
            <p className="text-[#525252] text-sm mb-8">
              Your account has been upgraded. Enjoy unlimited subject line generations!
            </p>
            <button
              data-testid="goto-dashboard-btn"
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-2 bg-[#2563EB] text-white px-8 py-3 rounded-xl font-semibold hover:-translate-y-0.5 hover:shadow-lg transition-all"
            >
              Go to Dashboard <ArrowRight className="w-4 h-4" />
            </button>
          </>
        )}
        {(status === 'timeout' || status === 'failed') && (
          <>
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-black text-[#0A0A0A] mb-2" style={{ fontFamily: "'Cabinet Grotesk', Inter, sans-serif" }}>
              Payment Pending
            </h2>
            <p className="text-[#525252] text-sm mb-6">
              We couldn't confirm your payment yet. If you were charged, your account will be upgraded shortly.
            </p>
            <button onClick={() => navigate('/dashboard')} className="text-[#2563EB] font-semibold hover:underline">
              Check Dashboard →
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}
