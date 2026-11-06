import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, Menu, X, ArrowRight, Shield } from 'lucide-react';
import { useThemeStore } from '../../stores/themeStore';

export function Navbar() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useThemeStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Command Center', href: '#pillars' },
  ];

  const handleNavClick = (e, href) => {
    e.preventDefault();
    setMobileOpen(false);
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
        
        {/* Brand Logo */}
        <a
          href="#"
          className="flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-lg"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm">
            <Shield size={18} />
          </div>
          <span className="text-xl font-bold tracking-tight font-heading text-slate-900 dark:text-white">
            Civica<span className="text-blue-600 dark:text-blue-400">X</span>
          </span>
        </a>

        {/* Desktop Links */}
        <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="w-9 h-9 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            {isDark ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} />}
          </button>

          <button
            type="button"
            onClick={() => navigate('/login')}
            className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            Log In
          </button>

          <button
            type="button"
            onClick={() => navigate('/register')}
            className="px-4.5 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 transition-colors flex items-center gap-1.5 shadow-sm active:scale-[0.99]"
          >
            <span>Get Started</span>
            <ArrowRight size={15} />
          </button>
        </div>

        {/* Mobile Hamburger & Theme Button */}
        <div className="flex md:hidden items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="w-9 h-9 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
          >
            {isDark ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} />}
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            className="w-9 h-9 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

      </div>

      {/* Mobile Menu Dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-6 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="py-2 text-base font-medium text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400"
              >
                {link.label}
              </a>
            ))}
          </div>
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                navigate('/login');
              }}
              className="w-full py-2.5 rounded-lg text-sm font-semibold border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200"
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                navigate('/register');
              }}
              className="w-full py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-1.5"
            >
              <span>Get Started</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
