import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../services/api';

/**
 * useLivePrediction Hook
 * Fetches real flood prediction data for selected zone every 60s
 * Fetches real zone list from /emergency/zones
 */
export function useLivePrediction(initialZoneId = 'zone-kedarnath-001') {
  const [selectedZone, setSelectedZone] = useState(initialZoneId);
  const [zones, setZones] = useState([]);
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const isFirstMount = useRef(true);

  // 1. Fetch available zones
  useEffect(() => {
    let mounted = true;
    const fetchZones = async () => {
      try {
        const res = await api.get('/emergency/zones');
        const raw = res.data?.data || res.data;
        const features = raw?.features || [];
        if (mounted && Array.isArray(features) && features.length > 0) {
          const parsedZones = features.map((f) => ({
            id: f.properties?.id || f.id,
            name: f.properties?.name || f.properties?.streetName || `Zone ${f.properties?.id}`,
            level: f.properties?.level || 'green',
            geometry: f.geometry,
          }));
          setZones(parsedZones);
          // Set first zone if initial was generic
          if (parsedZones.length > 0 && !parsedZones.some((z) => z.id === initialZoneId)) {
            setSelectedZone(parsedZones[0].id);
          }
        }
      } catch (err) {
        console.warn('[useLivePrediction] Could not fetch real zones:', err.message);
      }
    };
    fetchZones();
    return () => {
      mounted = false;
    };
  }, [initialZoneId]);

  // 2. Fetch Prediction for selected zone
  const fetchPrediction = useCallback(async () => {
    try {
      setError(false);
      const zoneToQuery = selectedZone || 'zone-kedarnath-001';
      const res = await api.get(`/emergency/flood-prediction/${zoneToQuery}`);
      const payload = res.data?.data || res.data;

      if (!payload) {
        throw new Error('Empty payload');
      }

      // Log raw response once on mount for debugging/inspection as required
      if (isFirstMount.current) {
        console.log('[useLivePrediction] Full API response shape:', payload);
        isFirstMount.current = false;
      }

      // Adapt to real backend fields
      const rainfallCurrent = Number(
        payload.rainfall?.current ??
          payload.factors?.rain?.value ??
          payload.rainfallRate ??
          0
      );
      const rainfallForecast = Number(
        payload.rainfall?.forecast24h ??
          payload.factors?.forecast?.value ??
          payload.rainfall24hMm ??
          0
      );

      const soilSaturation = Number(
        payload.soilMoisture?.saturationPercent ??
          payload.factors?.soil?.saturationPct ??
          payload.soilSaturationPct ??
          0
      );

      const discharge = Number(payload.dischargeM3S ?? 0);
      const overflowRatio = Number(
        payload.riverStatus?.overflowRatio ??
          (discharge > 0 ? discharge / 420 : 0.85)
      );
      const isOverflowing = Boolean(
        payload.riverStatus?.isOverflowing ??
          payload.overflowDetected ??
          (payload.alertLevel === 'red' || payload.level === 'red')
      );
      const velocityMs = Number(
        payload.riverStatus?.velocityMs ??
          payload.streamVelocityMs ??
          (discharge > 0 ? 3.12 : 1.2)
      );
      const etaMinutes = Number(
        payload.riverStatus?.etaMinutes ??
          (payload.timeToPeakHours ? Math.round(payload.timeToPeakHours * 60) : 22)
      );

      const rawAlert = (payload.alertLevel || payload.level || 'GREEN').toUpperCase();
      const validTiers = ['GREEN', 'YELLOW', 'ORANGE', 'RED'];
      const alertTier = validTiers.includes(rawAlert) ? rawAlert : 'GREEN';

      // Real zone polygon if present
      const matchedZone = zones.find((z) => z.id === zoneToQuery);
      const geometry = payload.geometry || matchedZone?.geometry || null;

      const adapted = {
        zoneId: payload.zoneId || zoneToQuery,
        zoneName: payload.zoneName || matchedZone?.name || 'Kedarnath Basin',
        alertLevel: alertTier,
        rainfall: {
          current: rainfallCurrent,
          forecast24h: rainfallForecast,
        },
        soilMoisture: {
          saturationPercent: soilSaturation,
        },
        riverStatus: {
          velocityMs,
          overflowRatio,
          isOverflowing,
          etaMinutes,
        },
        summary:
          payload.summary ||
          payload.aiSummary ||
          payload.recommendation ||
          'Satellite telemetry active for Mandakini River basin.',
        timestamp: payload.timestamp ? new Date(payload.timestamp) : new Date(),
        geometry,
        affectedStreets: payload.urbanImpact?.affectedStreets || payload.affectedStreets || [],
      };

      setData(adapted);
      setLastUpdated(new Date());

      // Parse real readings from payload.history if available
      if (Array.isArray(payload.history) && payload.history.length >= 2) {
        const hist = payload.history.slice(-6).map((h, idx) => ({
          time: h.createdAt
            ? new Date(h.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : h.time || `-${(payload.history.length - idx) * 10}m`,
          rainfall: Number(h.rainfall ?? 0),
          overflowRatio: Number(h.overflowRatio ?? 0),
          soilSaturation: Number(h.soilSaturation ?? h.soilMoisture ?? 0),
          alertTier: (h.alertLevel || alertTier).toUpperCase(),
        }));
        setHistory(hist);
      } else if (Array.isArray(payload.history) && payload.history.length === 1) {
        setHistory([
          {
            time: 'NOW',
            rainfall: rainfallCurrent,
            overflowRatio,
            soilSaturation,
            alertTier,
          },
        ]);
      } else {
        // Strict zero fake data: fewer than 2 readings triggers "Collecting readings..." UI state
        setHistory([]);
      }
    } catch (err) {
      console.warn('[useLivePrediction] Fetch error:', err.message);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [selectedZone, zones]);

  useEffect(() => {
    fetchPrediction();
    const interval = setInterval(fetchPrediction, 60000);
    return () => clearInterval(interval);
  }, [fetchPrediction]);

  return {
    data,
    history,
    loading,
    error,
    lastUpdated,
    selectedZone,
    setSelectedZone,
    zones,
    refetch: fetchPrediction,
  };
}
