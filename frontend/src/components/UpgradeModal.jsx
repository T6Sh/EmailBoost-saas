import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Zap } from 'lucide-react';

export default function UpgradeModal({ isOpen, onClose, onUpgrade, loading }) {
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
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>

          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Zap className="w-7 h-7 text-[#FF6B35]" />
            </div>
            <h3 className="text-2xl font-black text-[#0A0A0A] mb-2" style={{ fontFamily: "'Cabinet Grotesk', Inter, sans-serif" }}>
              Upgrade to Pro
            </h3>
            <p className="text-[#525252] text-sm">
              You've used all 3 free generations this month. Get unlimited access.
            </p>
          </div>

          <div className="bg-[#2563EB] rounded-2xl p-6 mb-6">
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-4xl font-black text-white" style={{ fontFamily: "'Cabinet Grotesk', Inter, sans-serif" }}>$19</span>
              <span className="text-blue-200 text-sm">/month</span>
            </div>
            <ul className="space-y-2">
              {['Unlimited generations', 'Export results as CSV', 'Save favorite subject lines', '7-day free trial'].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-blue-100">
                  <Check className="w-4 h-4 text-blue-300 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <button
            data-testid="upgrade-to-pro-btn"
            onClick={onUpgrade}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-[#FF6B35] hover:bg-[#E85D25] text-white font-bold py-4 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-lg text-base disabled:opacity-60"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Upgrade to Pro — $19/month'}
          </button>
          <p className="text-xs text-center text-[#525252] mt-3">7-day free trial. Cancel anytime.</p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
