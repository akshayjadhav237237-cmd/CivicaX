/**
 * FloodRiskPanel.jsx — Live Satellite Intelligence Panel
 *
 * Replaces the old static "Live Telemetry" box in EmergencyPage.
 * Shows real data from the Mandakini Basin disaster pipeline:
 *   - Flood risk gauge (0–100 composite score)
 *   - 4 factor contribution bars (rain, forecast, soil, terrain)
 *   - Stat cards (current rain, 24h forecast, soil saturation %)
 *   - Data source badges
 *   - Live WebSocket updates via 'flood:risk-update' event
 *
 * Props:
 *   socket — Socket.io client instance (from useSocket hook or parent)
 */

import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, CloudRain, Droplets, Mountain, Clock, Satellite } from 'lucide-react';
import { FloodRiskGauge } from './FloodRiskGauge';
import api from '../services/api';

const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

const levelColors = {
  green:  { text: '#16a34a', bg: '#dcfce7', border: '#86efac' },
  yellow: { text: '#ca8a04', bg: '#fef9c3', border: '#fde047' },
  orange: { text: '#ea580c', bg: '#ffedd5', border: '#fdba74' },
  red:    { text: '#dc2626', bg: '#fee2e2', border: '#fca5a5' },
};

const sourceLabels = {
  open_meteo:        'Open-Meteo',
  GPM_IMERG:         'NASA GPM',
  default_fallback:  'SMAP Fallback',
  SMAP:              'NASA SMAP',
  open_elevation:    'SRTM/OE',
  opentopo:          'OpenTopo',
  hardcoded_fallback:'Valley DEM',
  unavailable:       'N/A',
};

function FactorBar({ label, contribution, weight, value, unit, source }) {
  const pct = Math.min(100, Math.max(0, contribution));
  const barColor = pct > 70 ? '#ef4444' : pct > 40 ? '#f97316' : pct > 20 ? '#eab308' : '#22c55e';

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#475569', fontFamily: "'Outfit', sans-serif" }}>
          {label}
        </span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>{value !== null && value !== undefined ? `${value} ${unit}` : '--'}</span>
          <span style={{
            fontSize: 9, padding: '1px 5px', borderRadius: 4,
            background: '#f1f5f9', color: '#64748b', fontWeight: 600,
          }}>
            {sourceLabels[source] || source || 'live'}
          </span>
        </div>
      </div>
      <div style={{ height: 6, borderRadius: 999, background: '#e2e8f0', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 999,
          width: `${pct}%`,
          background: barColor,
          transition: 'width 1s ease, background 0.5s ease',
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
        <span style={{ fontSize: 9, color: '#94a3b8' }}>w={weight}</span>
        <span style={{ fontSize: 9, color: '#94a3b8' }}>{pct.toFixed(1)}pts</span>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, unit, color = '#3b82f6', sub }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.7)',
      border: '1px solid #e2e8f0',
      borderRadius: 12,
      padding: '10px 12px',
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={14} color={color} />
        </div>
        <span style={{ fontSize: 10, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {label}
        </span>
      </div>
      <div style={{ paddingLeft: 34 }}>
        <span style={{ fontSize: 18, fontWeight: 800, color: color, fontFamily: "'Outfit', sans-serif" }}>
          {value ?? '--'}
        </span>
        {unit && <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 3 }}>{unit}</span>}
        {sub && <p style={{ fontSize: 10, color: '#94a3b8', margin: 0, marginTop: 1 }}>{sub}</p>}
      </div>
    </div>
  );
}

export function FloodRiskPanel({ socket }) {
  const [riskData, setRiskData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchRiskData = useCallback(async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const { data } = await api.get('/emergency/flood-risk');
      if (data?.data) {
        setRiskData(data.data);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('[FloodRiskPanel] Fetch error:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchRiskData();
  }, [fetchRiskData]);

  // Polling every 5 minutes
  useEffect(() => {
    const timer = setInterval(() => fetchRiskData(true), POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [fetchRiskData]);

  // WebSocket live updates
  useEffect(() => {
    if (!socket) return;
    const handler = (payload) => {
      setRiskData((prev) => ({ ...(prev || {}), ...payload }));
      setLastUpdated(new Date());
    };
    socket.on('flood:risk-update', handler);
    return () => socket.off('flood:risk-update', handler);
  }, [socket]);

  const score   = riskData?.score ?? 0;
  const level   = riskData?.level ?? 'green';
  const factors = riskData?.factors ?? {};
  const colors  = levelColors[level] || levelColors.green;

  const rainfallMmHr    = factors.rain?.value ?? null;
  const forecast24h     = factors.forecast?.value ?? null;
  const soilPct         = factors.soil?.saturationPct ?? null;
  const soilSource      = factors.soil?.source ?? null;
  const overflowDetected = riskData?.overflowDetected ?? false;

  if (isLoading) {
    return (
      <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
        <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite', marginBottom: 8 }} />
        <p style={{ margin: 0 }}>Loading satellite pipeline data...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Satellite size={14} color="#6366f1" />
          <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Mandakini Basin Intelligence
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {lastUpdated && (
            <span style={{ fontSize: 9, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 3 }}>
              <Clock size={9} />
              {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={() => fetchRiskData()}
            disabled={isRefreshing}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 4,
              borderRadius: 6, display: 'flex', alignItems: 'center',
            }}
            title="Refresh satellite data"
          >
            <RefreshCw size={13} color="#94a3b8" style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>
      </div>

      {/* Overflow alert banner */}
      {overflowDetected && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fca5a5',
          borderRadius: 10, padding: '8px 12px',
          display: 'flex', alignItems: 'center', gap: 8,
          animation: 'pulse 2s infinite',
        }}>
          <span style={{ fontSize: 16 }}>🌊</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#dc2626' }}>
            OVERFLOW DETECTED — Street-level flood data available on map
          </span>
        </div>
      )}

      {/* Gauge + Recommendation */}
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <FloodRiskGauge score={score} level={level} size={120} />
        <div style={{ flex: 1 }}>
          <div style={{
            background: colors.bg, border: `1px solid ${colors.border}`,
            borderRadius: 10, padding: '10px 12px', fontSize: 11, lineHeight: 1.5,
            color: colors.text, fontWeight: 500,
            transition: 'background 0.8s ease, border-color 0.8s ease',
          }}>
            {riskData?.recommendation
              ? riskData.recommendation.replace(/^[^\s]+ /, '')  // strip leading emoji from text
              : 'Satellite pipeline running — first result available shortly.'}
          </div>
        </div>
      </div>

      {/* Stat cards — 3-wide grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <StatCard
          icon={CloudRain}
          label="Rain"
          value={rainfallMmHr?.toFixed(1)}
          unit="mm/hr"
          color="#3b82f6"
          sub={sourceLabels[factors.rain?.source] || 'live'}
        />
        <StatCard
          icon={CloudRain}
          label="24h Fore."
          value={forecast24h?.toFixed(0)}
          unit="mm"
          color="#8b5cf6"
        />
        <StatCard
          icon={Droplets}
          label="Soil"
          value={soilPct}
          unit="%"
          color={soilPct > 85 ? '#ef4444' : soilPct > 65 ? '#f97316' : '#22c55e'}
          sub={sourceLabels[soilSource] || 'SMAP'}
        />
      </div>

      {/* Factor contribution bars */}
      {Object.keys(factors).length > 0 && (
        <div style={{
          background: 'rgba(248,250,252,0.8)', borderRadius: 10,
          border: '1px solid #e2e8f0', padding: '12px 14px',
        }}>
          <p style={{
            margin: '0 0 10px', fontSize: 10, fontWeight: 700,
            color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>
            Score Factors
          </p>
          {factors.rain && (
            <FactorBar
              label="Current Rainfall"
              contribution={factors.rain.contribution}
              weight={factors.rain.weight}
              value={factors.rain.value?.toFixed(1)}
              unit="mm/hr"
              source={factors.rain.source}
            />
          )}
          {factors.forecast && (
            <FactorBar
              label="24h Forecast"
              contribution={factors.forecast.contribution}
              weight={factors.forecast.weight}
              value={factors.forecast.value?.toFixed(0)}
              unit="mm"
              source={factors.forecast.source}
            />
          )}
          {factors.soil && (
            <FactorBar
              label="Soil Saturation"
              contribution={factors.soil.contribution}
              weight={factors.soil.weight}
              value={factors.soil.value?.toFixed(3)}
              unit="m³/m³"
              source={factors.soil.source}
            />
          )}
          {factors.terrain && (
            <FactorBar
              label="Valley Slope"
              contribution={factors.terrain.contribution}
              weight={factors.terrain.weight}
              value={factors.terrain.value?.toFixed(4)}
              unit="m/m"
              source={factors.terrain.source}
            />
          )}
        </div>
      )}
    </div>
  );
}
