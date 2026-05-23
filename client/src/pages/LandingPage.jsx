import { useNavigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ShieldAlert, HardHat, AlertTriangle, ArrowRight, Github, ExternalLink, Sun, Moon } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassButton } from '../components/ui/GlassButton';
import { useThemeStore } from '../stores/themeStore';

/* ── Reusable scroll-reveal wrapper ────────────────────────────── */
function Reveal({ children, delay = 0, className = '' }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '0px 0px -80px 0px' });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: 'easeOut', delay }}
    >
      {children}
    </motion.div>
  );
}

/* ── Animated stat counter ──────────────────────────────────────── */
function CountUp({ target, suffix = '' }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView || !ref.current) return;
    const el = ref.current;
    const duration = 1500;
    const step = target / (duration / 16);
    let current = 0;
    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        el.textContent = target + suffix;
        clearInterval(timer);
      } else {
        el.textContent = Math.floor(current) + suffix;
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, target, suffix]);

  return <span ref={ref}>0{suffix}</span>;
}

export function LandingPage() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useThemeStore();

  /* ── Refs ────────────────────────────────────────────────────── */
  const navRef = useRef(null);
  const heroBgRef = useRef(null);

  /* ── Navbar glass intensifies on scroll ─────────────────────── */
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const onScroll = () => {
      if (window.scrollY > 50) {
        nav.style.backdropFilter = 'blur(24px)';
        nav.style.background = isDark ? 'rgba(11,15,26,0.85)' : 'rgba(255,255,255,0.75)';
        nav.style.boxShadow = 'var(--shadow)';
        nav.style.borderBottomColor = 'var(--bg-card-border)';
      } else {
        nav.style.backdropFilter = 'blur(8px)';
        nav.style.background = isDark ? 'rgba(11,15,26,0.4)' : 'rgba(255,255,255,0.3)';
        nav.style.boxShadow = 'none';
        nav.style.borderBottomColor = 'var(--bg-card-border)';
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isDark]);

  /* ── Hero parallax ───────────────────────────────────────────── */
  useEffect(() => {
    const bg = heroBgRef.current;
    if (!bg) return;
    const onScroll = () => {
      bg.style.transform = `translateY(${window.scrollY * 0.4}px)`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ── Smooth anchor scrolling ─────────────────────────────────── */
  useEffect(() => {
    const handler = (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const target = document.querySelector(a.getAttribute('href'));
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden" style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>

      {/* Navbar */}
      <nav
        ref={navRef}
        style={{ transition: 'background 0.3s ease, backdrop-filter 0.3s ease, box-shadow 0.3s ease' }}
        className="fixed top-0 w-full z-50 border-b px-6 py-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/30">
            C
          </div>
          <span className="text-xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
            Civica<span className="text-blue-500">X</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Dark mode toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full transition-all duration-300 hover:scale-110"
            style={{
              background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
              border: isDark ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(0,0,0,0.08)',
            }}
            aria-label="Toggle dark mode"
          >
            {isDark ? <Sun size={18} color="#FCD34D" /> : <Moon size={18} color="#6366F1" />}
          </button>
          <button onClick={() => navigate('/login')} className="text-sm font-semibold transition-colors" style={{ color: 'var(--text-secondary)' }}>
            Log In
          </button>
          <GlassButton size="sm" onClick={() => navigate('/register')}>Get Started</GlassButton>
        </div>
      </nav>

      <main className="flex-1 pt-24 pb-16 px-6 sm:px-12 max-w-7xl mx-auto w-full flex flex-col gap-12 sm:gap-20">

        {/* 1. Hero Section */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full rounded-[2rem] overflow-hidden relative shadow-[0_24px_64px_rgba(31,38,135,0.12)] border border-white/80"
          >
            {/* Parallax background layer */}
            <div ref={heroBgRef} className="absolute inset-0 will-change-transform">
              <div className="absolute inset-0 animated-gradient-bg opacity-90" />
            </div>
            <div className="absolute inset-0 bg-white/30 backdrop-blur-3xl" />

            <div className="relative z-10 p-10 sm:p-20 flex flex-col items-center text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-semibold mb-6"
                style={{ background: 'rgba(59,130,246,0.12)', borderColor: 'rgba(59,130,246,0.3)', color: 'var(--color-primary)' }}
              >
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /> Live Early Warning System
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.2 }}
                className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-6"
                style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}
              >
                When Seconds Matter,<br/><span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-400">CivicaX Acts.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.35 }}
                className="text-xl max-w-2xl mb-10 font-medium leading-relaxed"
                style={{ color: 'var(--text-secondary)' }}
              >
                AI-powered early warning, civic reporting, and public safety — unified for your community in one intelligent operating system.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
              >
                <GlassButton size="lg" onClick={() => navigate('/register')} className="w-full sm:w-auto whitespace-nowrap">
                  Get Alerts for My Area <ArrowRight size={18} />
                </GlassButton>
                <GlassButton variant="ghost" size="lg" onClick={() => navigate('/dashboard')} className="w-full sm:w-auto bg-white/70">
                  View Live Dashboard
                </GlassButton>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* Quick Stats */}
        <Reveal>
          <div className="grid grid-cols-3 gap-6 text-center">
            {[
              { value: 98,  suffix: '%', label: 'Alert Accuracy' },
              { value: 240, suffix: 's', label: 'Avg Response Time' },
              { value: 12,  suffix: 'k+', label: 'Citizens Protected' },
            ].map(({ value, suffix, label }) => (
              <div key={label} className="glass-card p-6">
                <p className="text-3xl font-extrabold text-blue-500" style={{ fontFamily: 'var(--font-heading)' }}>
                  <CountUp target={value} suffix={suffix} />
                </p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
              </div>
            ))}
          </div>
        </Reveal>

        {/* 2. Three Pillar Cards */}
        <section>
          <Reveal className="text-center mb-10">
            <h2 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>Three Pillars of Resilience</h2>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: <AlertTriangle size={28} className="text-blue-600" />, bg: 'bg-blue-100', title: 'Emergency Responder', desc: 'Satellite-driven early warning for floods and landslides with precision evacuation routing.', delay: 0 },
              { icon: <HardHat size={28} className="text-orange-600" />,    bg: 'bg-orange-100', title: 'Civic Manager',       desc: 'Report infrastructure issues directly to city departments and track resolution in real-time.', delay: 0.15 },
              { icon: <ShieldAlert size={28} className="text-red-600" />,   bg: 'bg-red-100',    title: 'Safety Watch',        desc: 'Community-driven threat reporting to alert law enforcement of immediate public safety concerns.', delay: 0.3 },
            ].map(({ icon, bg, title, desc, delay }) => (
              <Reveal key={title} delay={delay}>
                <GlassCard padding="p-8" className="hover:-translate-y-2 transition-transform duration-300 h-full">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6" style={{ background: 'var(--hover-bg)' }}>
                    {icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>{title}</h3>
                  <p style={{ color: 'var(--text-secondary)' }}>{desc}</p>
                </GlassCard>
              </Reveal>
            ))}
          </div>
        </section>

        {/* 3. How It Works */}
        <section className="relative">
          <Reveal className="text-center mb-12">
            <h2 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>Intelligence in Action</h2>
          </Reveal>
          <div className="hidden md:block absolute top-[60%] left-0 w-full h-1 bg-gradient-to-r from-blue-200 via-blue-400 to-blue-200 -z-10 rounded-full" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {['Detect & Report', 'AI Triage', 'Smart Route', 'Quick Respond'].map((step, idx) => (
              <Reveal key={idx} delay={idx * 0.12}>
                <div className="relative group">
                  <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold text-xl flex items-center justify-center absolute -top-6 left-1/2 -translate-x-1/2 z-10 border-4 border-[var(--bg-base)] shadow-lg group-hover:scale-110 transition-transform">
                    {idx + 1}
                  </div>
                  <GlassCard className="pt-10 text-center">
                    <h4 className="font-bold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>{step}</h4>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {idx === 0 && 'Citizens or Satellites detect anomalies'}
                      {idx === 1 && 'System evaluates severity and credibility'}
                      {idx === 2 && 'Routed to exact department or responders'}
                      {idx === 3 && 'Real-time updates to community'}
                    </p>
                  </GlassCard>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* 4. Satellite Data Section */}
        <Reveal>
          <section>
            <GlassCard padding="p-0 border-0" className="overflow-hidden bg-slate-900 text-white shadow-2xl relative">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-luminosity" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 max-h-full" />

              <div className="relative z-10 p-10 sm:p-16">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-bold text-slate-300 mb-6 uppercase tracking-wider backdrop-blur-md">
                  Data Infrastructure
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold mb-6" style={{ fontFamily: 'var(--font-heading)' }}>Powered by Global Open Data</h2>
                <p className="text-slate-300 max-w-2xl mb-10 text-lg">
                  CivicaX integrates real-time telemetry from sovereign open-data providers to run predictive flood and landslide models without commercial lock-in.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {[
                    { name: 'NASA LANCE', desc: 'Near real-time precision satellite precipitation and weather telemetry feeds.' },
                    { name: 'NASA SMAP',  desc: 'Soil Moisture Active Passive radar data for accurate ground saturation tracking.' },
                    { name: 'USGS SRTM', desc: 'Shuttle Radar Topography Mission digital elevation models for flood plain rendering.' },
                  ].map(({ name, desc }, idx) => (
                    <motion.div
                      key={name}
                      initial={{ opacity: 0, y: 24 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '0px 0px -60px 0px' }}
                      transition={{ duration: 0.5, delay: idx * 0.12 }}
                      className="bg-slate-800/50 backdrop-blur-md rounded-2xl p-6 border border-slate-700 hover:bg-slate-800/80 transition-colors"
                    >
                      <h4 className="font-bold text-blue-400 mb-2 flex items-center gap-2">{name} <ExternalLink size={14} /></h4>
                      <p className="text-sm text-slate-400">{desc}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </GlassCard>
          </section>
        </Reveal>

        {/* 5. Gov Dashboard Teaser */}
        <Reveal className="mb-10">
          <section>
            <GlassCard className="relative overflow-hidden group">
              <div className="absolute inset-0 bg-blue-600 mix-blend-overlay opacity-10 group-hover:opacity-20 transition-opacity" />
              <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-white/90 to-transparent z-10 hidden sm:block pointer-events-none" />

              <div className="flex flex-col sm:flex-row items-center gap-10 p-8 sm:p-12">
                <div className="w-full sm:w-1/2 relative z-20">
                  <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>Unified Command</h2>
                  <p className="mb-8 text-lg" style={{ color: 'var(--text-secondary)' }}>
                    For government authorities. Manage relief camps, auto-calculate NDMA resource requirements, and dispatch responders from a single pane of glass.
                  </p>
                  <GlassButton variant="primary" onClick={() => navigate('/login')} className="bg-slate-900 text-white w-full sm:w-auto hover:bg-slate-800">
                    Authority Login
                  </GlassButton>
                </div>

                <div className="w-full sm:w-1/2 relative">
                  <div
                    className="backdrop-blur-md rounded-xl shadow-2xl p-4 rotate-3 group-hover:rotate-1 transition-transform duration-500"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)' }}
                  >
                    <div className="flex gap-2 mb-4">
                      <div className="w-3 h-3 rounded-full bg-red-400" /><div className="w-3 h-3 rounded-full bg-yellow-400" /><div className="w-3 h-3 rounded-full bg-green-400" />
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="h-16 rounded-lg" style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)' }} />
                      <div className="h-16 rounded-lg" style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)' }} />
                    </div>
                    <div className="h-32 rounded-lg" style={{ background: 'var(--hover-bg)', border: '1px solid var(--divider)' }} />
                  </div>
                </div>
              </div>
            </GlassCard>
          </section>
        </Reveal>

      </main>

      {/* Footer */}
      <footer className="bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 text-slate-400 py-10 px-6 mt-auto relative z-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center text-white font-bold text-xs">C</div>
            <span className="font-bold text-white tracking-widest uppercase text-sm" style={{ fontFamily: 'var(--font-heading)' }}>CivicaX</span>
          </div>
          <div className="text-sm text-center md:text-left">
            Built with open-source data. Zero-budget civic technology platform.
          </div>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-white transition-colors" title="View Source"><Github size={20} /></a>
          </div>
        </div>
      </footer>
    </div>
  );
}
