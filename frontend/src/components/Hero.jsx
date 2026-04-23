import { motion } from 'framer-motion';
import { ArrowRight, TrendingUp, Check } from 'lucide-react';

const SUBJECT_PREVIEW = [
  { line: "Last Chance: Early Access Ends in 48 Hours", rate: "55%", color: "green" },
  { line: "We Built Something You've Been Asking For", rate: "52%", color: "blue" },
  { line: "Your Competition Doesn't Know About This Yet", rate: "48%", color: "purple" },
];

const PARTICLES = [
  { size: 6, left: 10, top: 20, delay: 0, duration: 6 },
  { size: 4, left: 80, top: 15, delay: 1, duration: 5 },
  { size: 8, left: 60, top: 70, delay: 2, duration: 7 },
  { size: 3, left: 30, top: 85, delay: 0.5, duration: 4 },
  { size: 5, left: 90, top: 50, delay: 1.5, duration: 8 },
  { size: 7, left: 45, top: 30, delay: 3, duration: 5 },
  { size: 4, left: 15, top: 65, delay: 2.5, duration: 6 },
  { size: 6, left: 75, top: 88, delay: 1, duration: 7 },
];

function FloatingEmailCard() {
  return (
    <motion.div
      className="relative"
      animate={{ y: [0, -14, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 w-80 md:w-96">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
          <span className="text-xs text-gray-400 ml-2 font-medium">AI Subject Lines</span>
        </div>

        {SUBJECT_PREVIEW.map((item, i) => (
          <div key={i} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0 gap-3">
            <span className="text-sm text-gray-700 font-medium">{item.line}</span>
            <span className={`text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0 ${
              item.color === 'green' ? 'bg-green-100 text-green-700' :
              item.color === 'blue' ? 'bg-blue-100 text-blue-700' :
              'bg-purple-100 text-purple-700'
            }`}>
              {item.rate}
            </span>
          </div>
        ))}

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#2563EB]">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-semibold">Avg. +40% open rate</span>
          </div>
          <div className="flex items-center gap-1 text-green-600">
            <Check className="w-3 h-3" />
            <span className="text-xs font-medium">AI-ranked</span>
          </div>
        </div>
      </div>

      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        className="absolute -bottom-4 -left-6 bg-[#FF6B35] text-white px-4 py-2 rounded-xl shadow-lg text-sm font-bold"
      >
        +40% Open Rate
      </motion.div>

      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute -top-4 -right-4 bg-white border border-gray-100 text-[#0A0A0A] px-3 py-1.5 rounded-xl shadow-md text-xs font-bold"
      >
        5 sec results
      </motion.div>
    </motion.div>
  );
}

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center overflow-hidden pt-16"
      style={{
        background: 'radial-gradient(ellipse 80% 60% at 70% 20%, rgba(37,99,235,0.07) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 20% 80%, rgba(139,92,246,0.05) 0%, transparent 60%), #FAFAFA',
      }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 right-20 w-80 h-80 bg-blue-200/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-purple-200/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        {PARTICLES.map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-blue-400/15"
            style={{
              width: p.size,
              height: p.size,
              left: `${p.left}%`,
              top: `${p.top}%`,
              animation: `floatParticle ${p.duration}s ease-in-out infinite`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 py-20 md:py-28 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center w-full">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-[#2563EB] text-xs font-bold tracking-wider uppercase px-4 py-2 rounded-full mb-6">
              <span className="w-2 h-2 bg-[#2563EB] rounded-full animate-pulse" />
              AI-Powered Email Optimization
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-6xl font-black tracking-tighter leading-[1.05] text-[#0A0A0A] mb-6"
            style={{ fontFamily: "'Cabinet Grotesk', Inter, sans-serif" }}
          >
            Get <span className="text-[#2563EB]">40% Higher</span>
            <br />Email Open Rates
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg leading-relaxed text-[#525252] mb-8 max-w-lg"
          >
            AI-powered subject lines that actually work. In seconds.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 mb-10"
          >
            <button
              data-testid="hero-cta-btn"
              onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
              className="group inline-flex items-center justify-center gap-2 bg-[#2563EB] text-white px-8 py-4 rounded-xl font-semibold text-base hover:-translate-y-1 hover:shadow-xl hover:bg-[#1D4ED8] transition-all duration-300"
            >
              Try Free Demo
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
            </button>
            <button
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              className="inline-flex items-center justify-center gap-2 text-[#525252] px-6 py-4 font-medium hover:text-[#2563EB] transition-colors duration-200"
            >
              See how it works
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex items-center gap-4"
          >
            <div className="flex -space-x-2">
              {['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'].map((color, i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: color }} />
              ))}
            </div>
            <div>
              <div className="text-sm font-bold text-[#0A0A0A]">1,000+ marketing teams</div>
              <div className="text-xs text-[#525252]">already boosting their open rates</div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="flex justify-center lg:justify-end"
        >
          <FloatingEmailCard />
        </motion.div>
      </div>
    </section>
  );
}
