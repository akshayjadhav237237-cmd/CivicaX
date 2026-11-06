import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Cpu, Terminal, Database, Server, Globe2, Radio, Sparkles } from 'lucide-react';

export function UnderTheHoodSection() {
  const [isPaused, setIsPaused] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const techChips = [
    { name: 'NASA EONET', category: 'Earth Events', icon: Globe2 },
    { name: 'FIRMS', category: 'Thermal Anomaly', icon: Radio },
    { name: 'GPM IMERG', category: 'Precipitation', icon: Globe2 },
    { name: 'SMAP', category: 'Soil Moisture', icon: Radio },
    { name: 'SRTM', category: '30m Topography', icon: Globe2 },
    { name: 'OpenStreetMap', category: 'Vector Grid', icon: Globe2 },
    { name: 'OSRM', category: 'Route Physics', icon: Terminal },
    { name: 'Open-Meteo', category: 'High-Res Forecast', icon: Radio },
    { name: 'GPT-4o', category: 'Situation AI', icon: Sparkles },
    { name: 'React', category: 'Interface Core', icon: Cpu },
    { name: 'Node.js', category: 'Backend Engine', icon: Server },
    { name: 'PostgreSQL', category: 'Geospatial DB', icon: Database },
    { name: 'Socket.io', category: 'Sub-Second Stream', icon: Radio },
  ];

  // Duplicate for seamless infinite marquee loop
  const marqueeList = [...techChips, ...techChips, ...techChips];

  return (
    <section id="under-the-hood" className="py-20 sm:py-28 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200/60 dark:bg-slate-800/60 border border-slate-300/60 dark:border-slate-700/60 text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-4">
          <Terminal size={14} />
          <span>Under the Hood</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-slate-900 dark:text-white tracking-tight">
          Engineered on Sovereign Open Telemetry
        </h2>
        <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
          Combining global space-agency earth observation systems with modern full-stack web engineering.
        </p>
      </div>

      {/* Marquee Wrapper with fade gradients on edges */}
      <div
        className="relative w-full overflow-hidden select-none py-4"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Left & Right Edge Vignette Gradients */}
        <div className="absolute top-0 bottom-0 left-0 w-24 sm:w-44 bg-gradient-to-r from-[var(--bg-base)] to-transparent z-10 pointer-events-none" />
        <div className="absolute top-0 bottom-0 right-0 w-24 sm:w-44 bg-gradient-to-l from-[var(--bg-base)] to-transparent z-10 pointer-events-none" />

        {/* Marquee Track */}
        <motion.div
          className="flex items-center gap-4 sm:gap-6 whitespace-nowrap will-change-transform"
          animate={
            shouldReduceMotion
              ? {}
              : {
                  x: isPaused ? undefined : ['0%', '-50%'],
                }
          }
          transition={{
            duration: 34,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{ width: 'max-content' }}
        >
          {marqueeList.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <div
                key={`${item.name}-${index}`}
                className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 shadow-[0_4px_16px_rgba(0,0,0,0.04)] dark:shadow-[0_6px_20px_rgba(0,0,0,0.3)] hover:border-blue-500/50 hover:scale-105 transition-all duration-200 cursor-default"
              >
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 dark:bg-blue-950/50 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-teal-400">
                  <IconComponent size={16} />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-sm font-bold font-heading text-slate-900 dark:text-white leading-tight">
                    {item.name}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    {item.category}
                  </span>
                </div>
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
