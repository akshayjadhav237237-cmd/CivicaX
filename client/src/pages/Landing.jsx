import { lazy, Suspense, useEffect } from 'react';
import { motion } from 'framer-motion';
import '../components/landing/landing.css';
import { Navbar } from '../components/landing/Navbar';
import { HeroSection } from '../components/landing/HeroSection';
import { Skeleton } from '../components/landing/ui/Skeleton';
import { useLivePrediction } from '../components/landing/useLivePrediction';
import { useThemeStore } from '../stores/themeStore';

// Lazy load below-the-fold sections
const PipelineSection = lazy(() =>
  import('../components/landing/PipelineSection').then((m) => ({ default: m.PipelineSection }))
);
const TelemetryWorkbenchSection = lazy(() =>
  import('../components/landing/TelemetryWorkbenchSection').then((m) => ({
    default: m.TelemetryWorkbenchSection,
  }))
);
const RolesSection = lazy(() =>
  import('../components/landing/RolesSection').then((m) => ({ default: m.RolesSection }))
);
const FinalCTASection = lazy(() =>
  import('../components/landing/FinalCTASection').then((m) => ({ default: m.FinalCTASection }))
);
const Footer = lazy(() =>
  import('../components/landing/Footer').then((m) => ({ default: m.Footer }))
);

/**
 * Section Reveal Animation
 * opacity 0→1, translateY 16→0, 450ms cubic-bezier(0.16,1,0.3,1), whileInView once amount .2
 * Respects prefers-reduced-motion
 */
function SectionReveal({ children, delay = 0 }) {
  const shouldReduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={
        shouldReduceMotion
          ? { duration: 0 }
          : {
              duration: 0.45,
              delay,
              ease: [0.16, 1, 0.3, 1],
            }
      }
    >
      {children}
    </motion.div>
  );
}

function SectionSkeleton() {
  return (
    <div className="landing-section">
      <div className="landing-container px-4 sm:px-6 lg:px-8 py-12">
        <Skeleton height="340px" className="w-full" />
      </div>
    </div>
  );
}

export function Landing() {
  const prediction = useLivePrediction();

  // Support theme query parameter for automated QA & responsive verification (?theme=dark / ?theme=light)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('theme') === 'dark') {
      useThemeStore.getState().setDark(true);
    } else if (params.get('theme') === 'light') {
      useThemeStore.getState().setDark(false);
    }
  }, []);

  // Smooth scroll for anchor links
  useEffect(() => {
    const handleAnchorClick = (e) => {
      const anchor = e.target.closest('a[href^="#"]');
      if (!anchor) return;
      const targetId = anchor.getAttribute('href');
      if (targetId && targetId !== '#') {
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          e.preventDefault();
          targetElement.scrollIntoView({ behavior: 'smooth' });
        }
      }
    };

    document.addEventListener('click', handleAnchorClick);
    return () => document.removeEventListener('click', handleAnchorClick);
  }, []);

  return (
    <div className="landing-root selection:bg-[var(--accent-primary)] selection:text-white">
      {/* 1. Navbar */}
      <Navbar isApiOk={!prediction.error} />

      {/* Main Content Sections */}
      <main>
        {/* 2. Hero Section (Eager) */}
        <HeroSection prediction={prediction} />

        {/* 3. Pipeline Section (Lazy) */}
        <Suspense fallback={<SectionSkeleton />}>
          <SectionReveal delay={0.08}>
            <PipelineSection />
          </SectionReveal>
        </Suspense>

        {/* 4. Telemetry Workbench (Lazy) */}
        <Suspense fallback={<SectionSkeleton />}>
          <SectionReveal delay={0.08}>
            <TelemetryWorkbenchSection prediction={prediction} />
          </SectionReveal>
        </Suspense>

        {/* 5. Role-Specific Interfaces (Lazy) */}
        <Suspense fallback={<SectionSkeleton />}>
          <SectionReveal delay={0.08}>
            <RolesSection />
          </SectionReveal>
        </Suspense>

        {/* 6. Final CTA (Lazy) */}
        <Suspense fallback={<SectionSkeleton />}>
          <SectionReveal delay={0.08}>
            <FinalCTASection />
          </SectionReveal>
        </Suspense>
      </main>

      {/* 7. Footer (Lazy) */}
      <Suspense fallback={<div className="h-32 bg-[var(--bg-canvas)]" />}>
        <Footer />
      </Suspense>
    </div>
  );
}

export default Landing;
