import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { ShieldAlert, AlertTriangle, Crosshair, MapPin, Truck, HelpCircle, Activity } from 'lucide-react';
import api from '../../services/api';
import FloodStreetOverlay from '../emergency/FloodStreetOverlay';
import LandslideOverlay from '../emergency/LandslideOverlay';
import { ZonePolygons } from '../emergency/ZonePolygons';

// Fix Leaflet Vite marker path issue
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Custom Icons for specialized map symbols
const sosIcon = L.divIcon({
  className: 'custom-sos-icon',
  html: `<div class="relative flex h-6 w-6">
    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
    <span class="relative inline-flex rounded-full h-6 w-6 bg-red-600 border border-white flex items-center justify-center text-[10px] text-white font-bold font-sans">SOS</span>
  </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const dispatchIcon = L.divIcon({
  className: 'custom-dispatch-icon',
  html: `<div class="relative flex h-6 w-6">
    <span class="relative inline-flex rounded-full h-6 w-6 bg-blue-500 border border-white flex items-center justify-center text-[10px] text-white font-bold font-sans">🚒</span>
  </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const closureIcon = L.divIcon({
  className: 'custom-closure-icon',
  html: `<div class="relative flex h-6 w-6">
    <span class="relative inline-flex rounded-full h-6 w-6 bg-orange-600 border border-white flex items-center justify-center text-[10px] text-white font-bold font-sans">⚠️</span>
  </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

export function GovernmentSituationMap({ socket }) {
  const defaultCenter = [30.735, 79.067]; // Kedarnath Centroid
  
  const [layers, setLayers] = useState({
    floodStreets: true,
    landslideRisk: true,
    zoneRisk: true,
    safeZones: true,
    activeAlerts: true,
    dispatchUnits: true,
    sosPanic: true,
    roadClosures: true
  });

  const [activeAlerts, setActiveAlerts] = useState([]);
  const [safeZones, setSafeZones] = useState([]);
  const [dispatches, setDispatches] = useState([]);
  const [sosSignals, setSosSignals] = useState([]);
  const [roadClosures, setRoadClosures] = useState([]);
  const [floodStreetsData, setFloodStreetsData] = useState(null);

  const fetchMapData = async () => {
    try {
      // 1. Fetch active alerts
      const alertsRes = await api.get('/emergency/alerts/active');
      setActiveAlerts(alertsRes.data?.data || []);

      // 2. Fetch safe zones
      const safeZonesRes = await api.get('/emergency/safe-zones');
      setSafeZones(safeZonesRes.data?.data || []);

      // 3. Fetch dispatches
      const dispatchesRes = await api.get('/government/dispatches');
      setDispatches(dispatchesRes.data?.data || []);

      // 4. Fetch active SOS signals
      const sosRes = await api.get('/sos/active');
      setSosSignals(sosRes.data?.data || []);

      // 5. Fetch road closures
      const closuresRes = await api.get('/roads/closures');
      setRoadClosures(closuresRes.data?.data || []);

      // 6. Fetch flood street segments
      const floodRes = await api.get('/emergency/flood-risk');
      if (floodRes.data?.data?.floodZoneRisks) {
        setFloodStreetsData({
          type: 'FeatureCollection',
          features: floodRes.data.data.floodZoneRisks.map(segment => ({
            type: 'Feature',
            geometry: segment.geometry,
            properties: { ...segment }
          }))
        });
      }
    } catch (err) {
      console.error('[GovMap] Load data error:', err.message);
    }
  };

  useEffect(() => {
    fetchMapData();

    if (!socket) return;

    // Real-time socket event listeners
    socket.on('dispatch:new', (newDispatch) => {
      setDispatches((prev) => [newDispatch, ...prev]);
    });

    socket.on('dispatch:status-update', ({ id, status }) => {
      setDispatches((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status } : d))
      );
    });

    socket.on('sos:new', (newSos) => {
      setSosSignals((prev) => [newSos, ...prev]);
    });

    socket.on('sos:resolved', ({ id }) => {
      setSosSignals((prev) => prev.filter((s) => s.id !== id));
    });

    socket.on('road:blockage', (newClosure) => {
      setRoadClosures((prev) => [newClosure, ...prev]);
    });

    socket.on('road:cleared', ({ id }) => {
      setRoadClosures((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: 'cleared' } : c))
      );
    });

    socket.on('zone:flood-prediction', (prediction) => {
      if (prediction.floodZoneRisks) {
        setFloodStreetsData({
          type: 'FeatureCollection',
          features: prediction.floodZoneRisks.map(segment => ({
            type: 'Feature',
            geometry: segment.geometry,
            properties: { ...segment }
          }))
        });
      }
    });

    return () => {
      socket.off('dispatch:new');
      socket.off('dispatch:status-update');
      socket.off('sos:new');
      socket.off('sos:resolved');
      socket.off('road:blockage');
      socket.off('road:cleared');
      socket.off('zone:flood-prediction');
    };
  }, [socket]);

  return (
    <div className="relative w-full h-[500px] rounded-2xl overflow-hidden border border-slate-200/20 dark:border-slate-800/40">
      <MapContainer
        center={defaultCenter}
        zoom={13}
        className="w-full h-full z-0"
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://osm.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="dark:invert dark:hue-rotate-[180deg] dark:brightness-[0.8] dark:contrast-[1.2]"
        />

        {/* 1. Zone risk polygons */}
        {layers.zoneRisk && activeAlerts.map(alert => alert.zone?.geojson && (
          <ZonePolygons key={alert.id} alertLevel={alert.level} geojson={alert.zone.geojson} />
        ))}

        {/* 2. Flood street-level overlays */}
        {layers.floodStreets && floodStreetsData && (
          <FloodStreetOverlay geojson={floodStreetsData} />
        )}

        {/* 3. Landslide Risk areas */}
        {layers.landslideRisk && (
          <LandslideOverlay />
        )}

        {/* 4. Active Emergency Alert Markers */}
        {layers.activeAlerts && activeAlerts.map((alert) => {
          if (!alert.zone?.geojson?.coordinates?.[0]?.[0]) return null;
          const [lng, lat] = alert.zone.geojson.coordinates[0][0]; // centroid stub
          return (
            <Marker key={alert.id} position={[lat, lng]}>
              <Popup>
                <div className="p-2 max-w-[200px]">
                  <h4 className="font-bold flex items-center gap-1 text-sm text-red-600">
                    <ShieldAlert size={14} /> {alert.title}
                  </h4>
                  <p className="text-xs mt-1 text-slate-600 dark:text-slate-300">{alert.description}</p>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* 5. Safe Zones & Relief Camps */}
        {layers.safeZones && safeZones.map((sz) => (
          <CircleMarker
            key={sz.id}
            center={[sz.latitude, sz.longitude]}
            radius={8}
            pathOptions={{
              fillColor: sz.status === 'at_capacity' ? '#EF4444' : '#10B981',
              color: '#FFFFFF',
              weight: 2,
              fillOpacity: 0.9
            }}
          >
            <Popup>
              <div className="p-1">
                <h4 className="font-bold text-sm text-slate-800">{sz.name}</h4>
                <p className="text-xs text-slate-600 mt-0.5">Capacity: {sz.capacity} residents</p>
                <span className={`inline-block px-2 py-0.5 mt-1 rounded text-[10px] font-semibold text-white ${
                  sz.status === 'at_capacity' ? 'bg-red-500' : 'bg-emerald-500'
                }`}>
                  {sz.status === 'at_capacity' ? 'At Capacity' : 'Relief Camp Available'}
                </span>
              </div>
            </Popup>
          </CircleMarker>
        ))}

        {/* 6. Active SOS Panic Signals (Pulsing Red) */}
        {layers.sosPanic && sosSignals.map((sos) => (
          <Marker key={sos.id} position={[sos.latitude, sos.longitude]} icon={sosIcon}>
            <Popup>
              <div className="p-2 max-w-[220px]">
                <div className="flex items-center gap-1.5 text-red-600 font-bold text-sm">
                  <Activity className="animate-pulse" size={16} /> ACTIVE SOS SIGNAL
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold mt-1">"{sos.message}"</p>
                <span className="text-[9px] text-slate-500 mt-2 block">Triggered: {new Date(sos.createdAt).toLocaleTimeString()}</span>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* 7. Active Emergency Dispatches (Truck icon) */}
        {layers.dispatchUnits && dispatches.map((disp) => (
          <Marker key={disp.id} position={[disp.destinationLat, disp.destinationLng]} icon={dispatchIcon}>
            <Popup>
              <div className="p-1.5 max-w-[200px]">
                <h4 className="font-bold text-blue-600 text-sm flex items-center gap-1">
                  <Truck size={14} /> Dispatch Active
                </h4>
                <p className="text-xs text-slate-700 mt-1 capitalize font-semibold">
                  Unit: {(disp?.serviceType || 'dispatch').replace(/_/g, ' ')} x{disp?.quantity || 1}
                </p>
                <p className="text-[10px] text-slate-500">Status: {disp?.status || 'dispatched'}</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* 8. Road Closures (Orange closure icon / Polyline overlay) */}
        {layers.roadClosures && roadClosures.map((closure) => (
          <Marker key={closure.id} position={[closure.latitude, closure.longitude]} icon={closureIcon}>
            <Popup>
              <div className="p-1.5 max-w-[200px]">
                <h4 className="font-bold text-orange-600 text-sm flex items-center gap-1">
                  <AlertTriangle size={14} /> Road Blockage
                </h4>
                <p className="text-xs font-semibold text-slate-700 mt-1">{closure.roadName}</p>
                <p className="text-xs text-slate-600">Type: {closure.blockageType} ({closure.severity})</p>
                <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold mt-1 text-white ${
                  closure.status === 'cleared' ? 'bg-emerald-500' : 'bg-orange-500'
                }`}>
                  {closure.status === 'cleared' ? 'Cleared' : 'Blocked'}
                </span>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Floating Layer Toggle Panel */}
      <div className="absolute top-4 right-4 z-[999] bg-white/80 dark:bg-slate-900/90 backdrop-blur-md p-4 rounded-xl border border-slate-200/30 dark:border-slate-800/40 shadow-xl max-w-[200px]">
        <h4 className="font-bold text-xs text-slate-700 dark:text-slate-200 mb-2.5 flex items-center gap-1.5 border-b border-slate-200/20 pb-1.5 uppercase tracking-wider">
          <Crosshair size={12} /> Command Overlays
        </h4>
        <div className="space-y-1.5">
          {Object.entries(layers).map(([key, val]) => (
            <label key={key} className="flex items-center gap-2 text-[11px] font-semibold text-slate-600 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors">
              <input
                type="checkbox"
                checked={val}
                onChange={() => setLayers(prev => ({ ...prev, [key]: !prev[key] }))}
                className="w-3.5 h-3.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500 focus:ring-0"
              />
              <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
