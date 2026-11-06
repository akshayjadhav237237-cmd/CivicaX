import { lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Play, MapPin } from 'lucide-react';
import { Button } from './ui/Button';
import { useTranslation } from '../../i18n';
import { Skeleton } from './ui/Skeleton';

// Lazy load Leaflet Map
const LiveMonitorMap = lazy(() => import('./LiveMonitorMap'));

export function HeroSection({ prediction }) {
  const navigate = useNavigate();
  const { data, loading, error, selectedZone, setSelectedZone, zones } = prediction;

  return (
    <section id="live-monitor" className="landing-section pt-24 sm:pt-28 lg:pt-32">
      <div className="landing-container px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-0 items-stretch">
          
          {/* Left Column (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between lg:pr-10 lg:pb-6">
            <div>
              {/* Eyebrow */}
              <span className="eyebrow block mb-3 sm:mb-4">
                01 // SATELLITE-TO-STREET EARLY WARNING
              </span>

              {/* H1 */}
              <h1 className="landing-h1 mb-4 sm:mb-6">
                See the flood before it happens.
              </h1>

              {/* Lead */}
              <p className="body-lg mb-6 sm:mb-8 text-[var(--text-secondary)]">
                CivicaX turns live NASA satellite data and hydrology physics into street-level flood warnings, minutes before water arrives.
              </p>

              {/* Zone Selector (48px high) listing real zones from API */}
              <div className="mb-6 sm:mb-8">
                <label
                  htmlFor="zone-select"
                  className="block micro text-[var(--text-muted)] uppercase tracking-wider mb-2"
                >
                  Active Hydrological Basin
                </label>
                <div className="relative">
                  <select
                    id="zone-select"
                    value={selectedZone}
                    onChange={(e) => setSelectedZone(e.target.value)}
                    className="w-full h-[48px] px-3.5 rounded-[6px] border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-primary)] font-medium text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] cursor-pointer pr-10"
                  >
                    {zones && zones.length > 0 ? (
                      zones.map((z) => (
                        <option key={z.id} value={z.id}>
                          {z.name}
                        </option>
                      ))
                    ) : (
                      <option value="zone-kedarnath-001">Kedarnath Basin (Core)</option>
                    )}
                  </select>
                  <MapPin
                    size={16}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-8">
                <Button
                  variant="primary"
                  onClick={() => navigate('/register')}
                  className="w-full sm:w-auto"
                >
                  <span>{t("common.get_started", null, "Get Started")}</span>
                  <ArrowRight size={16} />
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => navigate('/login')}
                  className="w-full sm:w-auto"
                >
                  <Play size={14} className="fill-current" />
                  <span>{t("common.try_live_demo", null, "Try Live Demo")}</span>
                </Button>
              </div>
            </div>

            {/* 3-item Provenance Strip in Mono */}
            <div className="pt-6 border-t border-[var(--border-grid)] grid grid-cols-3 gap-2 micro text-[var(--text-muted)]">
              <div>
                <span className="block text-[var(--text-primary)] font-semibold">NASA GPM + SMAP</span>
                <span>Precipitation & Soil</span>
              </div>
              <div>
                <span className="block text-[var(--text-primary)] font-semibold">Manning&apos;s Eq.</span>
                <span>Open-Channel Flow</span>
              </div>
              <div>
                <span className="block text-[var(--text-primary)] font-semibold">GPT-4o</span>
                <span>Alert Text Synthesis</span>
              </div>
            </div>
          </div>

          {/* Right Column (7 cols): Leaflet Interactive Basin Map */}
          <div className="lg:col-span-7 lg:pl-10 lg:border-l border-[var(--border-grid)] flex flex-col justify-center">
            <Suspense
              fallback={
                <div className="w-full h-[380px] sm:h-[460px] lg:h-[540px] rounded-[8px] border border-[var(--border-grid)] bg-[var(--bg-subtle)] p-6">
                  <Skeleton height="100%" width="100%" />
                </div>
              }
            >
              <LiveMonitorMap data={data} loading={loading} isDelayed={error} />
            </Suspense>
          </div>

        </div>
      </div>
    </section>
  );
}
