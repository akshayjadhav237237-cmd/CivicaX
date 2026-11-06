import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Play, CloudRain, Droplets, Waves, Radio, Clock } from 'lucide-react';
import api from '../../services/api';

export function HeroSection() {
  const navigate = useNavigate();

  const [liveData, setLiveData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchLivePrediction = async () => {
    try {
      setError(false);
      const res = await api.get('/emergency/flood-prediction/kedarnath');
      const payload = res.data?.data || res.data;

      if (payload) {
        const rainfall =
          payload.rainfallRate ??
          payload.factors?.rain?.value ??
          (typeof payload.rainfall24hMm === 'number' ? payload.rainfall24hMm / 6 : 0);

        const soilSaturation =
          payload.soilSaturationPct ??
          (typeof payload.soilMoisture === 'number' ? payload.soilMoisture * 100 : 0);

        const discharge = payload.dischargeM3S ?? 0;
        const riverCapacity =
          payload.riverCapacityPct ??
          Math.min(100, Math.round((discharge / 450) * 100));

        setLiveData({
          zoneName: payload.zoneName || 'Kedarnath Basin',
          alertLevel: (payload.alertLevel || payload.level || 'red').toLowerCase(),
          rainfall: Number(rainfall) || 0,
          soilSaturation: Number(soilSaturation) || 0,
          riverCapacity: Number(riverCapacity) || 0,
          timestamp: payload.timestamp ? new Date(payload.timestamp) : new Date(),
        });
      } else {
        setError(true);
      }
    } catch (err) {
      console.warn('[HeroSection] Live telemetry fetch issue:', err.message);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLivePrediction();
    const timer = setInterval(() => {
      fetchLivePrediction();
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const getAlertBadgeConfig = (level) => {
    switch (level) {
      case 'red':
        return {
          bg: 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 border-red-200 dark:border-red-800',
          dot: 'bg-red-500',
          text: 'Red Alert',
        };
      case 'orange':
        return {
          bg: 'bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800',
          dot: 'bg-amber-500',
          text: 'Orange Watch',
        };
      case 'yellow':
        return {
          bg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
          dot: 'bg-amber-400',
          text: 'Yellow Advisory',
        };
      default:
        return {
          bg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
          dot: 'bg-emerald-500',
          text: 'Green Monitoring',
        };
    }
  };

  return (
    <section className="py-16 sm:py-24 lg:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Headline, Subtext, Buttons */}
          <div className="lg:col-span-7 flex flex-col items-start">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-heading text-slate-900 dark:text-white tracking-tight leading-[1.1] mb-6">
              See the flood{' '}
              <span className="text-blue-600 dark:text-blue-400">
                before it happens.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl mb-8 sm:mb-10 font-normal">
              CivicaX turns live NASA satellite data and real hydrology physics into street-level flood warnings, minutes before water arrives.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="px-6 py-3.5 rounded-lg text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Get Started</span>
                <ArrowRight size={17} />
              </button>

              <button
                type="button"
                onClick={() => navigate('/login')}
                className="px-6 py-3.5 rounded-lg text-base font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
              >
                <Play size={15} className="text-blue-600 dark:text-blue-400 fill-blue-600 dark:fill-blue-400" />
                <span>Try Live Demo</span>
              </button>
            </div>
          </div>

          {/* Right Column: One Single Refined Glass Card */}
          <div className="lg:col-span-5 w-full">
            <div className="w-full rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 p-6 sm:p-7 shadow-lg shadow-slate-900/5 dark:shadow-none">
              
              {loading || error || !liveData ? (
                /* Connecting / Loading Skeleton */
                <div className="flex flex-col gap-4 py-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Satellite Stream
                      </span>
                    </div>
                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400">Syncing...</span>
                  </div>

                  <div className="space-y-3">
                    <div className="h-6 w-3/4 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
                    <div className="h-4 w-1/2 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
                    ))}
                  </div>

                  <div className="text-xs text-slate-500 dark:text-slate-400 font-mono text-center pt-2">
                    Connecting to satellite pipeline...
                  </div>
                </div>
              ) : (
                /* Real Live Telemetry Data */
                <div className="flex flex-col gap-5">
                  
                  {/* Card Header: Live Dot + Region + Badge */}
                  <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                      </span>
                      <span className="text-xs font-mono font-bold tracking-wider text-slate-900 dark:text-white uppercase">
                        LIVE TELEMETRY
                      </span>
                    </div>

                    {/* Alert Badge */}
                    {(() => {
                      const cfg = getAlertBadgeConfig(liveData.alertLevel);
                      return (
                        <div
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border text-xs font-semibold font-mono ${cfg.bg}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          <span>{cfg.text}</span>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Location & Status Line */}
                  <div>
                    <h2 className="text-xl font-bold font-heading text-slate-900 dark:text-white">
                      {liveData.zoneName}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                      Mandakini River Basin • Kedarnath Coordinates
                    </p>
                  </div>

                  {/* Three Core Metrics */}
                  <div className="grid grid-cols-3 gap-3 pt-2">
                    {/* Metric 1: Rainfall */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex flex-col">
                      <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                        <CloudRain size={13} className="text-blue-600 dark:text-blue-400" />
                        <span>Rainfall</span>
                      </div>
                      <div className="text-base sm:text-lg font-bold font-mono text-slate-900 dark:text-white">
                        {liveData.rainfall.toFixed(1)} <span className="text-xs font-normal">mm/h</span>
                      </div>
                    </div>

                    {/* Metric 2: Soil Saturation */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex flex-col">
                      <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                        <Droplets size={13} className="text-amber-500" />
                        <span>Soil Sat.</span>
                      </div>
                      <div className="text-base sm:text-lg font-bold font-mono text-slate-900 dark:text-white">
                        {liveData.soilSaturation.toFixed(1)}%
                      </div>
                    </div>

                    {/* Metric 3: River Capacity */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex flex-col">
                      <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                        <Waves size={13} className="text-blue-600 dark:text-blue-400" />
                        <span>River Cap.</span>
                      </div>
                      <div className="text-base sm:text-lg font-bold font-mono text-slate-900 dark:text-white">
                        {liveData.riverCapacity}%
                      </div>
                    </div>
                  </div>

                  {/* Sync Notice */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      <span>Updated {liveData.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </span>
                    <span>Auto-refresh: 60s</span>
                  </div>

                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
