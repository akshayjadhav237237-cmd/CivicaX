import { useNavigate } from 'react-router-dom';
import { ArrowRight, Play } from 'lucide-react';

export function FinalCTASection() {
  const navigate = useNavigate();

  return (
    <section className="py-20 sm:py-28 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">
        
        {/* One line */}
        <h2 className="text-3xl sm:text-5xl font-extrabold font-heading text-slate-900 dark:text-white tracking-tight mb-8">
          Be warned before the water arrives.
        </h2>

        {/* Two buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="w-full sm:w-auto px-7 py-3.5 rounded-lg text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <span>Get Started</span>
            <ArrowRight size={17} />
          </button>

          <button
            type="button"
            onClick={() => navigate('/login')}
            className="w-full sm:w-auto px-7 py-3.5 rounded-lg text-base font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
          >
            <Play size={15} className="text-blue-600 dark:text-blue-400 fill-blue-600 dark:fill-blue-400" />
            <span>Try Live Demo</span>
          </button>
        </div>

      </div>
    </section>
  );
}
