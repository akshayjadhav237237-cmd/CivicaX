import { useReducedMotion } from 'framer-motion';

/**
 * Ambient background mesh with soft teal, deep blue, and amber accents.
 * Layered beneath the page with full responsiveness and reduced-motion handling.
 */
export function LandingBackground() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none"
    >
      {/* Base Canvas Layer */}
      <div className="absolute inset-0 bg-[var(--bg-base)] transition-colors duration-500" />

      {/* Ambient Gradient Mesh Spheres */}
      <div
        className={`absolute -top-40 -left-32 w-[620px] h-[620px] rounded-full blur-[120px] opacity-40 dark:opacity-25 transition-transform duration-1000 ${
          shouldReduceMotion ? '' : 'animate-pulse'
        }`}
        style={{
          background: 'radial-gradient(circle, rgba(20,184,166,0.45) 0%, rgba(14,165,233,0.2) 60%, transparent 80%)',
          animationDuration: '9s',
        }}
      />

      <div
        className={`absolute top-[25%] -right-40 w-[680px] h-[680px] rounded-full blur-[140px] opacity-35 dark:opacity-20 transition-transform duration-1000 ${
          shouldReduceMotion ? '' : 'animate-pulse'
        }`}
        style={{
          background: 'radial-gradient(circle, rgba(37,99,235,0.45) 0%, rgba(99,102,241,0.25) 50%, transparent 80%)',
          animationDuration: '12s',
        }}
      />

      <div
        className={`absolute top-[65%] left-[10%] w-[540px] h-[540px] rounded-full blur-[130px] opacity-25 dark:opacity-15 transition-transform duration-1000 ${
          shouldReduceMotion ? '' : 'animate-pulse'
        }`}
        style={{
          background: 'radial-gradient(circle, rgba(245,158,11,0.3) 0%, rgba(217,119,6,0.15) 50%, transparent 80%)',
          animationDuration: '14s',
        }}
      />

      {/* Subtle Dot Matrix Overlay for depth */}
      <div
        className="absolute inset-0 opacity-[0.035] dark:opacity-[0.05]"
        style={{
          backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          color: 'var(--text-primary)',
        }}
      />
    </div>
  );
}
