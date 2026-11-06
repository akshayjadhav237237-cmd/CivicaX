import { Shield, Github, ArrowUp, Heart } from 'lucide-react';

export function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const footerLinks = [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Live Telemetry', href: '#live-status' },
    { label: 'Tech Stack', href: '#under-the-hood' },
  ];

  return (
    <footer className="relative bg-white/60 dark:bg-slate-950/80 backdrop-blur-2xl border-t border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 py-12 px-4 sm:px-6 lg:px-8 mt-auto z-20">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        
        {/* Brand & Short Line */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Shield size={16} className="text-white" />
            </div>
            <span className="text-xl font-bold font-heading text-slate-900 dark:text-white">
              Civica<span className="text-teal-500">X</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm">
            Hyperlocal disaster intelligence, satellite hydrology, and civic operations command center.
          </p>
        </div>

        {/* Navigation Links */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm font-medium">
          {footerLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-teal-400 transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Attribution & Back to top */}
        <div className="flex items-center gap-4">
          <div className="text-xs font-mono font-medium text-slate-600 dark:text-slate-300 text-center md:text-right">
            Built for <span className="text-teal-600 dark:text-teal-400 font-bold">Smart India Hackathon 2026</span>
          </div>

          <button
            type="button"
            onClick={scrollToTop}
            aria-label="Scroll back to top"
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 transition-colors shrink-0 border border-slate-200 dark:border-slate-700"
          >
            <ArrowUp size={16} />
          </button>
        </div>

      </div>
    </footer>
  );
}
