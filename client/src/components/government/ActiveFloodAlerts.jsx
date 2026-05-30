import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import GlassCard from '../ui/GlassCard';
import api from '../../services/api';

export default function ActiveFloodAlerts({ onDispatch }) {
  const [alerts, setAlerts] = useState([]);
  const [meta, setMeta] = useState({ total: 0, orange: 0, red: 0 });
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    try {
      const res = await api.get('/emergency/flood-predictions/active');
      setAlerts(res.data ?? []);
      setMeta(res.meta ?? { total: 0, orange: 0, red: 0 });
    } catch (err) {
      toast.error('Failed to load active flood alerts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 120000);
    return () => clearInterval(interval);
  }, []);

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div>
        {[0, 1].map((i) => (
          <div
            key={i}
            className="glass-card p-4 mb-3 animate-pulse rounded-2xl"
          >
            <div className="h-5 bg-slate-200 rounded w-1/2 mb-3" />
            <div className="grid grid-cols-2 gap-2 mb-3">
              {[0, 1, 2, 3].map((j) => (
                <div key={j} className="h-4 bg-slate-200 rounded" />
              ))}
            </div>
            <div className="h-4 bg-slate-200 rounded w-3/4 mb-3" />
            <div className="h-9 bg-slate-200 rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  /* ── All-clear state ── */
  if (meta.total === 0) {
    return (
      <div className="glass-card p-6 flex flex-col items-center justify-center gap-3">
        <span style={{ fontSize: 40 }}>✅</span>
        <h3 className="font-bold text-green-700">All Clear — No Active Flood Emergencies</h3>
        <p className="text-sm text-slate-500">All zones within safe flood parameters.</p>
      </div>
    );
  }

  /* ── Active alerts ── */
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <span>🌊</span> Active Flood Emergencies
        </h3>
        <div className="flex gap-2">
          {meta.orange > 0 && (
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-bold">
              {meta.orange} ORANGE
            </span>
          )}
          {meta.red > 0 && (
            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-bold animate-pulse">
              {meta.red} RED
            </span>
          )}
        </div>
      </div>

      {/* Alert cards */}
      {alerts.map((item, idx) => {
        const isRed = item.alertLevel === 'red';
        const badgeBg = isRed ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700';
        const overflowPct = Math.round((item.riverStatus?.overflowRatio || 0) * 100);
        const eta = Math.round(item.riverStatus?.etaMinutes || 0);
        const pop = (item.populationAtRisk || 0).toLocaleString();
        const alertSince = item.createdAt
          ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : '—';
        const rn = item.resourcesNeeded;

        return (
          <GlassCard key={item._id ?? idx} className="p-4 mb-3">
            {/* Header row */}
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-slate-800 truncate">{item.zoneName ?? `Zone ${item.zoneId}`}</span>
              <span className={`text-xs px-2 py-1 rounded-full font-bold uppercase ${badgeBg}`}>
                {item.alertLevel}
              </span>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mb-3">
              <div className="text-slate-500">
                Overflow:{' '}
                <span className="font-semibold text-slate-700">{overflowPct}% of capacity</span>
              </div>
              <div className="text-slate-500">
                Pop. at risk:{' '}
                <span className="font-semibold text-slate-700">{pop}</span>
              </div>
              <div className="text-slate-500">
                ETA:{' '}
                <span className="font-semibold text-slate-700">{eta} min</span>
              </div>
              <div className="text-slate-500">
                Alert since:{' '}
                <span className="font-semibold text-slate-700">{alertSince}</span>
              </div>
            </div>

            {/* Resources row */}
            {rn && (
              <p className="text-xs text-slate-600 mb-1">
                🚤 {rn.rescueBoats} boats &nbsp;·&nbsp; 🚑 {rn.ambulances} ambulances &nbsp;·&nbsp; 📦 {(rn.reliefKits ?? 0).toLocaleString()} kits
              </p>
            )}

            {/* Dispatch button */}
            <button
              onClick={() => onDispatch({ event: item, resources: item.resourcesNeeded })}
              className="mt-3 w-full py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-colors"
            >
              🚨 Dispatch Resources
            </button>
          </GlassCard>
        );
      })}
    </div>
  );
}
