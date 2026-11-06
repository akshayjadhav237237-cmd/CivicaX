import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Play, Satellite, Droplets, Waves, Sparkles, Activity } from 'lucide-react';

export function HeroSection() {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const heroRef = useRef(null);

  // Mouse parallax state
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (shouldReduceMotion) return;

    const handleMouseMove = (e) => {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      setMousePos({ x, y });
    };

    const node = heroRef.current;
    if (node) {
      node.addEventListener('mousemove', handleMouseMove);
    }
    return () => {
      if (node) {
        node.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, [shouldReduceMotion]);

  const pX = shouldReduceMotion ? 0 : mousePos.x * 24;
  const pY = shouldReduceMotion ? 0 : mousePos.y * 24;

  const floatingChips = [
    {
      id: 'gpm',
      label: 'NASA GPM',
      sub: 'Precipitation Radar',
      icon: Satellite,
      color: 'text-cyan-500',
      pos: 'top-2 left-2 sm:top-8 sm:-left-6',
      delay: 0,
    },
    {
      id: 'smap',
      label: 'SMAP',
      sub: 'Soil Saturation',
      icon: Droplets,
      color: 'text-blue-500',
      pos: 'bottom-16 left-2 sm:bottom-24 sm:-left-10',
      delay: 0.8,
    },
    {
      id: 'manning',
      label: "Manning's Equation",
      sub: 'Hydraulic Routing',
      icon: Waves,
      color: 'text-teal-500',
      pos: 'top-2 right-2 sm:top-10 sm:-right-8',
      delay: 0.4,
    },
    {
      id: 'gpt',
      label: 'GPT-4o',
      sub: 'Situation Synthesis',
      icon: Sparkles,
      color: 'text-amber-500',
      pos: 'bottom-4 right-2 sm:bottom-12 sm:-right-4',
      delay: 1.2,
    },
  ];

  return (
    <section
      ref={heroRef}
      className="relative pt-28 sm:pt-36 lg:pt-40 pb-16 sm:pb-24 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Bold Typography & CTAs */}
          <div className="lg:col-span-7 flex flex-col items-start text-left z-10">
            {/* Live Indicator Pill */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 mb-6 shadow-sm"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500" />
              </span>
              <span className="tracking-wide uppercase text-[11px] font-mono text-slate-500 dark:text-slate-400">
                Mandakini River Basin Telemetry
              </span>
              <span className="text-teal-600 dark:text-teal-400 font-bold">10-Min Cycle</span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.1 }}
              className="text-4xl sm:text-6xl xl:text-7xl font-extrabold tracking-tight font-heading text-slate-900 dark:text-white leading-[1.08] mb-6"
            >
              See the flood{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-teal-500 to-cyan-500">
                before it happens.
              </span>
            </motion.h1>

            {/* Subtext */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.22 }}
              className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 font-normal leading-relaxed max-w-2xl mb-8 sm:mb-10"
            >
              CivicaX turns live NASA satellite data and real hydrology physics into street-level flood warnings, minutes before water arrives.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto"
            >
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="px-7 py-3.5 rounded-full text-base font-semibold text-white bg-gradient-to-r from-blue-600 via-blue-500 to-teal-500 hover:from-blue-500 hover:to-teal-400 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-200 flex items-center justify-center gap-2 group active:scale-95"
              >
                <span>Get Started</span>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/login')}
                className="px-6 py-3.5 rounded-full text-base font-semibold text-slate-800 dark:text-slate-100 bg-white/70 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700/80 backdrop-blur-xl border border-slate-300/80 dark:border-slate-700 shadow-md shadow-slate-900/5 hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 active:scale-95"
              >
                <Play size={16} className="text-teal-500 fill-teal-500" />
                <span>Try Live Demo</span>
              </button>
            </motion.div>

            {/* Quick Micro Badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-10 pt-6 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-slate-500 dark:text-slate-400 font-mono"
            >
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span>Zero-Delay Startup</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                <span>Kedarnath Basin Model</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>Public Safety Verified</span>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Animated Mountain, Rain & River SVG Scene */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            {/* Parallax Container */}
            <motion.div
              style={{
                x: pX,
                y: pY,
              }}
              transition={{ type: 'spring', damping: 20, stiffness: 100 }}
              className="relative w-full aspect-square max-w-[500px]"
            >
              {/* Outer Glow Halo */}
              <div className="absolute inset-4 rounded-[2.5rem] bg-gradient-to-tr from-teal-500/25 via-blue-600/20 to-amber-500/15 blur-2xl -z-10" />

              {/* Glass Container Framing the Scene */}
              <div className="w-full h-full rounded-[2.5rem] overflow-hidden bg-gradient-to-b from-white/60 to-white/30 dark:from-slate-900/80 dark:to-slate-950/70 backdrop-blur-2xl border border-white/80 dark:border-slate-800/80 shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.5)] p-5 flex flex-col justify-between relative">
                
                {/* Scene Header Telemetry */}
                <div className="flex items-center justify-between z-20">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                    <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-slate-700 dark:text-slate-200">
                      LIVE RADAR • KEDARNATH
                    </span>
                  </div>
                  <div className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300">
                    3,583m ASL
                  </div>
                </div>

                {/* Vector SVG Scene: Mountains, Rain, Rising River, Alert Rings */}
                <div className="absolute inset-0 z-10 flex items-center justify-center overflow-hidden">
                  <svg
                    viewBox="0 0 500 500"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-full"
                  >
                    <defs>
                      {/* Gradients */}
                      <linearGradient id="skyGrad" x1="250" y1="0" x2="250" y2="300" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#0284c7" stopOpacity="0.15" />
                        <stop offset="1" stopColor="#0f766e" stopOpacity="0.02" />
                      </linearGradient>

                      <linearGradient id="bgMountain" x1="250" y1="120" x2="250" y2="360" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#334155" stopOpacity="0.4" />
                        <stop offset="1" stopColor="#1e293b" stopOpacity="0.75" />
                      </linearGradient>

                      <linearGradient id="midMountain" x1="250" y1="160" x2="250" y2="400" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#0ea5e9" stopOpacity="0.5" />
                        <stop offset="1" stopColor="#0369a1" stopOpacity="0.8" />
                      </linearGradient>

                      <linearGradient id="fgMountain" x1="250" y1="220" x2="250" y2="460" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#0f766e" stopOpacity="0.7" />
                        <stop offset="1" stopColor="#115e59" stopOpacity="0.9" />
                      </linearGradient>

                      <linearGradient id="riverGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
                        <stop offset="50%" stopColor="#0284c7" stopOpacity="0.85" />
                        <stop offset="100%" stopColor="#0369a1" stopOpacity="0.95" />
                      </linearGradient>
                    </defs>

                    {/* Sky Tint */}
                    <rect width="500" height="500" fill="url(#skyGrad)" />

                    {/* Background Peak 1 (High Glacier Ridge) */}
                    <path
                      d="M60 360 L190 140 L280 260 L380 120 L480 360 Z"
                      fill="url(#bgMountain)"
                    />
                    {/* Glacier snowcaps */}
                    <path
                      d="M190 140 L160 190 L190 180 L220 195 Z"
                      fill="#ffffff"
                      opacity="0.7"
                    />
                    <path
                      d="M380 120 L350 175 L380 165 L415 180 Z"
                      fill="#ffffff"
                      opacity="0.7"
                    />

                    {/* Midground Mountain Ridge */}
                    <path
                      d="M0 380 L120 210 L230 330 L340 190 L500 390 Z"
                      fill="url(#midMountain)"
                    />

                    {/* Foreground Himalayan Valleys */}
                    <path
                      d="M-20 440 L100 290 L200 380 L290 310 L420 440 Z"
                      fill="url(#fgMountain)"
                    />

                    {/* Mandakini River Flow Channel (S-curve) */}
                    <motion.path
                      d="M245 285 Q260 340 220 380 T260 450 T240 510"
                      stroke="url(#riverGrad)"
                      strokeWidth="28"
                      strokeLinecap="round"
                      fill="none"
                      initial={{ pathLength: 0.8, opacity: 0.8 }}
                      animate={
                        shouldReduceMotion
                          ? { opacity: 0.9 }
                          : {
                              strokeWidth: [24, 32, 24],
                              opacity: [0.8, 1, 0.8],
                            }
                      }
                      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                    />

                    {/* Inner River Core with Flow Streak */}
                    <motion.path
                      d="M245 285 Q260 340 220 380 T260 450 T240 510"
                      stroke="#e0f2fe"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray="16 12"
                      fill="none"
                      animate={
                        shouldReduceMotion
                          ? {}
                          : {
                              strokeDashoffset: [0, -56],
                            }
                      }
                      transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
                    />

                    {/* Animated Rain Streaks (Pure CSS/SVG) */}
                    {!shouldReduceMotion && (
                      <g stroke="#38bdf8" strokeWidth="1.5" opacity="0.65" strokeLinecap="round">
                        {[
                          { x: 80, y: 100, l: 30, d: '0s' },
                          { x: 150, y: 70, l: 24, d: '0.4s' },
                          { x: 220, y: 110, l: 35, d: '0.2s' },
                          { x: 300, y: 80, l: 28, d: '0.7s' },
                          { x: 370, y: 120, l: 32, d: '0.5s' },
                          { x: 440, y: 90, l: 25, d: '0.9s' },
                          { x: 110, y: 220, l: 30, d: '0.3s' },
                          { x: 180, y: 200, l: 38, d: '0.8s' },
                          { x: 320, y: 230, l: 26, d: '0.1s' },
                          { x: 400, y: 210, l: 34, d: '0.6s' },
                        ].map((r, i) => (
                          <motion.line
                            key={i}
                            x1={r.x}
                            y1={r.y}
                            x2={r.x - 12}
                            y2={r.y + r.l}
                            initial={{ y: -50, opacity: 0 }}
                            animate={{
                              y: [0, 180],
                              opacity: [0, 0.8, 0],
                            }}
                            transition={{
                              duration: 1.1,
                              repeat: Infinity,
                              delay: parseFloat(r.d),
                              ease: 'linear',
                            }}
                          />
                        ))}
                      </g>
                    )}

                    {/* Beacon / Alert Pulsing Rings at Kedarnath Temple Coordinates */}
                    <g transform="translate(245, 285)">
                      {/* Pulse Wave 1 */}
                      <motion.circle
                        r="20"
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="2"
                        initial={{ scale: 0.5, opacity: 0.9 }}
                        animate={
                          shouldReduceMotion
                            ? { scale: 1, opacity: 0.6 }
                            : {
                                scale: [0.6, 2.6],
                                opacity: [0.9, 0],
                              }
                        }
                        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
                      />
                      {/* Pulse Wave 2 */}
                      <motion.circle
                        r="35"
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="1.5"
                        initial={{ scale: 0.5, opacity: 0.8 }}
                        animate={
                          shouldReduceMotion
                            ? { scale: 1, opacity: 0.4 }
                            : {
                                scale: [0.5, 2.8],
                                opacity: [0.8, 0],
                              }
                        }
                        transition={{ duration: 2.2, repeat: Infinity, delay: 0.8, ease: 'easeOut' }}
                      />
                      {/* Center Beacon Point */}
                      <circle r="8" fill="#ef4444" className="shadow-lg" />
                      <circle r="4" fill="#ffffff" />
                    </g>
                  </svg>
                </div>

                {/* Scene Bottom Metric Card */}
                <div className="z-20 mt-auto bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-3 border border-slate-200/90 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity size={16} className="text-teal-500" />
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                      River Velocity: 3.12 m/s
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-red-600 dark:text-red-400 bg-red-100/70 dark:bg-red-950/70 px-2 py-0.5 rounded-full border border-red-300 dark:border-red-800">
                    STAGE: WATCH
                  </span>
                </div>
              </div>

              {/* Drifting Floating Glass Chips */}
              {floatingChips.map((chip) => {
                const IconComponent = chip.icon;
                return (
                  <motion.div
                    key={chip.id}
                    className={`absolute ${chip.pos} z-30 pointer-events-none select-none`}
                    initial={{ y: 0 }}
                    animate={
                      shouldReduceMotion
                        ? {}
                        : {
                            y: [-6, 6, -6],
                          }
                    }
                    transition={{
                      duration: 4.5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: chip.delay,
                    }}
                  >
                    <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border border-white/90 dark:border-slate-700/80 shadow-[0_8px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_12px_28px_rgba(0,0,0,0.4)]">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <IconComponent size={15} className={chip.color} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-900 dark:text-white font-heading leading-tight">
                          {chip.label}
                        </span>
                        <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400 leading-tight">
                          {chip.sub}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}
