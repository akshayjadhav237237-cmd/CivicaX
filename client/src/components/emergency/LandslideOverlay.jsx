import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import toast from 'react-hot-toast';
import api from '../../services/api';

// ─── constants ───────────────────────────────────────────────────────────────

const REFETCH_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

const STYLE_BY_RISK = {
  moderate: { color: '#FBBF24', weight: 4, dashArray: '8 4', opacity: 0.85 },
  high:     { color: '#F97316', weight: 5, dashArray: '6 3', opacity: 0.9  },
  critical: { color: '#EF4444', weight: 6, dashArray: '4 2', opacity: 1.0  },
};

const PULSE_CLASS  = 'civicax-landslide-critical';
const PULSE_CSS_ID = 'civicax-landslide-pulse-style';

// ─── helpers ─────────────────────────────────────────────────────────────────

function injectPulseStyle() {
  if (document.getElementById(PULSE_CSS_ID)) return;
  const style = document.createElement('style');
  style.id = PULSE_CSS_ID;
  style.textContent = `
@keyframes civicax-pulse-line {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
}
.${PULSE_CLASS} {
  animation: civicax-pulse-line 1.5s ease-in-out infinite;
}
  `.trim();
  document.head.appendChild(style);
}

function buildPopupHTML(seg) {
  const { roadName, slopeAngle, riskLevel, color, warningText } = seg;
  return `
<div style="min-width:160px;padding:4px">
  <b style="font-size:13px">${roadName}</b><br/>
  <span style="color:#64748b;font-size:12px">Slope: <b>${Number(slopeAngle).toFixed(1)}°</b></span><br/>
  <span style="font-size:11px;padding:2px 6px;border-radius:4px;background:${color};color:white">${String(riskLevel).toUpperCase()} RISK</span><br/>
  <span style="color:#475569;font-size:11px">${warningText}</span>
</div>
  `.trim();
}

// ─── component ───────────────────────────────────────────────────────────────

export default function LandslideOverlay({ zoneId }) {
  const map        = useMap();
  const layersRef  = useRef([]);
  const intervalRef = useRef(null);

  // Clears all previously drawn polylines from the map
  function clearLayers() {
    layersRef.current.forEach((layer) => {
      try { map.removeLayer(layer); } catch (_) { /* already removed */ }
    });
    layersRef.current = [];
  }

  async function fetchAndDraw() {
    if (!zoneId) return;

    try {
      const data = await api.get(`/emergency/flood-prediction/${zoneId}`);
      // api.js unwraps response.data, so `data` is already the response body
      const landslidRisk = data?.data?.latest?.landslidRisk ?? null;

      if (!landslidRisk) {
        clearLayers();
        return;
      }

      const segments = landslidRisk.riskSegments ?? [];
      if (segments.length === 0) {
        clearLayers();
        return;
      }

      // Inject pulse CSS once
      injectPulseStyle();

      // Remove stale layers before re-drawing
      clearLayers();

      segments.forEach((seg) => {
        const { coordinates, riskLevel } = seg;
        if (!Array.isArray(coordinates) || coordinates.length === 0) return;

        // Flip [lng, lat] → [lat, lng] for Leaflet
        const latlngs = coordinates.map(([lng, lat]) => [lat, lng]);

        const styleKey = String(riskLevel).toLowerCase();
        const style    = STYLE_BY_RISK[styleKey] ?? STYLE_BY_RISK.moderate;

        const polyline = L.polyline(latlngs, style).addTo(map);
        polyline.bindPopup(buildPopupHTML(seg));

        // Add pulse class to critical segments
        if (styleKey === 'critical') {
          // getElement() returns the SVG path element once rendered
          const el = polyline.getElement();
          if (el) {
            el.classList.add(PULSE_CLASS);
          } else {
            // Fallback: wait for the layer to be added to the DOM
            polyline.once('add', () => {
              const elem = polyline.getElement();
              if (elem) elem.classList.add(PULSE_CLASS);
            });
          }
        }

        layersRef.current.push(polyline);
      });
    } catch (err) {
      console.error('[LandslideOverlay] fetch error:', err);
      toast.error('Failed to load landslide risk data.');
    }
  }

  useEffect(() => {
    if (!zoneId) {
      clearLayers();
      return;
    }

    // Initial fetch
    fetchAndDraw();

    // Auto-refetch every 10 minutes
    intervalRef.current = setInterval(fetchAndDraw, REFETCH_INTERVAL_MS);

    return () => {
      clearLayers();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoneId]);

  return null;
}
