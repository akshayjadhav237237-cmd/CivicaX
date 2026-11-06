import { lazy, Suspense, useEffect } from 'react';
import { LandingBackground } from '../components/landing/LandingBackground';
import { Navbar } from '../components/landing/Navbar';
import { HeroSection } from '../components/landing/HeroSection';
import { LiveStatusStrip } from '../components/landing/LiveStatusStrip';

// Lazy load below-the-fold sections for optimized performance & fast LCP
const ProblemSection = lazy(() =>
  import('../components/landing/ProblemSection').then((m) => ({ default: m.ProblemSection }))
);
const HowItWorksSection = lazy(() =>
  import('../components/landing/HowItWorksSection').then((m) => ({ default: m.HowItWorksSection }))
);
const BentoPillarsSection = lazy(() =>
  import('../components/landing/BentoPillarsSection').then((m) => ({ default: m.BentoPillarsSection }))
);
const UnderTheHoodSection = lazy(() =>
  import('../components/landing/UnderTheHoodSection').then((m) => ({ default: m.UnderTheHoodSection }))
);
const WhoItServesSection = lazy(() =>
  import('../components/landing/WhoItServesSection').then((m) => ({ default: m.WhoItServesSection }))
);
const FinalCTASection = lazy(() =>
  import('../components/landing/FinalCTASection').then((m) => ({ default: m.FinalCTASection }))
);
const Footer = lazy(() =>
  import('../components/landing/Footer').then((m) => ({ default: m.Footer }))
);

function SectionFallback() {
  return (
    <div
      aria-hidden="true"
      className="w-full max-w-7xl mx-auto px-4 py-16 flex justify-center items-center"
    >
      <div className="w-full h-44 rounded-3xl bg-slate-200/40 dark:bg-slate-800/40 animate-pulse" />
    </div>
  );
}

export function LandingPage() {
  // Smooth anchor scrolling handler for #ids
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
    <div className="min-h-screen flex flex-col relative overflow-x-hidden text-[var(--text-primary)] selection:bg-teal-500 selection:text-white">
      {/* Soft Ambient Mesh Background */}
      <LandingBackground />

      {/* 1. Floating Glass Navbar */}
      <Navbar />

      <main className="flex-1">
        {/* 2. Hero Section */}
        <HeroSection />

        {/* 3. Live Status Strip (Real Data) */}
        <LiveStatusStrip />

        {/* 4. The Problem */}
        <Suspense fallback={<SectionFallback />}>
          <ProblemSection />
        </Suspense>

        {/* 5. How It Works (Sticky Scroll) */}
        <Suspense fallback={<SectionFallback />}>
          <HowItWorksSection />
        </Suspense>

        {/* 6. Three Pillars + Command Center (Bento Grid) */}
        <Suspense fallback={<SectionFallback />}>
          <BentoPillarsSection />
        </Suspense>

        {/* 7. Under the Hood (Marquee) */}
        <Suspense fallback={<SectionFallback />}>
          <UnderTheHoodSection />
        </Suspense>

        {/* 8. Who It Serves */}
        <Suspense fallback={<SectionFallback />}>
          <WhoItServesSection />
        </Suspense>

        {/* 9. Final CTA */}
        <Suspense fallback={<SectionFallback />}>
          <FinalCTASection />
        </Suspense>
      </main>

      {/* 10. Footer */}
      <Suspense fallback={<div className="h-20 w-full" />}>
        <Footer />
      </Suspense>
    </div>
  );
}

export default LandingPage;
