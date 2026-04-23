import { motion } from 'framer-motion';

const STEPS = [
  {
    number: '01',
    emoji: '📝',
    title: 'Paste Your Email',
    description: "Enter your email draft or describe what it's about",
  },
  {
    number: '02',
    emoji: '🎯',
    title: 'Pick Industry & Type',
    description: 'Select your industry (Marketing, Sales, Tech, etc) and email type',
  },
  {
    number: '03',
    emoji: '✨',
    title: 'Get 20 Subject Lines',
    description: 'AI generates ranked options with predicted open rates',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 md:py-32 bg-gray-50/70">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="text-xs font-bold tracking-[0.2em] uppercase text-[#525252] mb-4">
            Simple Process
          </div>
          <h2
            className="text-3xl md:text-4xl font-bold tracking-tight text-[#0A0A0A]"
            style={{ fontFamily: "'Cabinet Grotesk', Inter, sans-serif" }}
          >
            3 Simple Steps
          </h2>
        </motion.div>

        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="hidden md:block absolute top-14 left-[calc(16.67%+3rem)] right-[calc(16.67%+3rem)] h-0 border-t-2 border-dashed border-[#FF6B35]/25 z-0" />

          {STEPS.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              data-testid={`step-${i + 1}`}
              className="relative bg-white rounded-2xl p-8 border border-gray-100 shadow-sm text-center z-10 hover:-translate-y-1 hover:shadow-md transition-all duration-300"
            >
              <div className="w-12 h-12 bg-[#FF6B35] rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg shadow-orange-200">
                <span className="text-white font-black text-sm">{step.number}</span>
              </div>
              <div className="text-3xl mb-4">{step.emoji}</div>
              <h3
                className="text-xl font-bold text-[#0A0A0A] mb-3"
                style={{ fontFamily: "'Cabinet Grotesk', Inter, sans-serif" }}
              >
                {step.title}
              </h3>
              <p className="text-[#525252] text-sm leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
