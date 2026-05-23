import { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, GeoJSON, Popup, Marker, CircleMarker, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { ShieldAlert, Info, AlertTriangle, AlertCircle, RefreshCw, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { useGeolocation } from '../hooks/useGeolocation';
import { useAlertStore } from '../stores/alertStore';
import api from '../services/api';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassButton } from '../components/ui/GlassButton';
import { GlassBadge } from '../components/ui/GlassBadge';
import { GlassModal } from '../components/ui/GlassModal';

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

// Component to handle dynamic map centering
function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 13, { animate: true, duration: 1.5 });
  }, [center, map]);
  return null;
}

export function EmergencyPage() {

  const { location, isLoading: isLocLoading } = useGeolocation();
  const { zones, activeAlerts, fetchZones, fetchActiveAlerts, isLoadingZones } = useAlertStore();
  
  const [safeZones, setSafeZones] = useState([]);
  const [satelliteStatus, setSatelliteStatus] = useState(null);
  const [isRefreshingSat, setIsRefreshingSat] = useState(false);
  
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [zoneDetails, setZoneDetails] = useState(null);
  const [evacRoute, setEvacRoute] = useState(null);  // [[lat,lng], [lat,lng], ...] for Leaflet Polyline
  const [isRoutingLoading, setIsRoutingLoading] = useState(false);

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
    if (selectedAlert) {
      api.get(`/emergency/population-estimate?zoneId=${selectedAlert.zoneId}`)
        .then(res => setZoneDetails(res.data.data))
        .catch(console.error);
    } else {
      setZoneDetails(null);
    }
  }, [selectedAlert]);

  const fetchSatelliteStatus = useCallback(async () => {
    setIsRefreshingSat(true);
    try {
      const { data } = await api.get('/emergency/satellite-status', { params: { lat: location.lat, lng: location.lng } });
      setSatelliteStatus(data);
    } catch (err) {
      console.error('Failed to load satellite status', err);
    } finally {
      setIsRefreshingSat(false);
    }
  }, [location.lat, location.lng]);

  useEffect(() => {
    fetchZones();
    fetchActiveAlerts();
    
    // Fetch safe zones
    api.get('/emergency/safe-zones')
      .then(res => setSafeZones(res.data))
      .catch(err => console.error('Failed to load safe zones', err));
      
    fetchSatelliteStatus();
  }, [fetchZones, fetchActiveAlerts, fetchSatelliteStatus]);

  // Map zone colours
  const styleZone = (feature) => {
    const activeAlert = activeAlerts.find(a => a.zoneId === feature.properties.id);
    const level = activeAlert ? activeAlert.level : feature.properties.level;
    
    const colors = {
      yellow: { color: '#EAB308', fillColor: '#FEF08A', fillOpacity: 0.4 },
      orange: { color: '#F97316', fillColor: '#FED7AA', fillOpacity: 0.5 },
      red: { color: '#EF4444', fillColor: '#FECACA', fillOpacity: 0.6 },
    };
    return {
      weight: 2,
      opacity: 1,
      dashArray: '4',
      ...(colors[level] || { color: '#3B82F6', fillColor: '#BFDBFE', fillOpacity: 0.2 })
    };
  };

  if (isLocLoading || isLoadingZones) {
    return <div className="h-full flex items-center justify-center">Loading Emergency System...</div>;
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)] min-h-[600px]">
      
      {/* Sidebar Panel */}
      <div className="w-full lg:w-[400px] flex flex-col gap-6 overflow-y-auto pr-2 no-scrollbar">
        
        {/* Active Alerts List */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>Active Threats</h2>
            <GlassBadge level="info" label={`${activeAlerts.length} Active`} />
          </div>
          
          <div className="flex flex-col gap-4">
            {activeAlerts.length === 0 ? (
              <GlassCard padding="p-6" className="text-center border-green-200 bg-green-50/50">
                <ShieldAlert size={32} className="mx-auto text-green-500 mb-2" />
                <h3 className="font-semibold text-green-800">All Clear</h3>
                <p className="text-sm text-green-700 mt-1">No active emergency alerts in your region.</p>
              </GlassCard>
            ) : (
              activeAlerts.map(alert => (
                <GlassCard key={alert.id} padding="p-5" className={`border-l-4 ${alert.level === 'red' ? 'border-l-red-500' : alert.level === 'orange' ? 'border-l-orange-500' : 'border-l-yellow-500'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <GlassBadge level={alert.level} />
                    <span className="text-[10px] text-slate-500 font-semibold">{new Date(alert.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                  <h3 className="font-bold text-slate-800 text-base mb-1" style={{ fontFamily: 'var(--font-heading)' }}>{alert.title}</h3>
                  <p className="text-sm text-slate-600 mb-3 line-clamp-2">{alert.description}</p>
                  
                  {alert.evacuationOrder && (
                    <div className="bg-red-50 text-red-700 text-xs font-bold px-3 py-2 rounded-lg border border-red-200 flex items-center gap-2 mb-3 animate-pulse">
                      <AlertTriangle size={14} /> MANDATORY EVACUATION
                    </div>
                  )}
                  
                  <GlassButton size="sm" variant="ghost" className="w-full justify-between group" onClick={() => setSelectedAlert(alert)}>
                    View Zone Details <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </GlassButton>
                </GlassCard>
              ))
            )}
          </div>
        </section>

        {/* Satellite Data Box */}
        <section>
          <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'var(--font-heading)' }}>Live Telemetry</h2>
          <GlassCard padding="p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">NASA & ISRO Feeds</span>
              <button onClick={fetchSatelliteStatus} disabled={isRefreshingSat} className={`p-1.5 rounded-full hover:bg-slate-100 ${isRefreshingSat ? 'animate-spin opacity-50' : ''}`}>
                <RefreshCw size={14} className="text-slate-500" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-200/50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500"><Info size={16} /></div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Precipitation</p>
                    <p className="text-[10px] text-slate-500">OpenWeather / IMD</p>
                  </div>
                </div>
                <div className="text-right">
                  {satelliteStatus?.weather?.message ? (
                    <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded">API Key Req.</span>
                  ) : (
                    <>
                      <p className="font-bold text-slate-800">{satelliteStatus?.weather?.rain1h || 0} mm/hr</p>
                      <p className="text-xs text-slate-500 capitalize">{satelliteStatus?.weather?.condition || 'Clear'}</p>
                    </>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500"><AlertCircle size={16} /></div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Soil Saturation</p>
                    <p className="text-[10px] text-slate-500">NASA SMAP Radar</p>
                  </div>
                </div>
                <div className="text-right">
                   {satelliteStatus?.soilMoisture?.message ? (
                    <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded">API Key Req.</span>
                  ) : (
                    <>
                      <p className="font-bold text-slate-800">{satelliteStatus?.soilMoisture?.sm || '--'}%</p>
                      <p className="text-xs text-slate-500">{satelliteStatus?.soilMoisture?.sm > 80 ? 'High Risk' : 'Normal'}</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </GlassCard>
        </section>

      </div>

      {/* Main Map Container */}
      <div className="flex-1 rounded-2xl overflow-hidden border border-slate-200/60 shadow-[0_8px_32px_rgba(31,38,135,0.08)] relative z-0">
        <MapContainer 
          center={[location.lat, location.lng]} 
          zoom={13} 
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            className="map-tiles"
          />
          <MapUpdater center={[location.lat, location.lng]} />
          
          {/* Geofenced Zones */}
          {zones.map((zone, idx) => (
            <GeoJSON 
              key={`zone-${idx}`} 
              data={zone} 
              style={styleZone}
            >
              <Popup>
                <div className="p-1">
                  <h3 className="font-bold mb-1">{zone.properties.name}</h3>
                  <p className="text-sm text-slate-600 mb-2">{zone.properties.description}</p>
                  <GlassBadge level={zone.properties.level} />
                </div>
              </Popup>
            </GeoJSON>
          ))}

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
                    <h3 className="font-bold text-sm">{sz.name}</h3>
                    <GlassBadge 
                      level={sz.status === 'activated' ? 'safe' : sz.status === 'at_capacity' ? 'critical' : 'info'} 
                      label={sz.status.replace('_', ' ')} 
                    />
                  </div>
                  <p className="text-xs text-slate-500 mb-2 capitalize">{sz.type.replace('_', ' ')}</p>
                  <div className="bg-slate-50 p-2 rounded text-xs">
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
        
        {/* Map Overlay Controls */}
        <div className="absolute bottom-4 right-4 z-[1000] flex flex-col gap-2">
           <GlassCard padding="p-3" className="text-xs bg-white/90">
             <div className="font-semibold mb-2">Map Legend</div>
             <div className="flex items-center gap-2 mb-1.5"><div className="w-3 h-3 rounded bg-red-400 opacity-60"></div> Red Alert Zone</div>
             <div className="flex items-center gap-2 mb-1.5"><div className="w-3 h-3 rounded bg-orange-400 opacity-60"></div> Orange Watch Zone</div>
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
            
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-slate-700 mb-1">Alert Notice</p>
              <p className="text-sm text-slate-600">{selectedAlert.description}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4">
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Est. Population</p>
                <p className="text-xl font-bold text-blue-900">{zoneDetails ? zoneDetails.estimatedPopulation.toLocaleString() : 'Loading...'}</p>
                {zoneDetails && <p className="text-[10px] text-blue-500 mt-1">Area: {zoneDetails.areaKm2} km²</p>}
              </div>
              <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-4">
                <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-1">Evacuation</p>
                <p className="text-sm font-bold text-orange-900">{selectedAlert.evacuationOrder ? 'MANDATORY' : 'Voluntary'}</p>
              </div>
            </div>
            
            <h4 className="font-bold text-slate-800 mt-2" style={{ fontFamily: 'var(--font-heading)' }}>Nearest Safe Zones</h4>
            <div className="flex flex-col gap-2 max-h-[150px] overflow-y-auto pr-2">
              {(() => {
                // Approximate zone center for distance
                let zLng = location.lng, zLat = location.lat;
                try {
                  const c = selectedAlert.zone.geojson.coordinates[0][0];
                  zLng = c[0]; zLat = c[1];
                } catch(e) {}
                
                const sorted = [...safeZones].map(sz => ({
                  ...sz, 
                  dist: getDistance(zLat, zLng, sz.latitude, sz.longitude)
                })).sort((a,b) => a.dist - b.dist).slice(0, 3);
                
                if (sorted.length === 0) return <p className="text-sm text-slate-500">No safe zones available.</p>;
                
                return sorted.map(sz => (
                  <div key={sz.id} className="flex items-center justify-between border border-slate-200 rounded-lg p-3 hover:bg-slate-50">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{sz.name}</p>
                      <p className="text-xs text-slate-500">{sz.dist.toFixed(1)} km away • Capacity: {sz.capacity}</p>
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
            
            <div className="flex justify-end mt-2 pt-4 border-t border-slate-200">
               <GlassButton variant="ghost" onClick={() => setSelectedAlert(null)}>Close</GlassButton>
            </div>
          </div>
        </GlassModal>
      )}
    </div>
  );
}
