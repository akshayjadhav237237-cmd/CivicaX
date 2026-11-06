import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Polygon,
  Popup,
  Tooltip,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import {
  Navigation,
  MapPin,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Clock,
  TrendingUp,
  Footprints,
  Compass,
  Crosshair,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Layers,
  Sparkles,
  Info,
  Radio,
  ArrowRight,
  RefreshCw,
  Maximize2,
  Users,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useSimulationStore } from '../../stores/simulationStore';

import {
  calculateSafeEvacuationRoute,
  KEDARNATH_DEFAULT_SHELTERS,
  KEDARNATH_DEFAULT_HAZARDS,
  EMERGENCY_EVACUATION_CHECKLIST,
} from '../../services/routingService';

// Fix Leaflet marker icons in Vite/bundler environment
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// ---------------------------------------------------------------------------
// Custom Leaflet DivIcons
// ---------------------------------------------------------------------------

const createCitizenPin = (isDraggable = true) => {
  return L.divIcon({
    className: 'evac-citizen-pin',
    html: `
      <div style="position:relative; width:40px; height:40px; display:flex; align-items:center; justify-content:center; cursor:${isDraggable ? 'grab' : 'pointer'};">
        <span style="position:absolute; width:36px; height:36px; border-radius:50%; background:rgba(37,99,235,0.35); animation:pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;"></span>
        <span style="position:absolute; width:26px; height:26px; border-radius:50%; background:rgba(59,130,246,0.5);"></span>
        <div style="position:relative; width:22px; height:22px; border-radius:50%; background:#2563EB; border:2.5px solid #FFFFFF; box-shadow:0 3px 10px rgba(0,0,0,0.45); display:flex; align-items:center; justify-content:center; color:white;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });
};

const createShelterPin = (isSelected, status) => {
  const bg = isSelected ? '#10B981' : status === 'activated' ? '#059669' : '#3B82F6';
  const border = isSelected ? '#FFFFFF' : 'rgba(255,255,255,0.85)';
  const scale = isSelected ? 'scale(1.18)' : 'scale(1.0)';
  return L.divIcon({
    className: 'evac-shelter-pin',
    html: `
      <div style="position:relative; display:flex; flex-direction:column; align-items:center; transform:${scale}; transition:transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);">
        <div style="width:34px; height:34px; border-radius:10px; background:${bg}; border:2.5px solid ${border}; box-shadow:0 6px 16px rgba(0,0,0,0.38); display:flex; align-items:center; justify-content:center; color:white;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        </div>
        <div style="width:0; height:0; border-left:6px solid transparent; border-right:6px solid transparent; border-top:7px solid ${bg};"></div>
      </div>
    `,
    iconSize: [34, 41],
    iconAnchor: [17, 41],
    popupAnchor: [0, -40],
  });
};

// ---------------------------------------------------------------------------
// Leaflet Map Helpers
// ---------------------------------------------------------------------------

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
  });
  return null;
}

function MapBoundsFitter({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (positions && positions.length > 1) {
      try {
        const bounds = positions.reduce(
          (b, [lat, lng]) => b.extend([lat, lng]),
          L.latLngBounds(positions[0], positions[0])
        );
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 17, animate: true });
      } catch (e) {
        console.warn('[EvacuationRouter] Map fitBounds notice:', e);
      }
    }
  }, [positions, map]);
  return null;
}

function MapPanController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom || 16.5, { animate: true, duration: 1 });
    }
  }, [center, zoom, map]);
  return null;
}

// ---------------------------------------------------------------------------
// Preset Locations in Kedarnath Valley for Quick Simulation
// ---------------------------------------------------------------------------
const PRESET_ORIGINS = [
  {
    id: 'origin-mandakini-ghat',
    name: 'Mandakini Riverfront Lower Steps (Flooded)',
    shortName: 'Mandakini Ghat',
    coords: [30.7342, 79.0662],
    elevationM: 3546,
    badge: 'Critical Hazard Zone',
    badgeColor: 'bg-red-500/20 text-red-300 border-red-500/40',
  },
  {
    id: 'origin-bazaar-bottleneck',
    name: 'Temple Bazaar Corridor (Submerged Gully)',
    shortName: 'Bazaar Marg',
    coords: [30.7348, 79.0652],
    elevationM: 3560,
    badge: 'Choke Point Risk',
    badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
  },
  {
    id: 'origin-saraswati-bridge',
    name: 'Saraswati River Approach Bridge',
    shortName: 'Saraswati Bridge',
    coords: [30.7331, 79.0675],
    elevationM: 3550,
    badge: 'Overflow Warning',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  },
  {
    id: 'origin-lincholi-trail',
    name: 'Lincholi Lower Pilgrim Trailhead',
    shortName: 'Lincholi Trail',
    coords: [30.7290, 79.0635],
    elevationM: 3520,
    badge: 'Lower Trek Corridor',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  },
];

export default function EvacuationRouter({
  initialOrigin,
  initialShelterId = 'shelter-kedarnath-temple-01',
  customHazards,
  className = '',
}) {
  const isSimulationRunning = useSimulationStore((state) => state.isRunning);
  const currentStageIndex = useSimulationStore((state) => state.currentStageIndex);
  const openSimulator = useSimulationStore((state) => state.openSimulator);

  // Origin State: Default to Mandakini Ghat risk spot or passed prop
  const [origin, setOrigin] = useState(() => {
    if (initialOrigin) {
      return {
        lat: initialOrigin.lat || initialOrigin[0],
        lng: initialOrigin.lng || initialOrigin[1],
        name: initialOrigin.name || 'Citizen Location',
        elevationM: initialOrigin.elevationM || 3548,
      };
    }
    return {
      lat: PRESET_ORIGINS[0].coords[0],
      lng: PRESET_ORIGINS[0].coords[1],
      name: PRESET_ORIGINS[0].name,
      elevationM: PRESET_ORIGINS[0].elevationM,
    };
  });

  // Selected Shelter State
  const [selectedShelterId, setSelectedShelterId] = useState(initialShelterId);
  const shelters = KEDARNATH_DEFAULT_SHELTERS;

  const currentShelter = useMemo(() => {
    return shelters.find((s) => s.id === selectedShelterId) || shelters[0];
  }, [shelters, selectedShelterId]);

  // Active Hazards State
  const activeHazards = customHazards || KEDARNATH_DEFAULT_HAZARDS;
  const [showHazards, setShowHazards] = useState(true);

  // Routing State
  const [routeData, setRouteData] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('directions'); // 'directions' | 'checklist' | 'shelters'
  const [checkedItems, setCheckedItems] = useState({});

  // Recalculate Safe Route whenever Origin or Destination changes
  const runRouteCalculation = useCallback(async () => {
    if (!origin || !currentShelter) return;
    setIsCalculating(true);
    try {
      const res = await calculateSafeEvacuationRoute(origin, currentShelter, activeHazards);
      if (res && res.success) {
        setRouteData(res);
      }
    } catch (err) {
      console.error('[EvacuationRouter] Routing failure:', err);
      toast.error('Safe route re-calculation failed. Falling back to geometric corridor.');
    } finally {
      setIsCalculating(false);
    }
  }, [origin, currentShelter, activeHazards]);

  useEffect(() => {
    runRouteCalculation();
  }, [runRouteCalculation]);

  // Handle map click to place citizen pin
  const handleMapClick = (latlng) => {
    setOrigin({
      lat: latlng.lat,
      lng: latlng.lng,
      name: `Custom Location (${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)})`,
      elevationM: 3550,
    });
    toast.success('Origin pin moved! Recalculating safe corridor...', { id: 'origin-move', duration: 1800 });
  };

  // Browser Geolocation
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }
    toast.loading('Acquiring high-precision GPS coordinates...', { id: 'gps-loc' });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        toast.dismiss('gps-loc');
        setOrigin({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          name: 'My GPS Location',
          elevationM: 3550,
        });
        toast.success('Located at GPS coordinates!');
      },
      (err) => {
        toast.dismiss('gps-loc');
        toast.error(`GPS Error: ${err.message}. Using default mountain coordinates.`);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Toggle checklist item
  const toggleChecklist = (id) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Polyline styling according to danger clearance
  const routeStyling = useMemo(() => {
    if (!routeData) {
      return {
        haloColor: '#3B82F6',
        mainColor: '#3B82F6',
        dashArray: '0',
      };
    }
    const status = routeData.dangerClearance?.status;
    if (status === 'SAFE') {
      return {
        haloColor: 'rgba(16, 185, 129, 0.35)',
        mainColor: '#10B981', // Emerald Safe
        dashArray: '0',
      };
    }
    if (status === 'CAUTION') {
      return {
        haloColor: 'rgba(245, 158, 11, 0.35)',
        mainColor: '#F59E0B', // Amber Caution
        dashArray: '8, 5',
      };
    }
    return {
      haloColor: 'rgba(239, 68, 68, 0.4)',
      mainColor: '#EF4444', // Red Danger
      dashArray: '6, 6',
    };
  }, [routeData]);

  // Map Center
  const mapCenter = useMemo(() => [origin.lat, origin.lng], [origin]);

  return (
    <div className={`relative w-full h-[650px] lg:h-[720px] rounded-2xl overflow-hidden border border-slate-700/60 bg-slate-950 shadow-2xl flex flex-col ${className}`}>
      
      {/* ── Top Floating Header Bar ── */}
      <div className="absolute top-3 left-3 right-3 sm:right-auto z-[1000] flex items-center gap-2 flex-wrap">
        <div className="bg-slate-900/90 dark:bg-slate-950/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-700/70 shadow-xl flex items-center gap-3">
          <div className="flex items-center gap-2 pr-2 border-r border-slate-700/80">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-slate-100 flex items-center gap-1.5" style={{ fontFamily: 'var(--font-heading)' }}>
              <Navigation size={13} className="text-emerald-400" />
              Evacuation Router
            </span>
          </div>

          <button
            onClick={handleLocateMe}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-600/30 text-blue-200 hover:bg-blue-600/50 border border-blue-500/40 transition-colors cursor-pointer"
            title="Snap origin to your device GPS location"
          >
            <Crosshair size={12} className="text-blue-300" />
            <span className="hidden sm:inline">GPS Locate</span>
          </button>

          <button
            onClick={() => setShowHazards(!showHazards)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
              showHazards
                ? 'bg-red-500/20 text-red-300 border-red-500/50'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
            title="Toggle active river breach and flood polygons"
          >
            <Layers size={12} />
            <span className="hidden sm:inline">Hazards</span>
          </button>

          <button
            onClick={runRouteCalculation}
            disabled={isCalculating}
            className="p-1.5 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors cursor-pointer"
            title="Recalculate route"
          >
            <RefreshCw size={13} className={isCalculating ? 'animate-spin text-emerald-400' : ''} />
          </button>
        </div>

        {/* Quick Origin Preset Pill Bar */}
        <div className="hidden md:flex items-center gap-1.5 bg-slate-900/85 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-slate-700/60 shadow-xl overflow-x-auto max-w-[550px] no-scrollbar">
          <span className="text-[10px] uppercase font-bold text-slate-400 whitespace-nowrap pl-1 pr-1 border-r border-slate-700/60">
            Presets:
          </span>
          {PRESET_ORIGINS.map((preset) => {
            const isActive = Math.abs(origin.lat - preset.coords[0]) < 0.0003 && Math.abs(origin.lng - preset.coords[1]) < 0.0003;
            return (
              <button
                key={preset.id}
                onClick={() => {
                  setOrigin({
                    lat: preset.coords[0],
                    lng: preset.coords[1],
                    name: preset.name,
                    elevationM: preset.elevationM,
                  });
                }}
                className={`px-2 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-400 shadow-md font-bold'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border-slate-700/60'
                }`}
              >
                {preset.shortName}
              </button>
            );
          })}
        </div>

        {/* Evaluator Simulation Quick Pill */}
        <button
          onClick={openSimulator}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer shadow-xl backdrop-blur-md shrink-0 ${
            isSimulationRunning
              ? 'bg-red-600/90 text-white border-red-400 animate-pulse'
              : 'bg-slate-900/85 hover:bg-slate-800 text-red-400 border-red-500/40'
          }`}
          title="Evaluator 1-Click 60s Crisis Simulation"
        >
          <Zap size={13} className="text-red-400" />
          <span>{isSimulationRunning ? `Sim: Stage ${currentStageIndex + 1}/5` : '1-Click Crisis Sim'}</span>
        </button>
      </div>

      {/* ── Main Interactive Leaflet Map ── */}
      <div className="w-full h-full relative z-0">
        <MapContainer
          center={mapCenter}
          zoom={16.5}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            className="map-tiles"
          />

          <MapClickHandler onMapClick={handleMapClick} />
          <MapPanController center={mapCenter} zoom={16.5} />

          {/* Render Route Bounds Auto-fitter */}
          {routeData?.routeCoordinates && (
            <MapBoundsFitter positions={routeData.routeCoordinates} />
          )}

          {/* Active Flood Hazard Breach Polygons */}
          {showHazards &&
            activeHazards.map((hazard) => {
              const coords = hazard.geometry.coordinates[0].map(([lng, lat]) => [lat, lng]);
              const isRed = hazard.level === 'critical' || hazard.severity === 'red';
              return (
                <Polygon
                  key={hazard.id}
                  positions={coords}
                  pathOptions={{
                    color: isRed ? '#DC2626' : '#EA580C',
                    fillColor: isRed ? '#EF4444' : '#F97316',
                    fillOpacity: isRed ? 0.45 : 0.35,
                    weight: 2.5,
                    dashArray: '6, 6',
                  }}
                >
                  <Tooltip permanent direction="center" className="custom-hazard-tooltip">
                    <div className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-900/90 text-red-300 border border-red-500/50 shadow">
                      ⚠️ {hazard.name} ({hazard.waterDepthM}m)
                    </div>
                  </Tooltip>
                  <Popup>
                    <div className="p-1 min-w-[200px] text-slate-800 dark:text-slate-100">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-red-600 mb-1">
                        <AlertTriangle size={14} />
                        <span>ACTIVE BREACH CORRIDOR</span>
                      </div>
                      <h4 className="font-bold text-sm mb-1">{hazard.name}</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mb-2">{hazard.warning}</p>
                      <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-100 dark:bg-slate-800 p-2 rounded">
                        <div>
                          <span className="text-slate-500 block">Water Depth:</span>
                          <span className="font-bold text-red-500">{hazard.waterDepthM} m</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Flow Speed:</span>
                          <span className="font-bold">{hazard.flowVelocityMs} m/s</span>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Polygon>
              );
            })}

          {/* Render Route Polyline */}
          {routeData?.routeCoordinates && (
            <>
              {/* Glowing halo underneath */}
              <Polyline
                positions={routeData.routeCoordinates}
                pathOptions={{
                  color: routeStyling.haloColor,
                  weight: 12,
                  opacity: 0.7,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />
              {/* Sharp primary polyline */}
              <Polyline
                positions={routeData.routeCoordinates}
                pathOptions={{
                  color: routeStyling.mainColor,
                  weight: 5,
                  opacity: 0.95,
                  dashArray: routeStyling.dashArray,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />
            </>
          )}

          {/* Citizen Origin Marker (Draggable) */}
          <Marker
            position={[origin.lat, origin.lng]}
            icon={createCitizenPin(true)}
            draggable={true}
            eventHandlers={{
              dragend: (e) => {
                const pos = e.target.getLatLng();
                setOrigin({
                  lat: pos.lat,
                  lng: pos.lng,
                  name: `Pinned Origin (${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)})`,
                  elevationM: 3550,
                });
                toast.success('Repositioned origin! Safe path updated.');
              },
            }}
          >
            <Popup>
              <div className="p-1 min-w-[180px] text-center">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block mb-1">
                  Citizen / Responder Location
                </span>
                <p className="font-bold text-sm text-slate-800 dark:text-slate-100">{origin.name}</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  💡 Drag this marker or click the map to re-route from any position.
                </p>
              </div>
            </Popup>
          </Marker>

          {/* Destination Shelter Markers */}
          {shelters.map((shelter) => {
            const isSelected = shelter.id === selectedShelterId;
            return (
              <Marker
                key={shelter.id}
                position={[shelter.latitude, shelter.longitude]}
                icon={createShelterPin(isSelected, shelter.status)}
                eventHandlers={{
                  click: () => {
                    setSelectedShelterId(shelter.id);
                    toast.success(`Selected destination: ${shelter.shortName}`);
                  },
                }}
              >
                <Popup>
                  <div className="p-1 min-w-[220px]">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 uppercase">
                        {shelter.type}
                      </span>
                      <span className="text-xs font-bold text-slate-500">
                        {shelter.elevationM}m Elev.
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-1">
                      {shelter.name}
                    </h4>

                    <p className="text-xs text-slate-600 dark:text-slate-300 mb-2.5">
                      {shelter.description}
                    </p>

                    <div className="bg-slate-100 dark:bg-slate-800/80 p-2 rounded-lg mb-2.5 text-xs">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-slate-500 flex items-center gap-1">
                          <Users size={12} /> Capacity:
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {shelter.occupancy} / {shelter.capacity}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all"
                          style={{ width: `${(shelter.occupancy / shelter.capacity) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedShelterId(shelter.id)}
                      className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                      }`}
                    >
                      <Navigation size={13} />
                      {isSelected ? 'Current Route Destination' : 'Route to this Shelter'}
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* ── Floating Guidance & Directions Card (CivicaX Modern Slate Aesthetic) ── */}
      <div
        className={`absolute bottom-3 left-3 right-3 sm:right-auto sm:w-[440px] z-[1000] bg-slate-900/95 dark:bg-slate-950/98 backdrop-blur-xl rounded-2xl border border-slate-700/80 shadow-[0_12px_40px_rgba(0,0,0,0.6)] text-slate-100 transition-all duration-300 overflow-hidden flex flex-col ${
          isPanelCollapsed ? 'max-h-[72px]' : 'max-h-[85%] sm:max-h-[580px]'
        }`}
      >
        {/* Panel Header */}
        <div className="p-3.5 border-b border-slate-800 flex items-center justify-between gap-3 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                routeData?.dangerClearance?.status === 'SAFE'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              }`}
            >
              <Footprints size={17} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wide text-slate-400">
                  Escape Route:
                </span>
                <span
                  className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded border uppercase whitespace-nowrap ${
                    routeData?.dangerClearance?.status === 'SAFE'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}
                >
                  {routeData?.dangerClearance?.isRerouted
                    ? 'Bypass Active'
                    : routeData?.dangerClearance?.status || 'Active'}
                </span>
              </div>
              <h3 className="font-bold text-sm text-white truncate" title={currentShelter.name}>
                {currentShelter.name}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title={isPanelCollapsed ? 'Expand Guidance' : 'Collapse Guidance'}
            >
              {isPanelCollapsed ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          </div>
        </div>

        {/* Collapsed Preview Strip */}
        {isPanelCollapsed && routeData && (
          <div className="px-3.5 py-2 flex items-center justify-between text-xs text-slate-300">
            <span className="flex items-center gap-1 font-bold text-emerald-400">
              <Footprints size={13} /> {routeData.distanceFormatted}
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              <Clock size={13} /> ~{routeData.durationFormatted}
            </span>
            <span className="flex items-center gap-1 text-blue-400">
              <TrendingUp size={13} /> +{routeData.elevationGainMeters}m
            </span>
          </div>
        )}

        {/* Expanded Body */}
        {!isPanelCollapsed && (
          <div className="p-3.5 overflow-y-auto no-scrollbar flex flex-col gap-3.5">
            {/* Top Critical Metrics Grid */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-slate-800/80 rounded-xl p-2.5 border border-slate-700/60 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                  Distance
                </span>
                <span className="text-base font-extrabold text-white flex items-center justify-center gap-1">
                  <Footprints size={14} className="text-emerald-400" />
                  {routeData?.distanceFormatted || '--'}
                </span>
              </div>

              <div className="bg-slate-800/80 rounded-xl p-2.5 border border-slate-700/60 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                  Walk Time
                </span>
                <span className="text-base font-extrabold text-white flex items-center justify-center gap-1">
                  <Clock size={14} className="text-amber-400" />
                  {routeData?.durationFormatted || '--'}
                </span>
              </div>

              <div className="bg-slate-800/80 rounded-xl p-2.5 border border-slate-700/60 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                  Climb
                </span>
                <span className="text-base font-extrabold text-blue-400 flex items-center justify-center gap-1">
                  <TrendingUp size={14} />
                  +{routeData?.elevationGainMeters || 0}m
                </span>
              </div>
            </div>

            {/* Clearance Alert Banner */}
            <div
              className={`p-2.5 rounded-xl border flex items-start gap-2.5 text-xs ${
                routeData?.dangerClearance?.isRerouted
                  ? 'bg-blue-950/50 text-blue-200 border-blue-600/40'
                  : routeData?.dangerClearance?.status === 'SAFE'
                  ? 'bg-emerald-950/40 text-emerald-200 border-emerald-600/40'
                  : 'bg-amber-950/50 text-amber-200 border-amber-600/40'
              }`}
            >
              {routeData?.dangerClearance?.isRerouted ? (
                <ShieldCheck size={16} className="text-blue-400 shrink-0 mt-0.5" />
              ) : routeData?.dangerClearance?.status === 'SAFE' ? (
                <ShieldCheck size={16} className="text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
              )}
              <div>
                <span className="font-extrabold block mb-0.5">
                  {routeData?.dangerClearance?.isRerouted
                    ? 'Active Flood Reroute Triggered'
                    : routeData?.dangerClearance?.status === 'SAFE'
                    ? 'Clear High-Ground Path'
                    : 'Hazard Proximity Caution'}
                </span>
                <p className="text-[11px] leading-relaxed text-slate-300">
                  {routeData?.dangerClearance?.clearanceMessage ||
                    'Corridor verified against live hydrological breach contours.'}
                </p>
              </div>
            </div>

            {/* Tab Controls */}
            <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700/70">
              <button
                onClick={() => setActiveTab('directions')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'directions'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Compass size={13} />
                Advisories
              </button>
              <button
                onClick={() => setActiveTab('shelters')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'shelters'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users size={13} />
                Safe Zones
              </button>
              <button
                onClick={() => setActiveTab('checklist')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'checklist'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <CheckCircle2 size={13} />
                Checklist
              </button>
            </div>

            {/* Tab 1: Turn-by-Turn Waypoint Advisories */}
            {activeTab === 'directions' && (
              <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto no-scrollbar pr-1">
                {routeData?.waypoints?.map((wp, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-start gap-2.5"
                  >
                    <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 font-extrabold text-[11px] flex items-center justify-center shrink-0 mt-0.5 border border-blue-500/30">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-bold text-xs text-white truncate">{wp.title}</span>
                        {wp.distanceMeters > 0 && (
                          <span className="text-[10px] text-slate-400 font-semibold whitespace-nowrap">
                            ~{wp.distanceMeters}m
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-300 leading-snug">{wp.instruction}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tab 2: Destination Shelters List */}
            {activeTab === 'shelters' && (
              <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto no-scrollbar pr-1">
                {shelters.map((s) => {
                  const isSel = s.id === selectedShelterId;
                  return (
                    <div
                      key={s.id}
                      onClick={() => setSelectedShelterId(s.id)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                        isSel
                          ? 'bg-emerald-950/50 border-emerald-500/60 shadow-lg'
                          : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/50 text-slate-300'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-white truncate">{s.name}</span>
                          {isSel && (
                            <span className="text-[9px] font-black uppercase px-1 py-0.2 rounded bg-emerald-500/30 text-emerald-300 border border-emerald-500/50">
                              Selected
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {s.elevationM}m Elev • Capacity: {s.occupancy} / {s.capacity}
                        </p>
                      </div>
                      <ArrowRight size={14} className={isSel ? 'text-emerald-400' : 'text-slate-500'} />
                    </div>
                  );
                })}
              </div>
            )}

            {/* Tab 3: Emergency Hydrological Crisis Checklist */}
            {activeTab === 'checklist' && (
              <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto no-scrollbar pr-1">
                {EMERGENCY_EVACUATION_CHECKLIST.map((item) => {
                  const isDone = !!checkedItems[item.id];
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleChecklist(item.id)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 select-none ${
                        isDone
                          ? 'bg-emerald-950/30 border-emerald-600/40 text-slate-300 line-through opacity-75'
                          : 'bg-slate-800/60 border-slate-700/60 text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isDone}
                        onChange={() => {}}
                        className="mt-0.5 rounded text-emerald-500 focus:ring-0 cursor-pointer"
                      />
                      <span className="text-xs font-medium leading-snug flex-1">{item.text}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bottom Action Footer */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1 text-slate-400">
                <Radio size={12} className="text-emerald-400" />
                VHF Relay: 146.52 MHz
              </span>
              <span className="font-semibold text-slate-300">
                Source: {routeData?.source === 'osrm' ? 'OSRM Walk Network' : 'CivicaX Vector Engine'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
