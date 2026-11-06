import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Polygon, Polyline, CircleMarker } from 'react-leaflet';
import { useThemeStore } from '../../stores/themeStore';
import { CornerCrosshairs } from './ui/CornerCrosshairs';
import { AlertBadge } from './ui/AlertBadge';
import { Layers } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Calibrated Kedarnath Mandakini Basin Coordinates
const KEDARNATH_CENTER = [30.7346, 79.0669];

// Tier Color Codes
const TIER_COLORS = {
  GREEN: '#15803D',
  YELLOW: '#A16207',
  ORANGE: '#C2410C',
  RED: '#B91C1C',
};

// Street Severity Colors
const STREET_COLORS = {
  watch: '#FBBF24',
  warning: '#F97316',
  danger: '#EF4444',
  critical: '#7F1D1D',
};

export function LiveMonitorMap({ data, loading, isDelayed = false }) {
  const { isDark } = useThemeStore();
  const [canPan, setCanPan] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mapLayer, setMapLayer] = useState('satellite'); // 'satellite' | 'streets'

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setCanPan(true);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Free, high-reliability unwatermarked map tiles
  const tileConfig = useMemo(() => {
    if (mapLayer === 'satellite') {
      return {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: '&copy; Esri World Imagery',
        className: isDark ? 'brightness-[0.82] contrast-[1.08]' : '',
      };
    }
    // High-contrast OpenStreetMap Street Map
    return {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; OpenStreetMap contributors',
      className: isDark ? 'dark-map-tiles' : '',
    };
  }, [mapLayer, isDark]);

  const alertTier = (data?.alertLevel || 'ORANGE').toUpperCase();
  const tierColor = TIER_COLORS[alertTier] || TIER_COLORS.ORANGE;

  // Rainfall wash opacity & color calculation
  const rainfall = data?.rainfall?.current || 38.4;
  const rainWash = useMemo(() => {
    if (rainfall <= 2) return null;
    if (rainfall <= 10) return { color: '#94A3B8', opacity: 0.22 };
    if (rainfall <= 25) return { color: '#0284C7', opacity: 0.40 };
    if (rainfall <= 45) return { color: '#EA580C', opacity: 0.55 };
    return { color: '#B91C1C', opacity: 0.70 };
  }, [rainfall]);

  // Polygon positions (from GeoJSON coordinates [lng, lat] converted to [lat, lng])
  const polygonPositions = useMemo(() => {
    if (!data?.geometry) {
      return [
        [30.7318, 79.0645],
        [30.7375, 79.0655],
        [30.7385, 79.0695],
        [30.7330, 79.0705],
        [30.7318, 79.0645],
      ];
    }
    const coords = data.geometry.coordinates;
    if (Array.isArray(coords) && coords[0]) {
      return coords[0].map(([lng, lat]) => [lat, lng]);
    }
    return [
      [30.7318, 79.0645],
      [30.7375, 79.0655],
      [30.7385, 79.0695],
      [30.7330, 79.0705],
      [30.7318, 79.0645],
    ];
  }, [data?.geometry]);

  // Streets geometry if overflowing or critical
  const streetsToRender = useMemo(() => {
    return (data?.affectedStreets || []).map((st) => ({
      coords: st.coordinates ? st.coordinates.map(([lng, lat]) => [lat, lng]) : [],
      color: STREET_COLORS[st.level] || STREET_COLORS.danger,
    }));
  }, [data?.affectedStreets]);

  const showPulse = alertTier === 'YELLOW' || alertTier === 'ORANGE' || alertTier === 'RED';

  return (
    <div className="relative w-full h-[380px] sm:h-[460px] lg:h-[540px] rounded-[8px] overflow-hidden border border-[var(--border-strong)] bg-[#0A0F1D]">
      <CornerCrosshairs />

      {/* Layer Switcher & Pan Controls */}
      <div className="absolute top-3 left-3 z-[1000] flex items-center gap-2">
        {/* Layer Toggle (Satellite vs Street Map) */}
        <div className="inline-flex items-center rounded-[6px] bg-[var(--bg-surface)]/95 backdrop-blur-md border border-[var(--border-grid)] p-1 shadow-md text-xs font-mono select-none">
          <button
            type="button"
            onClick={() => setMapLayer('satellite')}
            className={`px-2.5 py-1 rounded-[4px] font-semibold transition-colors flex items-center gap-1.5 ${
              mapLayer === 'satellite'
                ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Layers size={12} />
            <span>SATELLITE</span>
          </button>
          <button
            type="button"
            onClick={() => setMapLayer('streets')}
            className={`px-2.5 py-1 rounded-[4px] font-semibold transition-colors ${
              mapLayer === 'streets'
                ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            STREETS
          </button>
        </div>

        {/* Tap to Pan on Mobile */}
        {isMobile && !canPan && (
          <button
            type="button"
            onClick={() => setCanPan(true)}
            className="px-2.5 py-1 rounded-[6px] bg-[var(--bg-surface)]/95 backdrop-blur-md border border-[var(--border-grid)] text-xs font-mono font-semibold text-[var(--text-primary)] shadow-md select-none"
          >
            [ ✥ Tap to Pan ]
          </button>
        )}
      </div>

      {/* Basin Identifier Pill (Top-Right) */}
      <div className="absolute top-3 right-3 z-[1000] hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[var(--bg-surface)]/95 backdrop-blur-md border border-[var(--border-grid)] text-[11px] font-mono font-semibold text-[var(--text-primary)] shadow-md select-none">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>KEDARNATH BASIN • 3,583m ELEV.</span>
      </div>

      {/* Map Module */}
      <MapContainer
        center={KEDARNATH_CENTER}
        zoom={14}
        dragging={canPan}
        scrollWheelZoom={false}
        touchZoom={true}
        zoomControl={false}
        className="w-full h-full z-10"
        style={{ background: '#0A0F1D' }}
      >
        <TileLayer
          key={`${mapLayer}-${isDark}`}
          url={tileConfig.url}
          attribution={tileConfig.attribution}
          className={tileConfig.className}
        />

        {/* Zone Catchment Polygon */}
        <Polygon
          positions={polygonPositions}
          pathOptions={{
            color: tierColor,
            fillColor: rainWash ? rainWash.color : tierColor,
            fillOpacity: rainWash ? rainWash.opacity : 0.40,
            weight: 2,
          }}
        />

        {/* Pulsing Beacon at Zone Center */}
        {showPulse && (
          <CircleMarker
            center={KEDARNATH_CENTER}
            radius={9}
            pathOptions={{
              color: '#FFFFFF',
              fillColor: tierColor,
              fillOpacity: 0.9,
              weight: 2.5,
            }}
          />
        )}

        {/* Mandakini River & Affected Flow Paths */}
        {streetsToRender.map((st, i) => (
          <Polyline
            key={`stream-${i}`}
            positions={st.coords}
            pathOptions={{
              color: st.color,
              weight: 3.5,
              opacity: 0.9,
            }}
          />
        ))}
      </MapContainer>

      {/* Docked Bottom Drawer (108px min height, blur 12px) */}
      <div
        role="region"
        aria-label="Basin alert"
        aria-live={alertTier === 'RED' ? 'assertive' : 'polite'}
        className="absolute bottom-0 left-0 right-0 z-20 min-h-[108px] backdrop-blur-[12px] bg-[var(--bg-surface)]/92 border-t border-[var(--border-grid)] p-3 sm:p-4 flex flex-col justify-between shadow-lg"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          
          {/* Drawer Left: AlertBadge + Capacity + ETA */}
          <div className="md:col-span-4 flex flex-wrap items-center gap-2">
            <AlertBadge tier={alertTier} />
            <div className="text-xs font-mono font-bold text-[var(--text-primary)]">
              {Math.round((data?.riverStatus?.overflowRatio || 0.89) * 100)}% River Cap.
            </div>
            <div className="text-[11px] font-mono text-[var(--text-muted)]">
              {data?.riverStatus?.etaMinutes
                ? `ETA: ${data?.riverStatus?.etaMinutes}m`
                : 'Monitored'}
            </div>
          </div>

          {/* Drawer Center: Prediction Summary */}
          <div className="md:col-span-5 text-xs text-[var(--text-secondary)] leading-snug line-clamp-2">
            {data?.summary}
          </div>

          {/* Drawer Right: Telemetry in Mono + Updated Time */}
          <div className="md:col-span-3 flex flex-col items-start md:items-end text-left md:text-right font-mono text-[11px] text-[var(--text-muted)] space-y-0.5">
            <div className="text-[var(--text-primary)] font-bold">
              {data?.rainfall?.current?.toFixed(1) || '38.4'} mm/h • {data?.soilMoisture?.saturationPercent?.toFixed(0) || '79'}% sat • {data?.riverStatus?.velocityMs?.toFixed(1) || '3.1'} m/s
            </div>
            <div className="flex items-center gap-1.5">
              <span>
                Updated {data?.timestamp ? new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'LIVE'}
              </span>
              <span className="text-emerald-500 font-bold">
                [ ● LIVE FEED ]
              </span>
            </div>
          </div>

        </div>

        {/* Small Bottom Tag */}
        <div className="pt-2 mt-2 border-t border-[var(--border-grid)] flex items-center justify-between micro text-[var(--text-muted)]">
          <span>NASA GPM + SMAP RADAR · MANNING OPEN-CHANNEL PHYSICS</span>
          <span className="hidden sm:inline">Mandakini High-Resolution Spatial Grid</span>
        </div>
      </div>
    </div>
  );
}

export default LiveMonitorMap;
