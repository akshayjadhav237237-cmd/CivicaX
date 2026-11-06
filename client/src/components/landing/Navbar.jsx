import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, Menu, X } from 'lucide-react';
import { useThemeStore } from '../../stores/themeStore';
import { Button } from './ui/Button';

export function Navbar({ isApiOk = true }) {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useThemeStore();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const links = [
    { label: 'Live Monitor', href: '#live-monitor' },
    { label: 'Pipeline', href: '#pipeline' },
    { label: 'Telemetry', href: '#telemetry' },
    { label: 'Roles', href: '#roles' },
  ];

  const handleLinkClick = (e, href) => {
    e.preventDefault();
    setDrawerOpen(false);
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-[64px] backdrop-blur-[12px] bg-[var(--bg-surface)]/85 border-b border-[var(--border-grid)] transition-colors duration-150">
      <div className="landing-container h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        
        {/* Left: CIVICAX mark + LIVE pill */}
        <div className="flex items-center gap-3 sm:gap-4">
          <a
            href="#"
            className="flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] rounded-[4px]"
          >
            <span className="font-heading font-bold text-lg sm:text-xl tracking-tight text-[var(--text-primary)]">
              CIVICA<span className="text-[var(--accent-primary)]">X</span>
            </span>
          </a>

          {/* Status Pill */}
          <div className="h-[22px] px-2 rounded-full border border-[var(--border-strong)] bg-[var(--bg-subtle)] inline-flex items-center gap-1.5 font-mono text-[11px] text-[var(--text-secondary)] select-none">
            <span
              className={`w-2 h-2 rounded-full ${
                isApiOk ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}
            />
            <span className="hidden sm:inline font-semibold">LIVE: SATELLITE PIPELINE</span>
            <span className="sm:hidden font-semibold">LIVE</span>
          </div>
        </div>

        {/* Center: Desktop Anchor Links */}
        <nav aria-label="Landing Navigation" className="hidden md:flex items-center gap-6 lg:gap-8">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={(e) => handleLinkClick(e, link.href)}
              className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors focus:outline-none focus-visible:underline"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right: Theme Toggle + Login + Get Started */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="w-[36px] h-[36px] rounded-[6px] border border-[var(--border-grid)] bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
          >
            {isDark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
          </button>

          <Button
            variant="ghost"
            onClick={() => navigate('/login')}
            className="hidden sm:inline-flex h-[36px] px-3.5 text-xs"
          >
            Login
          </Button>

          <Button
            variant="primary"
            onClick={() => navigate('/register')}
            className="h-[36px] px-4 text-xs sm:text-sm"
          >
            Get Started
          </Button>

          {/* Mobile Menu Trigger */}
          <button
            type="button"
            onClick={() => setDrawerOpen(!drawerOpen)}
            aria-label={drawerOpen ? 'Close navigation drawer' : 'Open navigation drawer'}
            className="md:hidden w-[36px] h-[36px] rounded-[6px] border border-[var(--border-grid)] bg-[var(--bg-subtle)] text-[var(--text-primary)] flex items-center justify-center"
          >
            {drawerOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

      </div>

      {/* Mobile Slide-down Drawer */}
      {drawerOpen && (
        <div className="md:hidden border-b border-[var(--border-grid)] bg-[var(--bg-surface)] px-4 py-4 flex flex-col gap-3 shadow-lg">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={(e) => handleLinkClick(e, link.href)}
              className="py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              {link.label}
            </a>
          ))}
          <div className="pt-2 border-t border-[var(--border-grid)] flex gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setDrawerOpen(false);
                navigate('/login');
              }}
              className="w-full text-xs"
            >
              Login
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
