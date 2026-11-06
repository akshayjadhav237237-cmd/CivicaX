import { motion } from 'framer-motion';
import { Clock, BellOff, PhoneCall, AlertCircle } from 'lucide-react';

export function ProblemSection() {
  const problemFacts = [
    {
      id: 1,
      icon: Clock,
      title: 'Latency in Detection',
      text: 'Satellite imagery takes hours to become usable warning.',
      color: 'text-amber-500',
      border: 'border-amber-500/20 dark:border-amber-500/30',
      bg: 'bg-amber-500/5',
    },
    {
      id: 2,
      icon: BellOff,
      title: 'Zero Last-Mile Notice',
      text: 'Residents in hill towns get no advance warning.',
      color: 'text-red-500',
      border: 'border-red-500/20 dark:border-red-500/30',
      bg: 'bg-red-500/5',
    },
    {
      id: 3,
      icon: PhoneCall,
      title: 'Fragmented Emergency Action',
      text: 'Officials coordinate rescue over phone calls.',
      color: 'text-blue-500',
      border: 'border-blue-500/20 dark:border-blue-500/30',
      bg: 'bg-blue-500/5',
    },
  ];

  return (
    <section className="py-20 sm:py-28 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left: Big Statement */}
          <div className="lg:col-span-5 flex flex-col items-start">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 dark:bg-red-950/40 border border-red-500/20 text-xs font-mono font-bold text-red-600 dark:text-red-400 uppercase tracking-widest mb-6"
            >
              <AlertCircle size={14} />
              <span>The Early Warning Bottleneck</span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.65, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-heading text-slate-900 dark:text-white leading-[1.12] tracking-tight mb-6"
            >
              The data exists.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-orange-500 to-amber-500">
                It never arrives in time.
              </span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base sm:text-lg text-slate-600 dark:text-slate-300 font-normal leading-relaxed"
            >
              In mountainous river basins, cloudbursts transition from atmospheric anomalies to destructive flash floods in minutes. Traditional communication workflows fail when every second dictates survival.
            </motion.p>
          </div>

          {/* Right: Three Stacked Glass Facts */}
          <div className="lg:col-span-7 flex flex-col gap-5 sm:gap-6">
            {problemFacts.map((fact, index) => {
              const Icon = fact.icon;
              return (
                <motion.div
                  key={fact.id}
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.55, delay: index * 0.15 }}
                  className={`relative p-6 sm:p-7 rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border ${fact.border} shadow-[0_10px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_12px_32px_rgba(0,0,0,0.3)] hover:-translate-y-1 transition-all duration-300 group`}
                >
                  <div className="flex items-start gap-4 sm:gap-5">
                    <div
                      className={`w-12 h-12 rounded-2xl ${fact.bg} border ${fact.border} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-200`}
                    >
                      <Icon size={24} className={fact.color} />
                    </div>

                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[11px] font-mono uppercase tracking-widest text-slate-500 dark:text-slate-400">
                          Critical Gap 0{fact.id}
                        </span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-bold font-heading text-slate-900 dark:text-white mb-1.5 leading-snug">
                        {fact.text}
                      </h3>
                      <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                        {fact.title}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
}
