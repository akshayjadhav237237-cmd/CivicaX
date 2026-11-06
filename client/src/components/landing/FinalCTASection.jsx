import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Play, ShieldCheck, Sparkles } from 'lucide-react';

export function FinalCTASection() {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="py-20 sm:py-28 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Big Glass Panel */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.65 }}
          className="relative rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-blue-950/95 text-white border border-slate-800 shadow-[0_24px_64px_rgba(0,0,0,0.5)] p-8 sm:p-16 lg:p-20 text-center flex flex-col items-center"
        >
          {/* Ambient Glows */}
          <div className="absolute -top-32 -left-32 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-blue-600/25 rounded-full blur-3xl pointer-events-none" />

          {/* Subtle Animated Rain Background (CSS/SVG) */}
          {!shouldReduceMotion && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
              <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                {[
                  { x: '10%', y: 0, l: 40, d: '0s' },
                  { x: '25%', y: 20, l: 30, d: '0.5s' },
                  { x: '40%', y: 10, l: 45, d: '0.2s' },
                  { x: '55%', y: 30, l: 35, d: '0.8s' },
                  { x: '70%', y: 5, l: 50, d: '0.3s' },
                  { x: '85%', y: 25, l: 30, d: '0.6s' },
                  { x: '95%', y: 15, l: 40, d: '0.1s' },
                  { x: '18%', y: 70, l: 35, d: '0.7s' },
                  { x: '62%', y: 80, l: 42, d: '0.4s' },
                ].map((r, i) => (
                  <motion.line
                    key={i}
                    x1={r.x}
                    y1={r.y}
                    x2={r.x}
                    y2={r.y + r.l}
                    stroke="#38bdf8"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    initial={{ y: -60, opacity: 0 }}
                    animate={{
                      y: [0, 400],
                      opacity: [0, 0.75, 0],
                    }}
                    transition={{
                      duration: 1.4,
                      repeat: Infinity,
                      delay: parseFloat(r.d),
                      ease: 'linear',
                    }}
                  />
                ))}
              </svg>
            </div>
          )}

          {/* Badge */}
          <div className="relative z-10 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-mono font-bold uppercase tracking-wider mb-6">
            <ShieldCheck size={15} />
            <span>Smart India Hackathon 2026</span>
          </div>

          {/* Headline */}
          <h2 className="relative z-10 text-3xl sm:text-5xl lg:text-6xl font-extrabold font-heading text-white tracking-tight max-w-3xl leading-[1.12] mb-6">
            Be warned before the{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400">
              water arrives.
            </span>
          </h2>

          {/* Subtitle */}
          <p className="relative z-10 text-base sm:text-xl text-slate-300 max-w-2xl font-normal leading-relaxed mb-10">
            Deploy hyper-local satellite flood telemetry and AI-driven emergency dispatch for your district or explore our live demo right now.
          </p>

          {/* Buttons */}
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="w-full sm:w-auto px-8 py-4 rounded-full text-base font-semibold text-white bg-gradient-to-r from-blue-600 via-teal-500 to-emerald-500 hover:from-blue-500 hover:to-teal-400 shadow-xl shadow-teal-500/25 hover:shadow-2xl hover:shadow-teal-500/35 transition-all duration-200 flex items-center justify-center gap-2 group active:scale-95"
            >
              <span>Get Started</span>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto px-7 py-4 rounded-full text-base font-semibold text-slate-200 bg-white/10 hover:bg-white/15 backdrop-blur-xl border border-white/20 transition-all duration-200 flex items-center justify-center gap-2 active:scale-95"
            >
              <Play size={16} className="text-teal-400 fill-teal-400" />
              <span>Try Live Demo</span>
            </button>
          </div>

          <div className="relative z-10 mt-8 text-xs font-mono text-slate-400">
            Instant guest demo accounts available • No hardware required
          </div>

        </motion.div>
      </div>
    </section>
  );
}
