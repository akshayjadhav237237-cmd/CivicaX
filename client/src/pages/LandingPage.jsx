import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Navbar } from '../components/landing/Navbar';
import { HeroSection } from '../components/landing/HeroSection';
import { ProblemSection } from '../components/landing/ProblemSection';
import { HowItWorksSection } from '../components/landing/HowItWorksSection';
import { ThreePillarsSection } from '../components/landing/ThreePillarsSection';
import { FinalCTASection } from '../components/landing/FinalCTASection';
import { Footer } from '../components/landing/Footer';

function FadeUp({ children, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function LandingPage() {
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
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-blue-600 selection:text-white">
      {/* 1. Navbar */}
      <Navbar />

      <main className="flex-1">
        {/* 2. Hero */}
        <HeroSection />

        {/* 3. Problem */}
        <FadeUp>
          <ProblemSection />
        </FadeUp>

        {/* 4. How It Works */}
        <FadeUp>
          <HowItWorksSection />
        </FadeUp>

        {/* 5. Three Pillars + Government Command Center */}
        <FadeUp>
          <ThreePillarsSection />
        </FadeUp>

        {/* 6. Final CTA */}
        <FadeUp>
          <FinalCTASection />
        </FadeUp>
      </main>

      {/* 7. Footer */}
      <Footer />
    </div>
  );
}

export default LandingPage;
