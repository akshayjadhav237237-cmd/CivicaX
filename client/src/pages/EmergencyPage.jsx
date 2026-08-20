import { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, GeoJSON, Popup, Marker, CircleMarker, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { ShieldAlert, AlertTriangle, RefreshCw, ArrowRight, Satellite } from 'lucide-react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useGeolocation } from '../hooks/useGeolocation';
import { useAlertStore } from '../stores/alertStore';
import api from '../services/api';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassButton } from '../components/ui/GlassButton';
import { GlassBadge } from '../components/ui/GlassBadge';
import { GlassModal } from '../components/ui/GlassModal';
import { FloodRiskPanel } from '../components/FloodRiskPanel';
// ── Flood Intelligence Layer ────────────────────────────────────────────────
import ETACountdownBanner    from '../components/emergency/ETACountdownBanner';
import { FloodPredictionPanel }  from '../components/emergency/FloodPredictionPanel';
import { FloodHistoryChart }     from '../components/emergency/FloodHistoryChart';
import FloodStreetOverlay    from '../components/emergency/FloodStreetOverlay';
import LandslideOverlay      from '../components/emergency/LandslideOverlay';
import { ZonePolygons }          from '../components/emergency/ZonePolygons';
import { MapLayerControls }      from '../components/emergency/MapLayerControls';
import { initFloodAlertNotifier } from '../services/floodAlertNotifier';
import CCTVConfirmationPanel from '../components/emergency/CCTVConfirmationPanel';
import HyperlocalAlert from '../components/emergency/HyperlocalAlert';

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}

// Fix Leaflet default icon path issues
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Component to pan/zoom map to show full drawn route
function MapFitBounds({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (positions && positions.length > 1) {
      const bounds = positions.reduce((b, [lat, lng]) => b.extend([lat, lng]), L.latLngBounds(positions[0], positions[0]));
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
    }
  }, [positions, map]);
  return null;
}

// Quick street-level selector buttons / pills
const STREET_SELECTOR_PILLS = [
  {
    id: 'zone-mandakini-ghat-001',
    label: '📍 Temple Ghat Road',
    badge: 'Red: 1.85m',
    level: 'red',
    coords: [30.7347, 79.0668],
    zoom: 17,
  },
  {
    id: 'zone-temple-bazaar-002',
    label: '📍 Bazaar Marg',
    badge: 'Orange: 0.75m',
    level: 'orange',
    coords: [30.7354, 79.0656],
    zoom: 17,
  },
  {
    id: 'zone-saraswati-bridge-003',
    label: '📍 Saraswati Bridge',
    badge: 'Yellow: 0.30m',
    level: 'yellow',
    coords: [30.7333, 79.0678],
    zoom: 17,
  },
  {
    id: 'zone-rambara-bridge-005',
    label: '📍 Rambara Bridge',
    badge: 'Red: 1.20m',
    level: 'red',
    coords: [30.6975, 79.0495],
    zoom: 17,
  },
  {
    id: 'zone-gaurikund-kund-007',
    label: '📍 Gaurikund Kund',
    badge: 'Orange: 0.50m',
    level: 'orange',
    coords: [30.6518, 79.0276],
    zoom: 17,
  },
  {
    id: 'zone-upper-helipad-004',
    label: '📍 Helipad Safe Haven',
    badge: 'Green: Safe',
    level: 'green',
    coords: [30.7377, 79.0643],
    zoom: 17,
  },
];

// Component to handle dynamic map centering at street level
function MapUpdater({ center, zoom = 16.5 }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { animate: true, duration: 1.2 });
  }, [center, zoom, map]);
  return null;
}

import { useSearchParams } from 'react-router-dom';

export function EmergencyPage() {
  const [searchParams] = useSearchParams();
  const { location, isLoading: isLocLoading } = useGeolocation();
  const { zones, activeAlerts, fetchZones, fetchActiveAlerts, isLoadingZones } = useAlertStore();
  
  const [safeZones, setSafeZones] = useState([]);
  const [floodZones, setFloodZones] = useState(null);    // GeoJSON FeatureCollection for street-level flood layer
  const [socket, setSocket] = useState(null);            // Socket.io client instance for FloodRiskPanel
  const [selectedZoneId, setSelectedZoneId] = useState('zone-mandakini-ghat-001'); // default to Kedarnath Mandakini Ghat micro-zone
  const [floodPrediction, setFloodPrediction] = useState(null);      // latest prediction for ETA banner
  const [mapCenter, setMapCenter] = useState([30.7347, 79.0668]);    // Street-level center: Mandakini Riverfront Ghat Road
  const [mapZoom, setMapZoom] = useState(16.5);                       // Street-level zoom
  const [mapLayers, setMapLayers] = useState({
    floodStreets: true, landslideRisk: true, alertZones: true, safeZones: true, activeAlerts: true,
  });

  const [selectedAlert, setSelectedAlert] = useState(null);
  const [zoneDetails, setZoneDetails] = useState(null);
  const [evacRoute, setEvacRoute] = useState(null);
  const [isRoutingLoading, setIsRoutingLoading] = useState(false);

  // Auto focus zone or alert from URL query params
  useEffect(() => {
    const zoneParam = searchParams.get('zone');
    const alertParam = searchParams.get('alert');

    if (zoneParam) {
      const zoneCoordsMap = {
        'zone-mandakini-ghat-001': [30.7347, 79.0668],
        'zone-temple-bazaar-002': [30.7354, 79.0656],
        'zone-saraswati-bridge-003': [30.7333, 79.0678],
        'zone-upper-helipad-004': [30.7377, 79.0643],
        'zone-rambara-bridge-005': [30.6975, 79.0495],
        'zone-lincholi-track-006': [30.7120, 79.0560],
        'zone-gaurikund-kund-007': [30.6518, 79.0276],
        'zone-gaurikund-bus-008': [30.6498, 79.0258],
        'zone-sonprayag-bay-009': [30.6315, 79.0322],
        'zone-kedarnath-001': [30.7347, 79.0668],
        'kedarnath': [30.7347, 79.0668],
        'chorabari': [30.7347, 79.0668],
        'mandakini-ghat': [30.7347, 79.0668],
        'temple-bazaar': [30.7354, 79.0656],
        'bazaar-marg': [30.7354, 79.0656],
        'saraswati-bridge': [30.7333, 79.0678],
        'helipad': [30.7377, 79.0643],
        'upper-helipad': [30.7377, 79.0643],
        'zone-rambara-002': [30.6975, 79.0495],
        'rambara': [30.6975, 79.0495],
        'zone-gaurikund-003': [30.6518, 79.0276],
        'gaurikund': [30.6518, 79.0276],
        'gaurikund-kund': [30.6518, 79.0276],
        'gaurikund-bus': [30.6498, 79.0258],
        'zone-guptkashi-004': [30.5228, 79.0781],
        'guptkashi': [30.5228, 79.0781],
        'zone-sonprayag-004': [30.6315, 79.0322],
        'sonprayag': [30.6315, 79.0322],
        'sonprayag-bay': [30.6315, 79.0322],
      };

      if (zoneCoordsMap[zoneParam.toLowerCase()]) {
        setSelectedZoneId(zoneParam);
        setMapCenter(zoneCoordsMap[zoneParam.toLowerCase()]);
        setMapZoom(16.5);
      }

      if (zones.length > 0) {
        const match = zones.find(z => z.properties?.id === zoneParam || z.properties?.name?.toLowerCase().includes(zoneParam.toLowerCase()));
        if (match) {
          setSelectedZoneId(match.properties?.id);
          const coords = match.geometry?.coordinates?.[0];
          if (coords && coords.length > 0) {
            const lat = Array.isArray(coords[0]) ? coords[0][1] : coords[1];
            const lng = Array.isArray(coords[0]) ? coords[0][0] : coords[0];
            setMapCenter([lat, lng]);
            setMapZoom(16.5);
          }
        }
      }
    }

    if (alertParam && activeAlerts.length > 0) {
      const match = activeAlerts.find(a => a.id === alertParam || a.zoneId === alertParam);
      if (match) {
        setSelectedAlert(match);
        if (match.zoneId) setSelectedZoneId(match.zoneId);
      }
    }
  }, [searchParams, zones, activeAlerts]);

  // Fetch real driving route from OSRM
  // IMPORTANT: OSRM requires coordinates as lng,lat NOT lat,lng!
  const fetchEvacRoute = useCallback(async (fromLat, fromLng, toLat, toLng) => {
    setIsRoutingLoading(true);
    setEvacRoute(null);
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;
      console.log('[OSRM] Requesting route:', url);
      const res = await fetch(url);
      const data = await res.json();
      console.log('[OSRM] Response code:', data.code);
      if (data.code !== 'Ok' || !data.routes?.[0]) {
        toast.error('Route unavailable — please check your connection');
        setEvacRoute([[fromLat, fromLng], [toLat, toLng]]);
        return;
      }
      // GeoJSON coordinates come as [lng, lat] — flip to [lat, lng] for Leaflet
      const latLngs = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
      setEvacRoute(latLngs);
    } catch (err) {
      console.error('[OSRM] Error:', err);
      toast.error('Route unavailable — please check your connection');
      setEvacRoute([[fromLat, fromLng], [toLat, toLng]]);
    } finally {
      setIsRoutingLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchPopulationEstimate = async () => {
      if (selectedAlert) {
        try {
          const response = await api.get(`/emergency/population-estimate?zoneId=${selectedAlert.zoneId}`);
          const data = response.data?.data || response.data;
          setZoneDetails(data);
        } catch (err) {
          console.error(err);
        }
      } else {
        setZoneDetails(null);
      }
    };
    fetchPopulationEstimate();
  }, [selectedAlert]);



  useEffect(() => {
    fetchZones();
    fetchActiveAlerts();
    
    // Fetch safe zones
    const fetchSafeZones = async () => {
      try {
        const response = await api.get('/emergency/safe-zones');
        const data = response.data?.data || response.data || [];
        setSafeZones(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load safe zones', err);
      }
    };
    fetchSafeZones();

    // Fetch flood zone street segments for map layer
    const fetchFloodZones = async () => {
      try {
        const response = await api.get('/emergency/flood-zones');
        const data = response.data?.data || response.data || {};
        if (data?.features?.length > 0) {
          setFloodZones(data);
        }
      } catch (err) {
        console.error('Failed to load flood zones', err);
      }
    };
    fetchFloodZones();

    // Get socket instance for FloodRiskPanel WebSocket updates
    let cleanup;
    try {
      const API_BASE = (import.meta.env.VITE_WS_URL || 'https://civicax-production.up.railway.app').trim();
      const s = io(API_BASE, { transports: ['websocket', 'polling'] });
      setSocket(s);
      // Keep flood zones fresh on live zone updates
      s.on('zone:flood-level', async () => {
        try {
          const response = await api.get('/emergency/flood-zones');
          const data = response.data?.data || response.data || {};
          if (data?.features?.length > 0) setFloodZones(data);
        } catch {}
      });
      // Update floodPrediction state for ETA banner
      s.on('zone:flood-prediction', (pred) => {
        if (pred.zoneId === selectedZoneId) setFloodPrediction(pred);
      });
      // Initialize browser push notifications
      const notifierCleanup = initFloodAlertNotifier(s);
      cleanup = () => { s.disconnect(); notifierCleanup(); };
    } catch (e) {
      console.warn('[EmergencyPage] Socket setup failed:', e.message);
    }
    return () => { if (cleanup) cleanup(); };
  }, [fetchZones, fetchActiveAlerts]);



  if (isLocLoading || isLoadingZones) {
    return <div className="h-full flex items-center justify-center">Loading Emergency System...</div>;
  }

  return (
    <div className="flex flex-col gap-0">
      {/* ETA Countdown Banner — only shows when river is overflowing with ≤30 min ETA */}
      <ETACountdownBanner prediction={floodPrediction} />
    <div className="flex flex-col lg:flex-row gap-6 h-auto lg:h-[calc(100vh-140px)] lg:min-h-[600px] pb-16 lg:pb-0">
      
      {/* Sidebar Panel */}
      <div className="w-full lg:w-[400px] flex flex-col gap-6 order-2 lg:order-1 overflow-y-visible lg:overflow-y-auto pr-2 no-scrollbar">
        
        {/* Active Alerts List */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>Active Threats</h2>
            <GlassBadge level="info" label={`${activeAlerts.length} Active`} />
          </div>
          
          <div className="flex flex-col gap-4">
            {activeAlerts.length === 0 ? (
              <GlassCard padding="p-6" className="text-center border-green-200 dark:border-green-800/40 bg-green-50/50 dark:bg-green-950/20">
                <ShieldAlert size={32} className="mx-auto text-green-500 mb-2" />
                <h3 className="font-semibold text-green-800 dark:text-green-300">All Clear</h3>
                <p className="text-sm text-green-700 dark:text-green-400 mt-1">No active emergency alerts in your region.</p>
              </GlassCard>
            ) : (
              activeAlerts.map(alert => (
                <GlassCard key={alert.id} padding="p-5" className={`border-l-4 ${alert.level === 'red' ? 'border-l-red-500' : alert.level === 'orange' ? 'border-l-orange-500' : 'border-l-yellow-500'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <GlassBadge level={alert.level} />
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">{new Date(alert.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base mb-1" style={{ fontFamily: 'var(--font-heading)' }}>{alert.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-3 line-clamp-2">{alert.description}</p>
                  
                  {alert.evacuationOrder && (
                    <div className="bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs font-bold px-3 py-2 rounded-lg border border-red-200 dark:border-red-800/40 flex items-center gap-2 mb-3 animate-pulse">
                      <AlertTriangle size={14} /> MANDATORY EVACUATION
                    </div>
                  )}
                  
                  <GlassButton size="sm" variant="ghost" className="w-full justify-between group" onClick={() => {
                    setSelectedAlert(alert);
                    if (alert.zoneId) setSelectedZoneId(alert.zoneId);
                  }}>
                    View Zone Details <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </GlassButton>
                </GlassCard>
              ))
            )}
          </div>
          
          <div className="mt-4">
            <HyperlocalAlert 
              onEvacuate={(fromLat, fromLng, safeZone) => fetchEvacRoute(fromLat, fromLng, safeZone.latitude, safeZone.longitude)} 
              safeZones={safeZones} 
            />
          </div>
        </section>

        {/* Satellite Intelligence Panel */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Satellite size={16} className="text-indigo-500" />
            <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>Flood Intelligence</h2>
          </div>
          <GlassCard padding="p-5">
            <FloodRiskPanel socket={socket} />
          </GlassCard>
        </section>

        {/* Flood Prediction Panel (new) */}
        <section>
          <FloodPredictionPanel
            zoneId={selectedZoneId}
            zoneName={selectedZoneId}
            onPredictionLoad={(pred) => setFloodPrediction(pred)}
          />
          {floodPrediction?.history?.length > 0 && (
            <GlassCard padding="p-4" className="mt-3">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Trend (last 6 predictions)</p>
              <FloodHistoryChart history={floodPrediction.history} />
            </GlassCard>
          )}
        </section>

        {/* CCTV Confirmation Panel */}
        <section>
          <CCTVConfirmationPanel alertLevel={floodPrediction?.alertLevel} />
        </section>

      </div>

      {/* Main Map Container */}
      <div className="w-full h-[500px] lg:h-full flex-1 rounded-2xl overflow-hidden border border-slate-200/60 dark:border-slate-800 shadow-[0_8px_32px_rgba(31,38,135,0.08)] relative z-0 order-1 lg:order-2">
        
        {/* Quick Street-Level Micro-Zone Selector Toolbar — Top Left Floating Bar */}
        <div className="absolute top-3 left-3 z-[1000] flex items-center gap-1.5 flex-wrap max-w-[calc(100%-120px)] bg-slate-900/85 dark:bg-slate-950/90 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-white/15 shadow-xl">
          <div className="flex items-center gap-1.5 pr-1 border-r border-slate-700/60">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-200 hidden sm:inline" style={{ fontFamily: 'var(--font-heading)' }}>
              Street Zones:
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap overflow-x-auto no-scrollbar py-0.5">
            {STREET_SELECTOR_PILLS.map((pill) => {
              const isSelected = selectedZoneId === pill.id;
              const badgeColors = {
                red: 'bg-red-500/25 text-red-300 border-red-500/50',
                orange: 'bg-orange-500/25 text-orange-300 border-orange-500/50',
                yellow: 'bg-yellow-500/25 text-yellow-300 border-yellow-500/50',
                green: 'bg-emerald-500/25 text-emerald-300 border-emerald-500/50',
              };
              return (
                <button
                  key={pill.id}
                  onClick={() => {
                    setSelectedZoneId(pill.id);
                    setMapCenter(pill.coords);
                    setMapZoom(pill.zoom || 17);
                  }}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                    isSelected
                      ? 'bg-white text-slate-950 shadow-lg border-white scale-[1.03]'
                      : 'bg-slate-800/80 text-slate-200 hover:bg-slate-700 border-slate-700/60 hover:border-slate-500'
                  }`}
                  title={`Fly directly to ${pill.label} (${pill.badge})`}
                >
                  <span className="whitespace-nowrap">{pill.label}</span>
                  <span
                    className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded border whitespace-nowrap ${
                      isSelected
                        ? (pill.level === 'red' ? 'bg-red-100 text-red-700 border-red-300' : pill.level === 'orange' ? 'bg-orange-100 text-orange-700 border-orange-300' : pill.level === 'yellow' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' : 'bg-emerald-100 text-emerald-800 border-emerald-300')
                        : (badgeColors[pill.level] || badgeColors.green)
                    }`}
                  >
                    {pill.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <MapContainer 
          center={mapCenter} 
          zoom={16} 
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            className="map-tiles"
          />
          <MapUpdater center={mapCenter} zoom={mapZoom} />
          
          {/* Flood Zone Street-Level Layer */}
          {floodZones && floodZones.features && floodZones.features.length > 0 && (
            <GeoJSON
              key={`flood-zones-${Date.now()}`}
              data={floodZones}
              style={(feature) => {
                const level = feature.properties?.riskLevel || 'green';
                const depthColors = {
                  red:    { color: '#ef4444', weight: 5, opacity: 0.85 },
                  orange: { color: '#f97316', weight: 4, opacity: 0.75 },
                  yellow: { color: '#eab308', weight: 3, opacity: 0.65 },
                  green:  { color: '#22c55e', weight: 2, opacity: 0.40 },
                };
                return depthColors[level] || depthColors.green;
              }}
            >
              <Popup>
                {(layer) => {
                  const p = layer?.feature?.properties || {};
                  return (
                    <div style={{ minWidth: 180, padding: 4 }}>
                      <p style={{ fontWeight: 700, marginBottom: 4 }}>{p.name || p.highway || 'Road Segment'}</p>
                      <p style={{ fontSize: 12, color: '#64748b' }}>Water depth: <b>{p.waterDepthM?.toFixed(2) ?? '--'} m</b></p>
                      <p style={{ fontSize: 12, color: '#64748b' }}>Flow: {p.flowDirection || '--'}</p>
                      <p style={{ fontSize: 12, color: '#64748b' }}>Risk score: {p.riskScore ?? '--'}/100</p>
                    </div>
                  );
                }}
              </Popup>
            </GeoJSON>
          )}

          {/* Geofenced Zones — flood-aware, WebSocket-updated */}
          {mapLayers.alertZones && (
            <ZonePolygons
              zones={zones}
              socket={socket}
              onSelectZone={(props) => {
                if (props.id) setSelectedZoneId(props.id);
                if (props.centerLat && props.centerLng) {
                  setMapCenter([props.centerLat, props.centerLng]);
                  setMapZoom(17);
                }
              }}
            />
          )}

          {/* Flood Street Overlay */}
          {mapLayers.floodStreets && <FloodStreetOverlay zoneId={selectedZoneId} />}

          {/* Landslide Risk Overlay */}
          {mapLayers.landslideRisk && <LandslideOverlay zoneId={selectedZoneId} />}

          {/* User Location Marker */}
          <Marker position={[location.lat, location.lng]}>
            <Popup>
              <div className="text-center font-semibold">Your Location</div>
            </Popup>
          </Marker>

          {/* Safe Zones (Relief Camps) */}
          {safeZones.map(sz => (
            <CircleMarker 
              key={sz.id} 
              center={[sz.latitude, sz.longitude]}
              radius={8}
              pathOptions={{
                color: sz.status === 'activated' ? '#22C55E' : '#3B82F6',
                fillColor: sz.status === 'activated' ? '#22C55E' : '#3B82F6',
                fillOpacity: 0.8,
                weight: 2
              }}
            >
              <Popup>
                <div className="p-1 min-w-[200px]">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">{sz.name}</h3>
                    <GlassBadge 
                      level={sz.status === 'activated' ? 'safe' : sz.status === 'at_capacity' ? 'critical' : 'info'} 
                      label={(sz?.status || '').replace(/_/g, ' ')} 
                    />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 capitalize">{(sz?.type || '').replace(/_/g, ' ')}</p>
                  <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded text-xs text-slate-700 dark:text-slate-200">
                    <span className="font-semibold">Capacity:</span> {sz.capacity} persons
                  </div>
                  {sz.status === 'activated' && (
                    <GlassButton size="sm" variant="primary" className="w-full mt-3 h-8 py-0" onClick={() => {
                      fetchEvacRoute(location.lat, location.lng, sz.latitude, sz.longitude);
                    }}>
                      {isRoutingLoading ? 'Calculating...' : 'Route Here'}
                    </GlassButton>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          ))}
          
          {/* Evacuation Route Polyline */}
          {evacRoute && (
             <Polyline positions={evacRoute} color="#3B82F6" weight={5} opacity={0.8} />
          )}
          {/* Fit map to route when drawn */}
          {evacRoute && <MapFitBounds positions={evacRoute} />}
        </MapContainer>
        
        {/* Map Layer Toggle Controls — top right */}
        <div className="absolute top-4 right-4 z-[1000]">
          <MapLayerControls onChange={setMapLayers} />
        </div>

        {/* Map Legend — bottom right */}
        <div className="absolute bottom-4 right-4 z-[1000] flex flex-col gap-2">
           <GlassCard padding="p-3" className="text-xs bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 shadow-lg">
             <div className="font-bold mb-2">Map Legend</div>
             <div className="flex items-center gap-2 mb-1.5"><div className="w-3 h-3 rounded bg-red-400 opacity-80"></div> Red Alert Zone</div>
             <div className="flex items-center gap-2 mb-1.5"><div className="w-3 h-3 rounded bg-orange-400 opacity-80"></div> Orange Watch Zone</div>
             <div className="flex items-center gap-2 mb-1.5"><div className="w-3 h-3 rounded-full bg-green-500"></div> Active Relief Camp</div>
             <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div> Standby Shelter</div>
           </GlassCard>
        </div>
      </div>

      {/* Zone Details Modal */}
      {selectedAlert && (
        <GlassModal isOpen={!!selectedAlert} onClose={() => setSelectedAlert(null)} title="Emergency Zone Details" size="md">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
                {selectedAlert.zone?.name || 'Unknown Zone'}
              </h3>
              <GlassBadge level={selectedAlert.level} />
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Alert Notice</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">{selectedAlert.description}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-800/40 rounded-xl p-4">
                <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide mb-1">Est. Population</p>
                <p className="text-xl font-bold text-blue-900 dark:text-blue-100">{zoneDetails ? zoneDetails.estimatedPopulation.toLocaleString() : 'Loading...'}</p>
                {zoneDetails && <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-1">Area: {zoneDetails.areaKm2} km²</p>}
              </div>
              <div className="bg-orange-50/70 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-800/40 rounded-xl p-4">
                <p className="text-xs font-semibold text-orange-700 dark:text-orange-300 uppercase tracking-wide mb-1">Evacuation</p>
                <p className="text-sm font-bold text-orange-900 dark:text-orange-100">{selectedAlert.evacuationOrder ? 'MANDATORY' : 'Voluntary'}</p>
              </div>
            </div>
            
            <h4 className="font-bold text-slate-800 dark:text-slate-100 mt-2" style={{ fontFamily: 'var(--font-heading)' }}>Nearest Safe Zones</h4>
            <div className="flex flex-col gap-2 max-h-[150px] overflow-y-auto pr-2">
              {(() => {
                // Approximate zone center for distance
                let zLng = location.lng, zLat = location.lat;
                try {
                  const c = selectedAlert.zone.geojson.coordinates[0][0];
                  zLng = c[0]; zLat = c[1];
                } catch {}
                
                const sorted = [...safeZones].map(sz => ({
                  ...sz, 
                  dist: getDistance(zLat, zLng, sz.latitude, sz.longitude)
                })).sort((a,b) => a.dist - b.dist).slice(0, 3);
                
                if (sorted.length === 0) return <p className="text-sm text-slate-500">No safe zones available.</p>;
                
                return sorted.map(sz => (
                  <div key={sz.id} className="flex items-center justify-between border border-slate-200 dark:border-slate-700 rounded-lg p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{sz.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{sz.dist.toFixed(1)} km away • Capacity: {sz.capacity}</p>
                    </div>
                    <GlassButton 
                      size="sm" 
                      variant={sz.status === 'activated' ? 'primary' : 'ghost'} 
                      disabled={sz.status !== 'activated' || isRoutingLoading}
                      onClick={() => {
                        fetchEvacRoute(zLat, zLng, sz.latitude, sz.longitude);
                        setSelectedAlert(null);
                      }}
                    >
                      {sz.status === 'activated' ? 'Draw Route' : 'Inactive'}
                    </GlassButton>
                  </div>
                ));
              })()}
            </div>
            
            <div className="flex justify-end mt-2 pt-4 border-t border-slate-200 dark:border-slate-700">
               <GlassButton variant="ghost" onClick={() => setSelectedAlert(null)}>Close</GlassButton>
            </div>
          </div>
        </GlassModal>
      )}
    </div>
    </div>
  );
}
