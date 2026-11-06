import { useState, useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Radio, CloudRain, Droplet, Waves, Clock, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import api from '../../services/api';

/**
 * Animated number count-up for live API values.
 */
function LiveCountUp({ value, decimals = 0, suffix = '' }) {
  const [displayValue, setDisplayValue] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion || typeof value !== 'number' || isNaN(value)) {
      setDisplayValue(value);
      return;
    }

    const duration = 1200;
    const start = performance.now();
    const initial = 0;

    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = initial + (value - initial) * ease;
      setDisplayValue(Number(current.toFixed(decimals)));

      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    };

    const animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [value, decimals, shouldReduceMotion]);

  return (
    <span>
      {typeof displayValue === 'number' ? displayValue.toFixed(decimals) : displayValue}
      {suffix}
    </span>
  );
}

export function LiveStatusStrip() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  const fetchLiveStatus = async () => {
    try {
      setError(false);
      // Calls /api/v1/emergency/flood-prediction/kedarnath via api service
      const res = await api.get('/emergency/flood-prediction/kedarnath');
      const payload = res.data?.data || res.data;

      if (payload) {
        const rainfall =
          payload.rainfallRate ??
          payload.factors?.rain?.value ??
          (typeof payload.rainfall24hMm === 'number' ? (payload.rainfall24hMm / 6) : 0);

        const soilSaturation =
          payload.soilSaturationPct ??
          (typeof payload.soilMoisture === 'number' ? payload.soilMoisture * 100 : 0);

        const discharge = payload.dischargeM3S ?? 0;
        // River capacity % calibrated against 450 m3/s Kedarnath cross-section limit
        const riverCapacity =
          payload.riverCapacityPct ??
          (Math.min(100, Math.round((discharge / 450) * 100)) || 0);

        setData({
          zoneName: payload.zoneName || 'Kedarnath Basin',
          alertLevel: (payload.alertLevel || payload.level || 'red').toLowerCase(),
          rainfall: Number(rainfall) || 0,
          soilSaturation: Number(soilSaturation) || 0,
          riverCapacity: Number(riverCapacity) || 0,
          timestamp: payload.timestamp ? new Date(payload.timestamp) : new Date(),
        });
        setLastRefreshed(new Date());
      } else {
        setError(true);
      }
    } catch (err) {
      console.warn('[LiveStatusStrip] Pipeline sync warning:', err.message);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveStatus();
    // 60-second automated refresh loop
    const interval = setInterval(() => {
      fetchLiveStatus();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const getAlertBadge = (level) => {
    switch (level) {
      case 'red':
        return {
          bg: 'bg-red-500/10 dark:bg-red-950/40',
          border: 'border-red-500/30 dark:border-red-700/50',
          text: 'text-red-700 dark:text-red-400',
          dot: 'bg-red-500',
          label: 'RED ALERT',
        };
      case 'orange':
        return {
          bg: 'bg-orange-500/10 dark:bg-orange-950/40',
          border: 'border-orange-500/30 dark:border-orange-700/50',
          text: 'text-orange-700 dark:text-orange-400',
          dot: 'bg-orange-500',
          label: 'ORANGE WATCH',
        };
      case 'yellow':
        return {
          bg: 'bg-yellow-500/10 dark:bg-yellow-950/40',
          border: 'border-yellow-500/30 dark:border-yellow-700/50',
          text: 'text-yellow-700 dark:text-yellow-400',
          dot: 'bg-yellow-500',
          label: 'YELLOW ADVISORY',
        };
      default:
        return {
          bg: 'bg-emerald-500/10 dark:bg-emerald-950/40',
          border: 'border-emerald-500/30 dark:border-emerald-700/50',
          text: 'text-emerald-700 dark:text-emerald-400',
          dot: 'bg-emerald-500',
          label: 'GREEN MONITORING',
        };
    }
  };

  return (
    <section id="live-status" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 -mt-8 sm:-mt-12 relative z-20">
      <div className="w-full rounded-3xl bg-white/75 dark:bg-slate-900/75 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-800 shadow-[0_16px_40px_rgba(0,0,0,0.06)] dark:shadow-[0_20px_48px_rgba(0,0,0,0.4)] p-4 sm:p-6 lg:p-7">
        
        {/* Loading or Error State -> Skeleton */}
        {(loading || error || !data) ? (
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-4 px-2">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-blue-500" />
              </span>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Radio size={16} className="text-blue-500 animate-pulse" />
                  Connecting to satellite pipeline...
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  Syncing with Open-Meteo & NASA GPM telemetry stream
                </span>
              </div>
            </div>

            {/* Skeleton blocks */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full md:w-auto">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-14 w-28 rounded-2xl bg-slate-200/60 dark:bg-slate-800/60 animate-pulse" />
              ))}
            </div>
          </div>
        ) : (
          /* Real Data Loaded */
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            
            {/* Zone & Alert Level Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                </span>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  LIVE TELEMETRY
                </span>
              </div>

              <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 hidden sm:block" />

              <div>
                <h3 className="text-base sm:text-lg font-bold font-heading text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{data.zoneName}</span>
                </h3>
              </div>

              {/* Alert Badge */}
              {(() => {
                const badge = getAlertBadge(data.alertLevel);
                return (
                  <div
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold font-mono tracking-wide ${badge.bg} ${badge.border} ${badge.text}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
                    <span>{badge.label}</span>
                  </div>
                );
              })()}
            </div>

            {/* Real Data Metrics with Live Animated Count-Up */}
            <div className="grid grid-cols-3 gap-3 sm:gap-6 w-full lg:w-auto">
              
              {/* Metric 1: Rainfall */}
              <div className="flex flex-col px-3 py-2 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-0.5">
                  <CloudRain size={13} className="text-blue-500" />
                  <span>Rainfall</span>
                </span>
                <span className="text-lg sm:text-xl font-bold font-mono text-slate-900 dark:text-white">
                  <LiveCountUp value={data.rainfall} decimals={1} suffix=" mm/h" />
                </span>
              </div>

              {/* Metric 2: Soil Saturation */}
              <div className="flex flex-col px-3 py-2 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-0.5">
                  <Droplet size={13} className="text-teal-500" />
                  <span>Soil Sat.</span>
                </span>
                <span className="text-lg sm:text-xl font-bold font-mono text-slate-900 dark:text-white">
                  <LiveCountUp value={data.soilSaturation} decimals={1} suffix="%" />
                </span>
              </div>

              {/* Metric 3: River Capacity */}
              <div className="flex flex-col px-3 py-2 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-0.5">
                  <Waves size={13} className="text-cyan-500" />
                  <span>River Cap.</span>
                </span>
                <span className="text-lg sm:text-xl font-bold font-mono text-slate-900 dark:text-white">
                  <LiveCountUp value={data.riverCapacity} decimals={0} suffix="%" />
                </span>
              </div>

            </div>

            {/* Sync Timestamp */}
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500 dark:text-slate-400 select-none self-end lg:self-center">
              <Clock size={12} />
              <span>
                Updated {data.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>

          </div>
        )}

      </div>
    </section>
  );
}
