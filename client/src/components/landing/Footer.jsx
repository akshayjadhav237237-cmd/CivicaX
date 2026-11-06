import { Shield } from 'lucide-react';

export function Footer() {
  const links = [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Command Center', href: '#pillars' },
  ];

  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-10 px-4 sm:px-6 lg:px-8 text-slate-600 dark:text-slate-400">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-sm">
        
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center text-white font-bold">
            <Shield size={14} />
          </div>
          <span className="font-bold text-slate-900 dark:text-white font-heading text-base">
            Civica<span className="text-blue-600 dark:text-blue-400">X</span>
          </span>
        </div>

        {/* Links */}
        <div className="flex items-center gap-6">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Built for Smart India Hackathon 2026 */}
        <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
          Built for <span className="font-bold text-slate-700 dark:text-slate-200">Smart India Hackathon 2026</span>
        </div>

      </div>
    </footer>
  );
}
