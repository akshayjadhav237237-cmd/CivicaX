import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SectionHeader } from './ui/SectionHeader';
import { Card } from './ui/Card';
import { CornerCrosshairs } from './ui/CornerCrosshairs';
import { Check } from 'lucide-react';

const ROLES = [
  {
    id: 'citizen',
    label: 'Citizen',
    title: 'Citizen Interface',
    bullets: [
      'Real-time street flood alerts and high-ground evacuation route navigation.',
      'Civic report submission with geo-tagging and photo verification.',
      'Safety threat reporting directly into municipal dispatch queues.',
    ],
    schematic: {
      header: 'CITIZEN PORTAL // EVACUATION & CIVIC REPORTING',
      left: {
        title: 'EVACUATION ROUTE MAP',
        content: ['SURFACE ELEVATION PROFILE', 'HIGH-GROUND WAYPOINTS', 'SAFE HAVEN ROUTE: +120m'],
      },
      rightTop: {
        title: 'ACTIVE BASIN ALERT',
        content: ['STATUS: LIVE SATELLITE FEED', 'INUNDATION DEPTH: STREET LEVEL'],
      },
      rightBottom: {
        title: 'CIVIC DISPATCH QUEUE',
        content: ['REPORT #4092: DRAINAGE BLOCK', 'PHOTO ATTACHED // VERIFIED GPS'],
      },
    },
  },
  {
    id: 'government',
    label: 'Government Official',
    title: 'Government Command Center',
    bullets: [
      'Live flood alert dispatch and regional risk classification.',
      'Automated GPT-4o hydrological situation reports and briefings.',
      'Resource requirement calculator, equipment dispatch, and grievance approval.',
    ],
    schematic: {
      header: 'GOVERNMENT COMMAND CENTER // MUNICIPAL DISPATCH',
      left: {
        title: 'REGIONAL INUNDATION OVERVIEW',
        content: ['MANDAKINI BASIN CONTOUR', 'BASIN OVERFLOW PROBABILITY: REAL-TIME', 'ZONE DELTA SUMMARY'],
      },
      rightTop: {
        title: 'GPT-4o SITUATION BRIEFING',
        content: ['HYDROLOGICAL SUMMARY: GENERATED', 'DISTRICT COLLECTOR MEMO: READY'],
      },
      rightBottom: {
        title: 'RESOURCE DISPATCH CALCULATOR',
        content: ['4 HIGH-VOLUME PUMPS ALLOCATED', 'NDRF BATTALION NOTIFIED'],
      },
    },
  },
  {
    id: 'operator',
    label: 'Department Operator',
    title: 'Department Operator Workbench',
    bullets: [
      'Assigned municipal task and civic hazard work order triage.',
      'Field team status updates and real-time operational feedback.',
      'Resolution tracking with before-and-after photo verification.',
    ],
    schematic: {
      header: 'OPERATOR WORKBENCH // FIELD OPERATIONS',
      left: {
        title: 'ASSIGNED WORK ORDERS',
        content: ['TASK #114: EMBANKMENT CHECK', 'TASK #115: SLUICE GATE CLEARANCE', 'TASK #116: CULVERT REPAIR'],
      },
      rightTop: {
        title: 'FIELD CREW STATUS',
        content: ['CREW BRAVO-2: DEPLOYED EN ROUTE', 'ESTIMATED ON-SITE: 12 MIN'],
      },
      rightBottom: {
        title: 'RESOLUTION AUDIT LOG',
        content: ['BEFORE / AFTER PHOTO VERIFIED', 'SUPERVISOR SIGN-OFF REQUIRED'],
      },
    },
  },
  {
    id: 'admin',
    label: 'Admin',
    title: 'System Administration Console',
    bullets: [
      'Official access control and municipal personnel whitelisting.',
      'NASA and meteorological API health and latency monitor.',
      'System feature health check and database migration status.',
    ],
    schematic: {
      header: 'ADMIN CONSOLE // PLATFORM GOVERNANCE & TELEMETRY',
      left: {
        title: 'PERSONNEL WHITELIST & RBAC',
        content: ['DISTRICT OFFICIAL ACCESS: ACTIVE', 'MUNICIPALITY TOKENS: VALIDATED', 'ROLE AUDIT TRAIL: ENFORCED'],
      },
      rightTop: {
        title: 'SATELLITE & METEO PIPELINE HEALTH',
        content: ['NASA GPM: ONLINE (0.1° RES)', 'NASA SMAP: ONLINE (L-BAND)'],
      },
      rightBottom: {
        title: 'INFRASTRUCTURE TELEMETRY',
        content: ['API GATEWAY LATENCY: 28ms', 'MODEL INFERENCE STATUS: NOMINAL'],
      },
    },
  },
];

export function RolesSection() {
  const [activeRole, setActiveRole] = useState(ROLES[0].id);
  const currentRole = ROLES.find((r) => r.id === activeRole) || ROLES[0];

  return (
    <section id="roles" className="landing-section">
      <div className="landing-container px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <SectionHeader
          eyebrow="04 // ROLE-SPECIFIC INTERFACES"
          title="One data spine. Four views."
          lead="Every stakeholder acts from the same hydrological ground truth. Interfaces tailored specifically for citizens, commanders, field units, and platform administrators."
        />

        {/* Segmented Tab Bar */}
        <div className="mb-8 sm:mb-12">
          {/* Mobile: 2x2 grid of 44px buttons */}
          <div className="grid grid-cols-2 gap-2 sm:hidden">
            {ROLES.map((role) => {
              const isSelected = activeRole === role.id;
              return (
                <button
                  key={`mobile-${role.id}`}
                  type="button"
                  onClick={() => setActiveRole(role.id)}
                  className={`h-[44px] px-3 rounded-[6px] text-xs font-mono font-medium border transition-colors ${
                    isSelected
                      ? 'bg-[var(--bg-surface)] border-[var(--accent-primary)] text-[var(--text-primary)] shadow-sm'
                      : 'bg-[var(--bg-subtle)] border-[var(--border-grid)] text-[var(--text-secondary)]'
                  }`}
                >
                  {role.label}
                </button>
              );
            })}
          </div>

          {/* Desktop / Tablet: Segmented Bar */}
          <div className="hidden sm:inline-flex p-1.5 rounded-[8px] bg-[var(--bg-subtle)] border border-[var(--border-grid)] gap-1">
            {ROLES.map((role) => {
              const isSelected = activeRole === role.id;
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setActiveRole(role.id)}
                  className={`relative px-4 py-2 rounded-[6px] text-xs sm:text-sm font-medium transition-colors z-10 ${
                    isSelected
                      ? 'text-[var(--text-primary)] font-semibold'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="activeRolePill"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                      className="absolute inset-0 rounded-[6px] bg-[var(--bg-surface)] border border-[var(--border-strong)] shadow-sm -z-10"
                    />
                  )}
                  {role.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Panel Content (Cross-fade 200ms) */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentRole.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="p-6 sm:p-8 lg:p-10">
              <CornerCrosshairs />
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                
                {/* Left: 4 Cols Capabilities */}
                <div className="lg:col-span-4 space-y-6">
                  <div>
                    <span className="eyebrow block mb-2">{currentRole.label} View</span>
                    <h3 className="font-heading font-bold text-xl sm:text-2xl text-[var(--text-primary)]">
                      {currentRole.title}
                    </h3>
                  </div>

                  <ul className="space-y-4">
                    {currentRole.bullets.map((bullet, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-[4px] bg-[var(--bg-subtle)] border border-[var(--border-strong)] flex items-center justify-center shrink-0 mt-0.5 text-[var(--accent-primary)]">
                          <Check size={12} strokeWidth={2.5} />
                        </div>
                        <span className="text-sm text-[var(--text-secondary)] leading-relaxed">
                          {bullet}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Right: 8 Cols Clean Static Outline Schematic */}
                <div className="lg:col-span-8">
                  <div className="rounded-[6px] border border-[var(--border-strong)] bg-[var(--bg-canvas)] p-4 sm:p-5 font-mono text-xs">
                    {/* Mock Header */}
                    <div className="pb-3 mb-4 border-b border-[var(--border-grid)] flex items-center justify-between micro text-[var(--text-muted)]">
                      <span className="font-semibold text-[var(--text-primary)]">
                        {currentRole.schematic.header}
                      </span>
                      <span className="text-[10px] tracking-widest px-2 py-0.5 rounded border border-[var(--border-grid)] bg-[var(--bg-subtle)]">
                        WIREFRAME
                      </span>
                    </div>

                    {/* Schematic Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
                      {/* Left Box */}
                      <div className="sm:col-span-6 p-4 rounded-[4px] border border-[var(--border-grid)] bg-[var(--bg-surface)] flex flex-col justify-between min-h-[160px]">
                        <div className="text-[11px] font-bold text-[var(--accent-primary)] uppercase tracking-wider mb-2">
                          {currentRole.schematic.left.title}
                        </div>
                        <div className="space-y-2 micro text-[var(--text-secondary)]">
                          {currentRole.schematic.left.content.map((c, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-[var(--border-strong)]" />
                              <span>{c}</span>
                            </div>
                          ))}
                        </div>
                        <div className="pt-3 mt-3 border-t border-dashed border-[var(--border-grid)] text-[10px] text-[var(--text-muted)]">
                          GEO-SYNCHRONIZED
                        </div>
                      </div>

                      {/* Right 2 Boxes Stacked */}
                      <div className="sm:col-span-6 flex flex-col gap-3">
                        <div className="p-3.5 rounded-[4px] border border-[var(--border-grid)] bg-[var(--bg-surface)] flex flex-col justify-between">
                          <div className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-wider mb-1">
                            {currentRole.schematic.rightTop.title}
                          </div>
                          <div className="space-y-1 micro text-[var(--text-secondary)]">
                            {currentRole.schematic.rightTop.content.map((c, i) => (
                              <div key={i}>{c}</div>
                            ))}
                          </div>
                        </div>

                        <div className="p-3.5 rounded-[4px] border border-[var(--border-grid)] bg-[var(--bg-surface)] flex flex-col justify-between">
                          <div className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-wider mb-1">
                            {currentRole.schematic.rightBottom.title}
                          </div>
                          <div className="space-y-1 micro text-[var(--text-secondary)]">
                            {currentRole.schematic.rightBottom.content.map((c, i) => (
                              <div key={i}>{c}</div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
