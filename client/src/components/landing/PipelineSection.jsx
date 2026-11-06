import { motion, useReducedMotion } from 'framer-motion';
import { SectionHeader } from './ui/SectionHeader';
import { Card } from './ui/Card';

export function PipelineSection() {
  const shouldReduceMotion = useReducedMotion();

  const steps = [
    {
      num: '01',
      title: 'Satellite Ingest',
      desc: 'NASA GPM rainfall, SMAP soil moisture, SRTM terrain, and OSM river/street vectors ingested continuously.',
      svg: (
        <svg viewBox="0 0 120 70" fill="none" className="w-full h-16 stroke-[var(--text-secondary)]">
          <circle cx="28" cy="22" r="8" strokeWidth="1.5" />
          <line x1="20" y1="22" x2="36" y2="22" strokeWidth="1.5" />
          <line x1="12" y1="22" x2="16" y2="22" strokeWidth="1.5" />
          <line x1="40" y1="22" x2="44" y2="22" strokeWidth="1.5" />
          {/* Signal beam down */}
          <path d="M28 32 L20 54 M28 32 L28 54 M28 32 L36 54" strokeDasharray="2 2" strokeWidth="1" stroke="var(--accent-primary)" />
          {/* Ground contour */}
          <path d="M10 58 Q40 46 80 54 T115 50" strokeWidth="1.5" />
          <path d="M55 52 L75 35 L95 53" strokeWidth="1.5" stroke="var(--border-strong)" />
        </svg>
      ),
    },
    {
      num: '02',
      title: 'Hydrology Physics',
      desc: "SCS Curve Number runoff, Manning's Equation velocity, overflow threshold verification, urban inundation, and slope stability.",
      svg: (
        <svg viewBox="0 0 120 70" fill="none" className="w-full h-16 stroke-[var(--text-secondary)]">
          {/* Channel cross-section */}
          <path d="M15 20 L35 52 L85 52 L105 20" strokeWidth="1.5" />
          {/* Water level */}
          <line x1="25" y1="36" x2="95" y2="36" stroke="var(--accent-primary)" strokeWidth="1.5" strokeDasharray="3 2" />
          {/* Velocity arrow */}
          <path d="M50 36 L70 36 M66 32 L70 36 L66 40" stroke="var(--accent-primary)" strokeWidth="1.5" />
          <text x="44" y="22" fill="var(--text-muted)" fontSize="9" fontFamily="Inter, sans-serif">Q = (1/n)AR^(2/3)S^(1/2)</text>
        </svg>
      ),
    },
    {
      num: '03',
      title: 'AI Wording',
      desc: 'GPT-4o converts verified numeric thresholds into plain-language citizen alerts and government briefings, with cached fallback templates.',
      svg: (
        <svg viewBox="0 0 120 70" fill="none" className="w-full h-16 stroke-[var(--text-secondary)]">
          {/* Processing node */}
          <rect x="15" y="18" width="36" height="34" rx="4" strokeWidth="1.5" />
          <line x1="22" y1="26" x2="44" y2="26" strokeWidth="1.5" stroke="var(--accent-primary)" />
          <line x1="22" y1="34" x2="38" y2="34" strokeWidth="1.5" />
          <line x1="22" y1="42" x2="42" y2="42" strokeWidth="1.5" />
          {/* Arrow */}
          <path d="M58 35 L70 35 M66 31 L70 35 L66 39" strokeWidth="1.5" stroke="var(--accent-primary)" />
          {/* Speech bubble */}
          <rect x="76" y="16" width="36" height="38" rx="4" strokeWidth="1.5" />
          <path d="M82 25 H104 M82 32 H100 M82 39 H94" strokeWidth="1" stroke="var(--border-strong)" />
        </svg>
      ),
    },
    {
      num: '04',
      title: 'Dispatch',
      desc: 'Synchronized broadcast: live map vectors, instant push notifications, magistrate command center, and resource allocation.',
      svg: (
        <svg viewBox="0 0 120 70" fill="none" className="w-full h-16 stroke-[var(--text-secondary)]">
          {/* Radio tower */}
          <path d="M60 16 L48 54 H72 Z" strokeWidth="1.5" />
          <circle cx="60" cy="16" r="3" fill="var(--accent-primary)" />
          <path d="M48 24 A16 16 0 0 1 72 24" strokeWidth="1.2" stroke="var(--accent-primary)" />
          <path d="M42 18 A24 24 0 0 1 78 18" strokeWidth="1.2" stroke="var(--accent-primary)" strokeDasharray="2 2" />
          {/* Terminal / Device */}
          <rect x="16" y="38" width="22" height="18" rx="2" strokeWidth="1.5" />
          <rect x="82" y="34" width="24" height="24" rx="2" strokeWidth="1.5" />
        </svg>
      ),
    },
  ];

  return (
    <section id="pipeline" className="landing-section">
      <div className="landing-container px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <SectionHeader
          eyebrow="02 // HOW THE WARNING IS BUILT"
          title="Physics computes the numbers. AI only writes the words."
          lead="Every threshold comes from satellite data and hydrology equations. GPT-4o turns finished numbers into plain-language alerts and official briefings."
          align="left"
        />

        {/* Blueprint Frame with 4 Cards & Animated Signal Line */}
        <div className="relative">
          
          {/* Desktop Connecting SVG Signal Line */}
          <div className="hidden lg:block absolute top-[90px] left-[12%] right-[12%] h-[2px] pointer-events-none z-0">
            <svg className="w-full h-4 overflow-visible" fill="none">
              <motion.line
                x1="0"
                y1="2"
                x2="100%"
                y2="2"
                stroke="var(--accent-primary)"
                strokeWidth="2"
                strokeDasharray="6 4"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : { duration: 1.2, ease: [0.4, 0, 0.2, 1] }
                }
              />
            </svg>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
            {steps.map((st) => (
              <Card
                key={st.num}
                className="bg-[var(--bg-surface)] flex flex-col justify-between hover:border-[var(--border-strong)] transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-semibold tracking-wider text-[var(--accent-primary)] uppercase">
                      STAGE {st.num}
                    </span>
                    <span className="micro text-[var(--text-muted)] font-medium tracking-wide">
                      VERIFIED
                    </span>
                  </div>

                  <div className="mb-4 bg-[var(--bg-subtle)] p-2 rounded-[6px] border border-[var(--border-grid)]">
                    {st.svg}
                  </div>

                  <h3 className="landing-h3 mb-2 text-[var(--text-primary)]">
                    {st.title}
                  </h3>
                  <p className="body-base text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                    {st.desc}
                  </p>
                </div>
              </Card>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
}

export default PipelineSection;
