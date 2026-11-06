import { motion } from 'framer-motion';
import { User, HardHat, Landmark, Settings2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function WhoItServesSection() {
  const navigate = useNavigate();

  const roles = [
    {
      id: 'citizen',
      role: 'Citizen',
      tag: 'Public Access',
      line: 'Real-time personal flood radar, hyperlocal safe evacuation routes, and community safety reporting.',
      icon: User,
      color: 'from-blue-600 to-cyan-500',
      badgeBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    },
    {
      id: 'operator',
      role: 'Department Operator',
      tag: 'Field & Municipal Ops',
      line: 'Triage and dispatch urban infrastructure repairs for PWD, sanitation, water, and electrical boards.',
      icon: HardHat,
      color: 'from-orange-500 to-amber-500',
      badgeBg: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
    },
    {
      id: 'official',
      role: 'Government Official',
      tag: 'District Command',
      line: 'Command-level situational awareness, AI emergency briefings, relief camp logistics, and dam safety.',
      icon: Landmark,
      color: 'from-teal-500 to-emerald-600',
      badgeBg: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
    },
    {
      id: 'admin',
      role: 'Admin',
      tag: 'System Orchestration',
      line: 'System-wide telemetry health monitoring, official ID whitelist authentication, and pipeline audit logs.',
      icon: Settings2,
      color: 'from-purple-600 to-indigo-600',
      badgeBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    },
  ];

  return (
    <section className="py-20 sm:py-32 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-2xl mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200/60 dark:bg-slate-800/60 border border-slate-300/60 dark:border-slate-700/60 text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-4">
            <span>Tailored Workflows</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold font-heading text-slate-900 dark:text-white tracking-tight leading-tight">
            Who CivicaX Serves
          </h2>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-300">
            Purpose-built views for every stakeholder across the disaster lifecycle.
          </p>
        </div>

        {/* 4 Asymmetric Stepped Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {roles.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="rounded-3xl bg-white/75 dark:bg-slate-900/75 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-800 shadow-[0_10px_30px_rgba(0,0,0,0.05)] dark:shadow-[0_12px_32px_rgba(0,0,0,0.3)] p-6 sm:p-7 flex flex-col justify-between hover:-translate-y-1.5 transition-all duration-300 group"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div
                      className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${item.color} flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform`}
                    >
                      <Icon size={22} />
                    </div>
                    <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${item.badgeBg}`}>
                      {item.tag}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold font-heading text-slate-900 dark:text-white mb-2">
                    {item.role}
                  </h3>

                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {item.line}
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-teal-400 transition-colors">
                  <span>Explore Portal</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
