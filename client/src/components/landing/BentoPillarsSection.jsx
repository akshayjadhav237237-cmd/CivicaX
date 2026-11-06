import { useState, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ShieldAlert,
  HardHat,
  AlertTriangle,
  Building2,
  MapPin,
  ArrowRight,
  TrendingUp,
  Activity,
  CheckCircle2,
  Users,
  Compass,
  FileText,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * Interactive Bento Card with 3D Tilt and Cursor-Following Glow.
 */
function BentoCard({ children, className = '', glowColor = 'rgba(59,130,246,0.16)' }) {
  const cardRef = useRef(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [glowPos, setGlowPos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const handleMouseMove = (e) => {
    if (shouldReduceMotion || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const rY = ((x / rect.width) - 0.5) * 12; // tilt around Y axis
    const rX = ((y / rect.height) - 0.5) * -12; // tilt around X axis

    setRotate({ x: rX, y: rY });
    setGlowPos({ x, y });
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotate({ x: 0, y: 0 });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: '1000px',
      }}
      className={`relative rounded-3xl transition-all duration-300 ${className}`}
    >
      <div
        style={{
          transform: shouldReduceMotion
            ? 'none'
            : `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
          transformStyle: 'preserve-3d',
          transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.5s ease-out',
        }}
        className="w-full h-full rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-800 shadow-[0_12px_32px_rgba(0,0,0,0.05)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.4)] p-6 sm:p-8 flex flex-col justify-between overflow-hidden relative"
      >
        {/* Cursor Following Glow */}
        {isHovered && !shouldReduceMotion && (
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-300"
            style={{
              background: `radial-gradient(350px circle at ${glowPos.x}px ${glowPos.y}px, ${glowColor}, transparent 70%)`,
            }}
          />
        )}

        <div className="relative z-10 h-full flex flex-col justify-between">
          {children}
        </div>
      </div>
    </div>
  );
}

export function BentoPillarsSection() {
  const navigate = useNavigate();

  return (
    <section id="features" className="py-20 sm:py-32 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 dark:bg-teal-950/40 border border-teal-500/20 text-xs font-mono font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest mb-4">
            <Compass size={14} />
            <span>Unified Command Architecture</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold font-heading text-slate-900 dark:text-white tracking-tight leading-tight">
            Three pillars of resilience,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 via-blue-600 to-indigo-600">
              one unified command.
            </span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300">
            Engineered so citizens, civic managers, emergency responders, and district magistrates share the exact same tactical reality.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 sm:gap-8">
          
          {/* Tile 1: Emergency Responder (Large Tile - 7 cols) */}
          <BentoCard
            className="lg:col-span-7 min-h-[440px]"
            glowColor="rgba(239,68,68,0.18)"
          >
            <div>
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 dark:bg-red-950/40 border border-red-500/20 flex items-center justify-center text-red-500">
                  <AlertTriangle size={24} />
                </div>
                <span className="text-xs font-mono font-bold text-red-500 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
                  PILLAR I • TACTICAL
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 dark:text-white mb-2">
                Emergency Responder
              </h3>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl mb-6">
                Satellite-driven early warning for floods and landslides with precision evacuation routing, active hazard overlays, and real-time responder dispatch.
              </p>
            </div>

            {/* Mini Animated Map with Colored Zone Polygon */}
            <div className="w-full rounded-2xl bg-slate-950/90 border border-slate-800 p-4 relative overflow-hidden mt-4">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-2 border-b border-slate-800 pb-2">
                <span className="flex items-center gap-1.5 text-teal-400">
                  <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
                  KEDARNATH MICRO-ZONE VECTOR
                </span>
                <span className="text-red-400 font-bold">INUNDATION: 78.4%</span>
              </div>

              {/* Vector Contour Scene */}
              <div className="relative h-44 w-full flex items-center justify-center">
                <svg viewBox="0 0 400 160" className="w-full h-full">
                  {/* Topographic Contours */}
                  <path d="M10 80 Q100 40 200 70 T390 60" stroke="#334155" strokeWidth="1.5" fill="none" />
                  <path d="M10 110 Q100 70 200 100 T390 90" stroke="#334155" strokeWidth="1.5" fill="none" />
                  <path d="M10 140 Q100 100 200 130 T390 120" stroke="#334155" strokeWidth="1.5" fill="none" />

                  {/* Red Inundation Zone Polygon */}
                  <polygon
                    points="70,120 160,85 260,110 320,80 340,140 80,150"
                    fill="#ef4444"
                    fillOpacity="0.35"
                    stroke="#ef4444"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                  />

                  {/* Evacuation Route (Cyan Dashed Line) */}
                  <path
                    d="M160 85 Q220 50 300 35"
                    stroke="#06b6d4"
                    strokeWidth="3"
                    strokeDasharray="6 4"
                    fill="none"
                  />

                  {/* Rescue Node 1 */}
                  <circle cx="160" cy="85" r="5" fill="#ef4444" />
                  <circle cx="160" cy="85" r="10" stroke="#ef4444" strokeWidth="1.5" fill="none" className="animate-ping" />

                  {/* Evacuation Shelter (Safe Zone) */}
                  <circle cx="300" cy="35" r="7" fill="#10b981" />
                  <circle cx="300" cy="35" r="14" stroke="#10b981" strokeWidth="1.5" fill="none" />
                </svg>

                <div className="absolute bottom-2 left-2 text-[10px] font-mono bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700 text-slate-300">
                  Zone Kedarnath-001 • Critical Corridor
                </div>
              </div>
            </div>
          </BentoCard>

          {/* Tile 2: Civic Manager (5 cols) */}
          <BentoCard
            className="lg:col-span-5 min-h-[440px]"
            glowColor="rgba(249,115,22,0.18)"
          >
            <div>
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 dark:bg-orange-950/40 border border-orange-500/20 flex items-center justify-center text-orange-500">
                  <HardHat size={24} />
                </div>
                <span className="text-xs font-mono font-bold text-orange-500 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
                  PILLAR II • MUNICIPAL
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 dark:text-white mb-2">
                Civic Manager
              </h3>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                Report infrastructure issues directly to city departments and track resolution in real-time. Automated dispatch to PWD, Sanitation, and Electrical teams.
              </p>
            </div>

            {/* Visual: SLA Triage Queue */}
            <div className="space-y-2.5 mt-auto">
              <div className="p-3 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Drainage Overflow • Gaurikund
                  </span>
                </div>
                <span className="text-[10px] font-mono bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded font-bold">
                  RESOLVED
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Bridge Access Obstruction
                  </span>
                </div>
                <span className="text-[10px] font-mono bg-amber-500/15 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded font-bold">
                  ASSIGNED PWD
                </span>
              </div>
            </div>
          </BentoCard>

          {/* Tile 3: Safety Watch (5 cols) */}
          <BentoCard
            className="lg:col-span-5 min-h-[380px]"
            glowColor="rgba(16,185,129,0.18)"
          >
            <div>
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 dark:bg-teal-950/40 border border-teal-500/20 flex items-center justify-center text-teal-500">
                  <ShieldAlert size={24} />
                </div>
                <span className="text-xs font-mono font-bold text-teal-600 dark:text-teal-400 bg-teal-500/10 px-3 py-1 rounded-full border border-teal-500/20">
                  PILLAR III • COMMUNITY
                </span>
              </div>

              <h3 className="text-2xl font-bold font-heading text-slate-900 dark:text-white mb-2">
                Safety Watch
              </h3>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                Community-driven threat reporting to alert law enforcement of immediate public safety concerns, backed by consensus verification.
              </p>
            </div>

            {/* Visual: Consensus Meter */}
            <div className="p-4 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 mt-auto">
              <div className="flex items-center justify-between text-xs font-mono mb-2">
                <span className="text-slate-600 dark:text-slate-300 font-bold">Community Credibility</span>
                <span className="text-teal-600 dark:text-teal-400 font-bold">96% High Confidence</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full w-[96%]" />
              </div>
            </div>
          </BentoCard>

          {/* Tile 4: Government Command Center (Wide Tile - 7 cols or full width) */}
          <BentoCard
            className="lg:col-span-7 min-h-[380px]"
            glowColor="rgba(99,102,241,0.22)"
          >
            <div>
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 dark:bg-indigo-950/40 border border-indigo-500/20 flex items-center justify-center text-indigo-500">
                  <Building2 size={24} />
                </div>
                <span className="text-xs font-mono font-bold text-indigo-500 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                  COMMAND CENTER • MAGISTRATE
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 dark:text-white mb-2">
                Government Command Center
              </h3>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl mb-6">
                For District Collectors and Magistrates. Manage relief camps, auto-calculate NDMA resource requirements, and dispatch responders from a single pane of glass.
              </p>
            </div>

            {/* Multi-Metric Authority HUD */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-auto">
              <div className="p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-col">
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase">
                  Relief Shelters
                </span>
                <span className="text-lg font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                  12 Active
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-col">
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase">
                  Dam Capacity
                </span>
                <span className="text-lg font-bold font-mono text-amber-500 mt-0.5">
                  74.2% Safe
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-col col-span-2 sm:col-span-1">
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase">
                  AI Briefing
                </span>
                <span className="text-xs font-mono font-bold text-teal-600 dark:text-teal-400 mt-1 flex items-center gap-1">
                  <CheckCircle2 size={12} /> Auto-Generated
                </span>
              </div>
            </div>
          </BentoCard>

        </div>
      </div>
    </section>
  );
}
