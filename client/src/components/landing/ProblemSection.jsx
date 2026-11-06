import { Clock, BellOff, PhoneCall } from 'lucide-react';

export function ProblemSection() {
  const points = [
    {
      icon: Clock,
      text: 'Satellite imagery takes hours to become usable warning.',
    },
    {
      icon: BellOff,
      text: 'Residents in hill towns get no advance warning.',
    },
    {
      icon: PhoneCall,
      text: 'Officials coordinate rescue over phone calls.',
    },
  ];

  return (
    <section className="py-20 sm:py-24 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        
        {/* Centered Statement */}
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-heading text-slate-900 dark:text-white tracking-tight mb-12 sm:mb-16">
          The data exists.{' '}
          <span className="text-amber-600 dark:text-amber-400">
            It never arrives in time.
          </span>
        </h2>

        {/* Three Short Lines */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 text-left">
          {points.map((pt, idx) => {
            const Icon = pt.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
              >
                <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4">
                  <Icon size={20} />
                </div>
                <p className="text-base text-slate-700 dark:text-slate-200 font-medium leading-relaxed">
                  {pt.text}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
