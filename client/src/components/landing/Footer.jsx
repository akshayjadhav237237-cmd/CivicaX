export function Footer() {
  const platformLinks = [
    { label: 'Live Monitor', href: '#live-monitor' },
    { label: 'Hydrology Pipeline', href: '#pipeline' },
    { label: 'Telemetry Workbench', href: '#telemetry' },
    { label: 'Stakeholder Roles', href: '#roles' },
  ];

  const noticeBlock = (
    <div className="p-4 rounded-[6px] border border-[var(--border-strong)] bg-[var(--bg-subtle)]">
      <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--accent-primary)] mb-1">
        Operational Notice
      </div>
      <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-normal">
        CivicaX supports, not replaces, official civil defense and meteorological authorities. Always follow local evacuation orders.
      </p>
    </div>
  );

  return (
    <footer className="border-t border-[var(--border-grid)] bg-[var(--bg-surface)] py-12 sm:py-16 text-[var(--text-secondary)]">
      <div className="landing-container px-4 sm:px-6 lg:px-8">
        
        {/* On Mobile: Notice First */}
        <div className="block lg:hidden mb-10">
          {noticeBlock}
        </div>

        {/* 4 Columns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 pb-12 border-b border-[var(--border-grid)]">
          
          {/* Col 1: Brand & Attribution */}
          <div className="flex flex-col items-start">
            <span className="font-heading font-bold text-lg text-[var(--text-primary)] mb-2 tracking-tight">
              CIVICA<span className="text-[var(--accent-primary)]">X</span>
            </span>
            <p className="body-base text-xs sm:text-sm text-[var(--text-secondary)] mb-4 leading-relaxed">
              Autonomous satellite hydrology and real-time flood intelligence for Himalayan river basins.
            </p>
            <div className="micro text-[var(--text-muted)] leading-relaxed">
              Attribution: NASA GPM IMERG, NASA SMAP, SRTM, OpenStreetMap, OSRM, Open-Meteo, NASA EONET, NASA FIRMS.
            </div>
          </div>

          {/* Col 2: Platform Navigation */}
          <div className="flex flex-col items-start">
            <span className="eyebrow mb-3 text-[var(--text-primary)]">
              Platform Modules
            </span>
            <ul className="space-y-2 text-sm">
              {platformLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="hover:text-[var(--text-primary)] transition-colors focus:outline-none focus-visible:underline"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Methodology Note */}
          <div className="flex flex-col items-start">
            <span className="eyebrow mb-3 text-[var(--text-primary)]">
              Methodology
            </span>
            <p className="body-base text-xs sm:text-sm leading-relaxed">
              Combines empirical SCS curve runoff with Manning&apos;s open-channel hydraulic equations and SRTM 30m digital slope models. Physics computes thresholds; GPT-4o synthesizes text briefings.
            </p>
          </div>

          {/* Col 4: Notice Block (Desktop) */}
          <div className="hidden lg:flex flex-col justify-start">
            {noticeBlock}
          </div>

        </div>

        {/* Bottom Line */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-[var(--text-muted)]">
          <div>
            Built for <span className="text-[var(--text-primary)] font-semibold">Smart India Hackathon 2026</span>
          </div>
          <div>
            Open Hydrological Architecture • Mandakini River Pilot
          </div>
        </div>

      </div>
    </footer>
  );
}
