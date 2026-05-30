import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import toast from 'react-hot-toast';
import api from '../../services/api';

const STYLE_BY_LEVEL = {
  watch: {
    color: '#FBBF24',
    weight: 4,
    opacity: 0.8,
  },
  warning: {
    color: '#F97316',
    weight: 5,
    opacity: 0.9,
  },
  danger: {
    color: '#EF4444',
    weight: 6,
    opacity: 1.0,
  },
  critical: {
    color: '#7F1D1D',
    weight: 8,
    opacity: 1.0,
    dashArray: '10 5',
  },
};

const REFETCH_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

function buildPopupHtml(street) {
  const { streetName, waterDepthM, level, color, fillTimeMinutes } = street;
  return `
    <div style="min-width:160px;padding:4px">
      <b style="font-size:13px">${streetName}</b><br/>
      <span style="color:#64748b;font-size:12px">Water depth: <b>${waterDepthM.toFixed(2)} m</b></span><br/>
      <span style="font-size:11px;padding:2px 6px;border-radius:4px;background:${color};color:white">${level.toUpperCase()}</span><br/>
      <span style="color:#64748b;font-size:12px">Fills in: ${fillTimeMinutes.toFixed(0)} min</span>
    </div>
  `.trim();
}

export default function FloodStreetOverlay({ zoneId }) {
  const map = useMap();
  const layersRef = useRef([]);
  const intervalRef = useRef(null);

  function clearLayers() {
    layersRef.current.forEach((layer) => {
      try {
        map.removeLayer(layer);
      } catch (_) {
        // layer may already be gone
      }
    });
    layersRef.current = [];
  }

  async function fetchAndRender() {
    if (!zoneId) return;

    try {
      const response = await api.get(`/emergency/flood-prediction/${zoneId}`);
      const latest = response?.data?.latest ?? response?.latest;

      const urbanImpact = latest?.urbanImpact;
      if (!urbanImpact) {
        clearLayers();
        return;
      }

      const affectedStreets = urbanImpact.affectedStreets ?? [];

      // Clear previous layers before drawing new ones
      clearLayers();

      affectedStreets.forEach((street) => {
        const { coordinates, level } = street;
        if (!coordinates || coordinates.length < 2) return;

        // Flip [lng, lat] → [lat, lng] for Leaflet
        const latLngs = coordinates.map(([lng, lat]) => [lat, lng]);

        const styleKey = level?.toLowerCase();
        const style = STYLE_BY_LEVEL[styleKey] ?? STYLE_BY_LEVEL.watch;

        const polyline = L.polyline(latLngs, style).bindPopup(
          buildPopupHtml(street),
          { maxWidth: 220 }
        );

        polyline.addTo(map);
        layersRef.current.push(polyline);
      });
    } catch (err) {
      console.error('[FloodStreetOverlay] fetch error:', err);
      toast.error('Failed to load flood street data.');
    }
  }

  useEffect(() => {
    if (!zoneId) return;

    fetchAndRender();

    intervalRef.current = setInterval(fetchAndRender, REFETCH_INTERVAL_MS);

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
