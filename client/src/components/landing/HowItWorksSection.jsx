import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Satellite,
  Calculator,
  Waves,
  MapPin,
  Bot,
  Send,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Layers,
  Sparkles,
  Radio,
} from 'lucide-react';

export function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState(0);
  const shouldReduceMotion = useReducedMotion();
  const stepRefs = useRef([]);

  const steps = [
    {
      id: 1,
      tag: 'Step 01 / Ingestion',
      title: 'NASA GPM rainfall + SMAP soil moisture + SRTM terrain',
      desc: 'Synchronous ingestion of precipitation radar from GPM IMERG, soil saturation from SMAP, and 30m digital elevation slope models from SRTM.',
      icon: Satellite,
      color: 'from-blue-500 to-cyan-500',
      badge: 'Data Feed',
    },
    {
      id: 2,
      tag: 'Step 02 / Hydrology',
      title: 'SCS Curve Number calculates runoff',
      desc: 'Soil Conservation Service empirical equations compute the excess rainwater volume incapable of infiltrating ground layers.',
      icon: Calculator,
      color: 'from-cyan-500 to-teal-500',
      badge: 'Runoff Dynamics',
    },
    {
      id: 3,
      tag: 'Step 03 / Hydraulics',
      title: "Manning's Equation calculates river velocity and overflow",
      desc: 'Physics modeling using cross-sectional channel geometry, bed roughness, and steep terrain slope to predict river discharge rates and crest time.',
      icon: Waves,
      color: 'from-teal-500 to-emerald-500',
      badge: 'Fluid Dynamics',
    },
    {
      id: 4,
      tag: 'Step 04 / Inundation',
      title: 'Urban inundation maps flood depth onto real streets',
      desc: 'Overpass OpenStreetMap road networks intersected with flood vectors, projecting precise submersion depth onto every alley and path.',
      icon: MapPin,
      color: 'from-amber-500 to-orange-500',
      badge: 'Street Mapping',
    },
    {
      id: 5,
      tag: 'Step 05 / Intelligence',
      title: 'GPT-4o writes the alert and official briefing',
      desc: 'Generative AI translates raw hydrological figures into actionable tactical summaries and executive briefings for District Collectors.',
      icon: Bot,
      color: 'from-orange-500 to-red-500',
      badge: 'Executive AI',
    },
    {
      id: 6,
      tag: 'Step 06 / Action',
      title: 'Live map, push alert, government dispatch',
      desc: 'Sub-second WebSocket dispatch: browser notifications to citizens, resource routing to NDRF units, and dynamic road blockade updates.',
      icon: Send,
      color: 'from-red-500 to-purple-600',
      badge: 'Emergency Response',
    },
  ];

  // Intersection Observer to track active step while scrolling
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-step-index'));
            if (!isNaN(index)) {
              setActiveStep(index);
            }
          }
        });
      },
      {
        root: null,
        rootMargin: '-35% 0px -40% 0px',
        threshold: 0.1,
      }
    );

    stepRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <section id="how-it-works" className="py-20 sm:py-32 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-16 sm:mb-24">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 dark:bg-blue-950/40 border border-blue-500/20 text-xs font-mono font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-4">
            <Layers size={14} />
            <span>The Hydrology Pipeline</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold font-heading text-slate-900 dark:text-white tracking-tight leading-tight">
            How live data becomes{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-teal-500 to-emerald-500">
              an actionable warning.
            </span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300">
            A continuous loop from orbit to street level, running automated physics cycles every 10 minutes.
          </p>
        </div>

        {/* Sticky Scroll Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left Column: Sticky Animated Diagram */}
          <div className="lg:col-span-6 lg:sticky lg:top-28 z-20">
            <div className="w-full rounded-3xl bg-slate-900/95 text-white border border-slate-800 p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-2xl min-h-[420px] sm:min-h-[460px] flex flex-col justify-between">
              
              {/* Background Glow */}
              <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

              {/* Diagram Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 z-10">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse" />
                  <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                    PIPELINE ARCHITECTURE
                  </span>
                </div>
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-teal-400 font-semibold">
                  STEP {activeStep + 1} OF 6
                </span>
              </div>

              {/* Dynamic Animated Diagram Per Step */}
              <div className="my-auto py-8 z-10 flex flex-col items-center justify-center text-center">
                <AnimatePresence mode="wait">
                  
                  {/* Step 1: Satellite Constellation */}
                  {activeStep === 0 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.35 }}
                      className="w-full flex flex-col items-center"
                    >
                      <div className="relative w-36 h-36 flex items-center justify-center mb-6">
                        <div className="absolute inset-0 rounded-full border border-cyan-500/30 animate-spin" style={{ animationDuration: '14s' }} />
                        <div className="absolute inset-4 rounded-full border border-blue-500/20 border-dashed animate-spin" style={{ animationDuration: '20s', animationDirection: 'reverse' }} />
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                          <Satellite size={38} className="text-white" />
                        </div>
                      </div>
                      <div className="font-heading font-bold text-xl text-white mb-2">
                        NASA GPM & SMAP Triangulation
                      </div>
                      <p className="text-xs text-slate-400 font-mono max-w-sm">
                        Continuous radar swath ingestion calibrated against SRTM 30m digital terrain slope.
                      </p>
                    </motion.div>
                  )}

                  {/* Step 2: SCS Curve Runoff Calculation */}
                  {activeStep === 1 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.35 }}
                      className="w-full flex flex-col items-center"
                    >
                      <div className="w-full max-w-xs bg-slate-950/80 rounded-2xl p-4 border border-slate-800 mb-6 font-mono text-left">
                        <div className="text-[10px] text-teal-400 mb-1">// SCS RUNOFF EQUATION</div>
                        <div className="text-sm text-cyan-300 font-bold mb-2">Q = (P - 0.2S)² / (P + 0.8S)</div>
                        <div className="text-xs text-slate-400 space-y-1 border-t border-slate-800 pt-2">
                          <div className="flex justify-between">
                            <span>Precipitation (P):</span>
                            <span className="text-white font-bold">44.2 mm/hr</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Soil Saturation (S):</span>
                            <span className="text-teal-400 font-bold">82.5%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Computed Runoff (Q):</span>
                            <span className="text-amber-400 font-bold">78.4 mm</span>
                          </div>
                        </div>
                      </div>
                      <div className="font-heading font-bold text-xl text-white mb-2">
                        Empirical Runoff Modeling
                      </div>
                      <p className="text-xs text-slate-400 font-mono max-w-sm">
                        Determines the exact fraction of precipitation converting to surface flash water.
                      </p>
                    </motion.div>
                  )}

                  {/* Step 3: Manning's Equation Hydraulics */}
                  {activeStep === 2 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.35 }}
                      className="w-full flex flex-col items-center"
                    >
                      <div className="w-full max-w-xs bg-slate-950/80 rounded-2xl p-4 border border-slate-800 mb-6 font-mono text-left">
                        <div className="text-[10px] text-teal-400 mb-1">// OPEN CHANNEL HYDRAULICS</div>
                        <div className="text-sm text-teal-300 font-bold mb-2">Q = (1/n) · A · R^(2/3) · S^(1/2)</div>
                        <div className="text-xs text-slate-400 space-y-1 border-t border-slate-800 pt-2">
                          <div className="flex justify-between">
                            <span>Channel Velocity:</span>
                            <span className="text-white font-bold">3.12 m/s</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Discharge Rate:</span>
                            <span className="text-red-400 font-bold">420 m³/s</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Overflow Stage:</span>
                            <span className="text-red-400 font-bold">CRITICAL (+1.2m)</span>
                          </div>
                        </div>
                      </div>
                      <div className="font-heading font-bold text-xl text-white mb-2">
                        River Flow & Overflow Crest
                      </div>
                      <p className="text-xs text-slate-400 font-mono max-w-sm">
                        Computes surge velocity through the steep Mandakini river gorge.
                      </p>
                    </motion.div>
                  )}

                  {/* Step 4: Urban Inundation Map */}
                  {activeStep === 3 && (
                    <motion.div
                      key="step4"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.35 }}
                      className="w-full flex flex-col items-center"
                    >
                      <div className="relative w-56 h-36 bg-slate-950/90 rounded-2xl border border-slate-800 p-3 mb-6 flex flex-col justify-between overflow-hidden">
                        {/* Street Grid SVG */}
                        <svg className="w-full h-full" viewBox="0 0 200 100">
                          {/* Street grid paths */}
                          <path d="M20 20 L180 20 M20 50 L180 50 M20 80 L180 80 M50 10 L50 90 M100 10 L100 90 M150 10 L150 90" stroke="#334155" strokeWidth="2" />
                          {/* Inundated Zone */}
                          <path d="M45 45 Q90 60 145 45 L155 85 L45 85 Z" fill="#ef4444" opacity="0.4" />
                          <path d="M45 45 Q90 60 145 45" stroke="#ef4444" strokeWidth="3" fill="none" />
                          <circle cx="100" cy="50" r="4" fill="#fbbf24" />
                        </svg>
                        <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 border-t border-slate-800 pt-1">
                          <span>OSM Grid Overlay</span>
                          <span className="text-red-400 font-bold">Depth: 1.85m</span>
                        </div>
                      </div>
                      <div className="font-heading font-bold text-xl text-white mb-2">
                        Street-Level Inundation Vector
                      </div>
                      <p className="text-xs text-slate-400 font-mono max-w-sm">
                        Projects water spillover onto exact street coordinates and footpaths.
                      </p>
                    </motion.div>
                  )}

                  {/* Step 5: GPT-4o Situation Briefing */}
                  {activeStep === 4 && (
                    <motion.div
                      key="step5"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.35 }}
                      className="w-full flex flex-col items-center"
                    >
                      <div className="w-full max-w-xs bg-slate-950/90 rounded-2xl p-4 border border-slate-800 mb-6 text-left">
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-800">
                          <Bot size={15} className="text-amber-400" />
                          <span className="text-[11px] font-mono font-bold text-amber-400">
                            GPT-4o SYNTHESIS ENGINE
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 italic font-mono leading-relaxed">
                          "CRITICAL ADVISORY: Mandakini discharge reached 420 m³/s. Mandakini North Bank will inundate in approx 22 minutes. Order immediate movement of Gaurikund camp occupants to Ridge Sector 4."
                        </p>
                      </div>
                      <div className="font-heading font-bold text-xl text-white mb-2">
                        Executive Situation Briefing
                      </div>
                      <p className="text-xs text-slate-400 font-mono max-w-sm">
                        Generates technical situation reports and actionable evacuation advisories.
                      </p>
                    </motion.div>
                  )}

                  {/* Step 6: Dispatch & Action */}
                  {activeStep === 5 && (
                    <motion.div
                      key="step6"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.35 }}
                      className="w-full flex flex-col items-center"
                    >
                      <div className="grid grid-cols-2 gap-3 w-full max-w-xs mb-6">
                        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-left">
                          <Radio size={16} className="text-red-400 mb-1" />
                          <div className="text-[11px] font-bold text-white">Browser Push</div>
                          <div className="text-[10px] text-slate-400 font-mono">Immediate Alert</div>
                        </div>
                        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-left">
                          <Send size={16} className="text-teal-400 mb-1" />
                          <div className="text-[11px] font-bold text-white">NDRF Dispatch</div>
                          <div className="text-[10px] text-slate-400 font-mono">GPS Assigned</div>
                        </div>
                      </div>
                      <div className="font-heading font-bold text-xl text-white mb-2">
                        Real-Time Multi-Agency Broadcast
                      </div>
                      <p className="text-xs text-slate-400 font-mono max-w-sm">
                        Simultaneous dissemination to citizens, emergency units, and district command.
                      </p>
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>

              {/* Diagram Footer Progress Dots */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800/80 z-10">
                <div className="flex items-center gap-1.5">
                  {steps.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setActiveStep(idx);
                        stepRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        activeStep === idx
                          ? 'w-8 bg-teal-400'
                          : 'w-2 bg-slate-700 hover:bg-slate-600'
                      }`}
                      aria-label={`Jump to step ${idx + 1}`}
                    />
                  ))}
                </div>
                <span className="text-[11px] font-mono text-slate-400">Automated 10m Loop</span>
              </div>
            </div>
          </div>

          {/* Right Column: Steps Scrolling Past */}
          <div className="lg:col-span-6 flex flex-col gap-6 sm:gap-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = activeStep === index;

              return (
                <div
                  key={step.id}
                  ref={(el) => (stepRefs.current[index] = el)}
                  data-step-index={index}
                  onClick={() => setActiveStep(index)}
                  className={`p-6 sm:p-8 rounded-3xl cursor-pointer transition-all duration-300 border ${
                    isActive
                      ? 'bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border-blue-500/50 shadow-[0_16px_40px_rgba(37,99,235,0.12)] dark:shadow-[0_20px_48px_rgba(0,0,0,0.4)] scale-[1.01]'
                      : 'bg-white/50 dark:bg-slate-900/40 backdrop-blur-md border-slate-200/80 dark:border-slate-800/80 hover:bg-white/70 dark:hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <span className="text-xs font-mono font-bold tracking-widest uppercase text-blue-600 dark:text-teal-400">
                      {step.tag}
                    </span>
                    <span
                      className={`text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full border ${
                        isActive
                          ? 'bg-blue-500/10 dark:bg-blue-950/50 border-blue-500/30 text-blue-600 dark:text-blue-400'
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {step.badge}
                    </span>
                  </div>

                  <div className="flex items-start gap-4 mb-3">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                        isActive
                          ? `bg-gradient-to-tr ${step.color} text-white shadow-md`
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Icon size={20} />
                    </div>

                    <h3 className="text-xl sm:text-2xl font-bold font-heading text-slate-900 dark:text-white leading-snug">
                      {step.title}
                    </h3>
                  </div>

                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed sm:pl-14">
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
}
