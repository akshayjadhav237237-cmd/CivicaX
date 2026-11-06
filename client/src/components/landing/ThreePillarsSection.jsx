import { AlertTriangle, HardHat, ShieldAlert, Building2 } from 'lucide-react';

export function ThreePillarsSection() {
  const pillars = [
    {
      title: 'Emergency Responder',
      desc: 'Satellite-driven flood alerts, micro-zone hazard overlays, and live tactical unit dispatch.',
      icon: AlertTriangle,
    },
    {
      title: 'Civic Manager',
      desc: 'Infrastructure issue reporting directly to municipal departments with real-time status tracking.',
      icon: HardHat,
    },
    {
      title: 'Safety Watch',
      desc: 'Community threat reporting, verified crowd alerts, and instant GPS distress beacons.',
      icon: ShieldAlert,
    },
  ];

  return (
    <section id="pillars" className="py-20 sm:py-28 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-slate-900 dark:text-white tracking-tight mb-4">
            Unified Public Safety
          </h2>
          <p className="text-base text-slate-600 dark:text-slate-300">
            Dedicated operational views for every phase of disaster preparedness and recovery.
          </p>
        </div>

        {/* Three Equal Plain Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-8">
          {pillars.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.title}
                className="p-7 sm:p-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-5">
                    <Icon size={20} />
                  </div>
                  <h3 className="text-xl font-bold font-heading text-slate-900 dark:text-white mb-2">
                    {p.title}
                  </h3>
                  <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                    {p.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Full-Width Strip: Government Command Center */}
        <div className="w-full p-7 sm:p-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <Building2 size={20} />
            </div>
            <div>
              <h3 className="text-xl font-bold font-heading text-slate-900 dark:text-white">
                Government Command Center
              </h3>
              <p className="text-base text-slate-600 dark:text-slate-300 mt-1">
                For District Collectors and Magistrates. Manage relief camp capacities, dam safety metrics, and inter-agency resource deployment.
              </p>
            </div>
          </div>

          <div className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
            District Administration Mode
          </div>
        </div>

      </div>
    </section>
  );
}
