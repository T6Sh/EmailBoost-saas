import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function CTASection() {
  return (
    <section id="cta" className="py-24 md:py-32 bg-[#0F172A] relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-48 -right-48 w-[500px] h-[500px] bg-[#2563EB]/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-48 -left-48 w-[500px] h-[500px] bg-purple-500/8 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto px-6 md:px-12 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-xs font-bold tracking-[0.2em] uppercase text-blue-400 mb-6">
            Get Started Today
          </div>
          <h2
            className="text-4xl md:text-5xl font-black tracking-tight text-white mb-6 leading-tight"
            style={{ fontFamily: "'Cabinet Grotesk', Inter, sans-serif" }}
          >
            Ready to Transform Your
            <br />Email Results?
          </h2>
          <p className="text-blue-200 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Join 1,000+ marketing teams using EmailBoost to drive higher open rates and better results.
          </p>

          <button
            data-testid="final-cta-btn"
            onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
            className="group inline-flex items-center gap-3 bg-[#FF6B35] hover:bg-[#E85D25] text-white px-10 py-5 rounded-xl font-bold text-lg hover:-translate-y-1 hover:shadow-2xl hover:shadow-orange-500/20 transition-all duration-300"
          >
            Start Your Free Trial
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          <p className="text-blue-400/60 text-sm mt-5">
            No credit card required. Generate your first subject lines in seconds.
          </p>

          <div className="mt-12 grid grid-cols-3 gap-8 max-w-sm mx-auto">
            {[
              { value: '1,000+', label: 'Teams' },
              { value: '40%', label: 'Avg. Lift' },
              { value: '5 sec', label: 'Results' },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="text-2xl font-black text-white mb-1" style={{ fontFamily: "'Cabinet Grotesk', Inter, sans-serif" }}>
                  {value}
                </div>
                <div className="text-xs text-blue-300/70 font-medium uppercase tracking-wider">{label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
