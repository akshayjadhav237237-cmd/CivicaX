import { Satellite, Calculator, Waves, MapPin, Bot, Send } from 'lucide-react';

export function HowItWorksSection() {
  const steps = [
    {
      num: '01',
      title: 'NASA GPM rainfall + SMAP soil moisture + SRTM terrain',
      desc: 'Raw telemetry ingestion from global space agencies every 10 minutes.',
      icon: Satellite,
    },
    {
      num: '02',
      title: 'SCS Curve Number calculates runoff',
      desc: 'Ground saturation modeling calculates the precise volume of surface water unable to absorb.',
      icon: Calculator,
    },
    {
      num: '03',
      title: "Manning's Equation calculates river velocity and overflow",
      desc: 'Open-channel hydraulic equations determine surge speed, crest time, and riverbank breach points.',
      icon: Waves,
    },
    {
      num: '04',
      title: 'Urban inundation maps flood depth onto real streets',
      desc: 'Elevation profiles intersect OpenStreetMap street vectors to map flood water across alleys.',
      icon: MapPin,
    },
    {
      num: '05',
      title: 'GPT-4o writes the alert and official briefing',
      desc: 'Generative AI translates raw telemetry into clear emergency advisories and executive reports.',
      icon: Bot,
    },
    {
      num: '06',
      title: 'Live map, push alert, government dispatch',
      desc: 'Real-time WebSocket alerts broadcast to citizens and tactical units simultaneously.',
      icon: Send,
    },
  ];

  return (
    <section id="how-it-works" className="py-20 sm:py-28 border-t border-slate-200 dark:border-slate-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-slate-900 dark:text-white tracking-tight mb-4">
            How It Works
          </h2>
          <p className="text-base text-slate-600 dark:text-slate-300">
            A 6-step automated loop turning orbital radar into street-level emergency action.
          </p>
        </div>

        {/* Vertical Timeline */}
        <div className="relative border-l border-slate-200 dark:border-slate-800 ml-4 sm:ml-8 space-y-10 sm:space-y-12">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.num} className="relative pl-8 sm:pl-10 group">
                
                {/* Timeline Dot / Node */}
                <div className="absolute -left-[17px] top-0.5 w-8 h-8 rounded-full bg-white dark:bg-slate-900 border-2 border-blue-600 dark:border-blue-500 flex items-center justify-center text-xs font-semibold tabular-nums text-blue-600 dark:text-blue-400">
                  {step.num}
                </div>

                <div className="flex flex-col items-start">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Icon size={16} className="text-blue-600 dark:text-blue-400" />
                    <h3 className="text-lg sm:text-xl font-bold font-heading text-slate-900 dark:text-white">
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                    {step.desc}
                  </p>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
