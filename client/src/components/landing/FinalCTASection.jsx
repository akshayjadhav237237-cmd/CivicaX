import { useNavigate } from 'react-router-dom';
import { ArrowRight, Play } from 'lucide-react';
import { Button } from './ui/Button';

export function FinalCTASection() {
  const navigate = useNavigate();

  return (
    <section className="landing-section border-b border-[var(--border-grid)] py-20 sm:py-24">
      <div className="landing-container px-4 sm:px-6 lg:px-8 text-center max-w-4xl mx-auto">
        <h2 className="landing-h2 mb-4 sm:mb-6 text-[var(--text-primary)]">
          Be warned before the water arrives.
        </h2>
        <p className="body-lg mb-8 sm:mb-10 text-[var(--text-secondary)] mx-auto max-w-2xl">
          Deploy street-level satellite flood intelligence for your municipality, emergency operations center, or community.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            variant="primary"
            onClick={() => navigate('/register')}
            className="w-full sm:w-auto"
          >
            <span>Get Started</span>
            <ArrowRight size={16} />
          </Button>

          <Button
            variant="ghost"
            onClick={() => navigate('/login')}
            className="w-full sm:w-auto"
          >
            <Play size={14} className="fill-current" />
            <span>Try Live Demo</span>
          </Button>
        </div>
      </div>
    </section>
  );
}
