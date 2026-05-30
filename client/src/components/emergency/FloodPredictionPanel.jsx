import { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { GlassCard } from '../ui/GlassCard';
import api from '../../services/api';

// ─── Constants ────────────────────────────────────────────────────────────────
const REFETCH_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
const FRESH_THRESHOLD_MS  = 10 * 60 * 1000; // <10 min = "Live"

// ─── Alert level badge styles ─────────────────────────────────────────────────
const ALERT_BADGE = {
  green:  'bg-green-100  text-green-700  border border-green-300',
  yellow: 'bg-yellow-100 text-yellow-700 border border-yellow-300',
  orange: 'bg-orange-100 text-orange-700 border border-orange-300',
  red:    'bg-red-100    text-red-700    border border-red-300',
};

// ─── Small helpers ────────────────────────────────────────────────────────────
function ProgressBar({ percent, colorClass }) {
  const clamped = Math.min(Math.max(percent, 0), 100);
  return (
    <div className="w-full h-1.5 rounded-full bg-slate-200 mt-1">
      <div
        className={`h-1.5 rounded-full transition-all duration-500 ${colorClass}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

function DataRow({ icon, label, children }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-base leading-none mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <div className="font-bold text-sm text-slate-800 leading-snug">{children}</div>
      </div>
    </div>
  );
}

function SectionDivider({ title }) {
  return (
    <div className="flex items-center gap-2 pt-1">
      <div className="flex-1 h-px bg-slate-200" />
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap">
        {title}
      </span>
      <div className="flex-1 h-px bg-slate-200" />
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <GlassCard padding="p-5" className="flex flex-col gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-5 rounded-lg bg-slate-200 animate-pulse"
          style={{ width: `${70 + (i % 3) * 10}%` }}
        />
      ))}
    </GlassCard>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function FloodPredictionPanel({ zoneId, zoneName, onPredictionLoad }) {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading]       = useState(false);
  const intervalRef                 = useRef(null);

  // Fetch helper
  const fetchPrediction = async (id) => {
    try {
      const data = await api.get(`/emergency/flood-prediction/${id}`);
      // api.js unwraps response.data; backend shape: { success, data: { latest, history, onDemand } }
      const latest = data?.data?.latest ?? data?.latest ?? null;
      const history = data?.data?.history ?? data?.history ?? [];
      if (latest) {
        setPrediction(latest);
        if (onPredictionLoad) onPredictionLoad({ ...latest, history });
      } else {
        toast.error('Unexpected response format for flood prediction.');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to fetch flood prediction.');
    }
  };

  useEffect(() => {
    if (!zoneId) {
      setPrediction(null);
      return;
    }

    setLoading(true);
    fetchPrediction(zoneId).finally(() => setLoading(false));

    // Auto-refetch every 10 minutes
    intervalRef.current = setInterval(() => fetchPrediction(zoneId), REFETCH_INTERVAL_MS);

    return () => {
      clearInterval(intervalRef.current);
    };
  }, [zoneId]);

  // ── No zone selected ───────────────────────────────────────────────────────
  if (!zoneId) {
    return (
      <GlassCard>
        <div className="flex flex-col items-center justify-center py-10 text-slate-400">
          <span style={{ fontSize: 32 }}>🗺️</span>
          <p className="mt-3 text-sm font-medium">Select a zone to see flood prediction</p>
        </div>
      </GlassCard>
    );
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading && !prediction) {
    return <LoadingSkeleton />;
  }

  // ── No data yet ────────────────────────────────────────────────────────────
  if (!prediction) {
    return (
      <GlassCard>
        <div className="flex flex-col items-center justify-center py-10 text-slate-400">
          <span style={{ fontSize: 32 }}>📭</span>
          <p className="mt-3 text-sm font-medium">No prediction data available</p>
        </div>
      </GlassCard>
    );
  }

  // ── Derived values ─────────────────────────────────────────────────────────
  const {
    alertLevel,
    timestamp,
    rainfall,
    soilMoisture,
    riverStatus,
    runoff,
    populationAtRisk,
    resourcesNeeded,
    summary,
  } = prediction;

  const isLive        = timestamp && (Date.now() - new Date(timestamp).getTime()) < FRESH_THRESHOLD_MS;
  const badgeCls      = ALERT_BADGE[alertLevel] ?? ALERT_BADGE.green;
  const showResources = alertLevel === 'orange' || alertLevel === 'red';

  // Soil moisture bar colour
  const soilBarColor =
    soilMoisture?.saturationPercent > 80 ? 'bg-red-500'
    : soilMoisture?.saturationPercent > 50 ? 'bg-yellow-500'
    : 'bg-blue-400';

  // River capacity bar colour
  const capacityPercent = riverStatus ? Math.round(riverStatus.overflowRatio * 100) : 0;
  const capacityBarColor = capacityPercent > 100 ? 'bg-red-500' : 'bg-blue-400';

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <GlassCard padding="p-5" className="flex flex-col gap-4">

      {/* ── Header ── */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h2
            className="text-base font-bold text-slate-800 truncate"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            {zoneName ?? `Zone ${zoneId}`}
          </h2>

          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${badgeCls}`}>
            {alertLevel ?? 'unknown'}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          {timestamp && (
            <span>Last updated: {new Date(timestamp).toLocaleTimeString()}</span>
          )}
          {isLive && (
            <span className="flex items-center gap-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              <span className="text-green-600 font-medium">Live</span>
            </span>
          )}
        </div>
      </div>

      {/* ── Rainfall ── */}
      {rainfall && (
        <DataRow icon="🌧" label="Rainfall">
          {rainfall.current.toFixed(1)} mm/hr current
          &nbsp;|&nbsp;
          {rainfall.forecast24h.toFixed(1)} mm 24h forecast
        </DataRow>
      )}

      {/* ── Soil Saturation ── */}
      {soilMoisture && (
        <DataRow icon="💧" label="Soil Saturation">
          {soilMoisture.saturationPercent}%
          <ProgressBar percent={soilMoisture.saturationPercent} colorClass={soilBarColor} />
        </DataRow>
      )}

      {/* ── River Velocity ── */}
      {riverStatus && (
        <DataRow icon="🌊" label="River Velocity">
          {riverStatus.velocityMs} m/s ({riverStatus.velocityKmh} km/h)
        </DataRow>
      )}

      {/* ── River Capacity ── */}
      {riverStatus && (
        <DataRow icon="⚡" label="River Capacity">
          {capacityPercent}%
          <ProgressBar percent={capacityPercent} colorClass={capacityBarColor} />
        </DataRow>
      )}

      {/* ── Overflow ── */}
      {riverStatus && (
        <DataRow icon="📍" label="Overflow">
          {riverStatus.isOverflowing ? (
            <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700 border border-red-300 font-semibold">
              YES
            </span>
          ) : (
            <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 border border-green-300 font-semibold">
              NO
            </span>
          )}
        </DataRow>
      )}

      {/* ── ETA to city (only if overflowing) ── */}
      {riverStatus?.isOverflowing && riverStatus.etaMinutes != null && (
        <DataRow icon="⏱" label="ETA to city">
          {Math.round(riverStatus.etaMinutes)} minutes
        </DataRow>
      )}

      {/* ── Population at risk (only if overflowing) ── */}
      {riverStatus?.isOverflowing && populationAtRisk != null && (
        <DataRow icon="👥" label="Population at risk">
          {populationAtRisk.toLocaleString()}
        </DataRow>
      )}

      {/* ── Runoff section ── */}
      {runoff && (
        <>
          <SectionDivider title="Runoff" />
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-sm">
              <span className="text-xs text-slate-500">Curve Number</span>
              <span className="font-bold text-slate-800">{runoff.curveNumber}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-xs text-slate-500">Runoff</span>
              <span className="font-bold text-slate-800">{runoff.runoffPercent}% of rainfall</span>
            </div>
            {runoff.explanation && (
              <p className="text-xs text-slate-500 italic leading-snug">{runoff.explanation}</p>
            )}
          </div>
        </>
      )}

      {/* ── Resources section (orange / red only) ── */}
      {showResources && resourcesNeeded && (
        <>
          <SectionDivider title="Resources Needed" />
          <div className="grid grid-cols-2 gap-y-2 gap-x-4">
            <DataRow icon="🚤" label="Rescue Boats">
              {resourcesNeeded.rescueBoats}
            </DataRow>
            <DataRow icon="🚑" label="Ambulances">
              {resourcesNeeded.ambulances}
            </DataRow>
            <DataRow icon="📦" label="Relief Kits">
              {resourcesNeeded.reliefKits.toLocaleString()}
            </DataRow>
            <DataRow icon="🚌" label="Evacuation Buses">
              {resourcesNeeded.evacuationBuses}
            </DataRow>
          </div>
        </>
      )}

      {/* ── Summary box ── */}
      {summary && (
        <div
          style={{
            background: 'rgba(255,255,255,0.6)',
            borderRadius: 12,
            padding: '10px 12px',
            border: '1px solid rgba(0,0,0,0.08)',
          }}
        >
          <p style={{ fontSize: 13, fontStyle: 'italic', color: '#475569', lineHeight: 1.5 }}>
            {summary}
          </p>
        </div>
      )}

    </GlassCard>
  );
}
