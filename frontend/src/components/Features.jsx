import { motion } from 'framer-motion';
import { Zap, BarChart3, Settings2 } from 'lucide-react';

const FEATURES = [
  {
    icon: Zap,
    title: 'AI-Powered',
    description: 'Uses advanced AI to generate high-converting subject lines based on proven psychology and engagement data.',
  },
  {
    icon: BarChart3,
    title: 'Ranked by Performance',
    description: 'Each subject line includes a predicted open rate so you always know which option performs best.',
  },
  {
    icon: Settings2,
    title: 'Industry-Specific',
    description: 'Generates subject lines optimized for your specific industry and email type for maximum relevance.',
  },
];

export default function Features() {
  return (
    <section id="features" className="py-24 md:py-32 bg-[#FAFAFA]">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="text-xs font-bold tracking-[0.2em] uppercase text-[#525252] mb-4">
            Features
          </div>
          <h2
            className="text-3xl md:text-4xl font-bold tracking-tight text-[#0A0A0A]"
            style={{ fontFamily: "'Cabinet Grotesk', Inter, sans-serif" }}
          >
            Why EmailBoost?
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              data-testid={`feature-card-${i + 1}`}
              className="bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-black/5 rounded-2xl p-8 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-300"
            >
              <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center mb-6">
                <feature.icon className="w-6 h-6 text-[#FF6B35]" />
              </div>
              <h3
                className="text-xl font-bold text-[#0A0A0A] mb-3"
                style={{ fontFamily: "'Cabinet Grotesk', Inter, sans-serif" }}
              >
                {feature.title}
              </h3>
              <p className="text-[#525252] text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
