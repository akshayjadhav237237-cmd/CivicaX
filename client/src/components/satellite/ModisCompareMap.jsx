import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  Calendar,
  Maximize2,
  Minimize2,
  RotateCcw,
  MapPin,
  Eye,
  ChevronLeft,
  ChevronRight,
  Droplets
} from 'lucide-react';
import { useThemeStore } from '../../stores/themeStore';
import 'leaflet/dist/leaflet.css';

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

// Custom Hydrology Point Marker
const createStationIcon = (color = '#3B82F6') => L.divIcon({
  className: 'custom-station-icon',
  html: `<div style="position:relative; width:22px; height:22px; display:flex; align-items:center; justify-content:center;">
    <div style="position:absolute; width:100%; height:100%; border-radius:50%; background:${color}; opacity:0.3; animation:ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
    <div style="position:relative; width:14px; height:14px; border-radius:50%; background:${color}; border:2px solid white; box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>
  </div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11]
});

// ─── Coordinates Presets ──────────────────────────────────────────
export const COORDINATE_PRESETS = {
  kedarnath: {
    id: 'kedarnath',
    name: 'Kedarnath Valley',
    subtext: 'Mandakini Gorge & Chorabari Breaching Zone',
    coordinates: [30.7346, 79.0669],
    zoom: 11,
    elevation: '3,583 m',
    description: 'Mandakini river headwaters & steep glaciated gorge — epicentre of 2013 Himalayan flash flood disaster.',
    cloudEstimate: '14%',
    overpassTerra: '10:42 AM IST',
    overpassAqua: '01:38 PM IST',
    keyStations: [
      { name: 'Kedarnath Temple Basin', lat: 30.7346, lng: 79.0669, status: 'Severe Hazard Area', note: 'Glacial outburst channel' },
      { name: 'Rambara Washout Zone', lat: 30.6865, lng: 79.0558, status: 'High Inundation Risk', note: 'Steep river gorge bottleneck' },
      { name: 'Guptkashi Staging Base', lat: 30.5228, lng: 79.0760, status: 'Safe Ridge / Evacuation', note: 'Heli-evacuation corridor' }
    ]
  },
  rishikesh: {
    id: 'rishikesh',
    name: 'Rishikesh Confluence',
    subtext: 'Mandakini / Alaknanda / Ganges Confluence',
    coordinates: [30.0869, 78.2676],
    zoom: 12,
    elevation: '372 m',
    description: 'Downstream Himalayan river confluence where Alaknanda, Mandakini and Bhagirathi merge into Ganges — critical municipal flood plain.',
    cloudEstimate: '8%',
    overpassTerra: '10:44 AM IST',
    overpassAqua: '01:40 PM IST',
    keyStations: [
      { name: 'Triveni Ghat Inundation Point', lat: 30.1030, lng: 78.2930, status: 'Watch Level', note: 'Ganges riverfront gauge +3.8m' },
      { name: 'Ram Jhula Suspension Bridge', lat: 30.1235, lng: 78.3150, status: 'Submersion Warning', note: 'Ghat level inundation check' },
      { name: 'Barrage Sluice Channel', lat: 30.0650, lng: 78.2810, status: 'Regulated Discharge', note: '65,000 cusecs outflow gate' }
    ]
  },
  chamoli: {
    id: 'chamoli',
    name: 'Chamoli / Joshimath',
    subtext: 'Dhauliganga & Rishiganga Flash Flood Corridor',
    coordinates: [30.5576, 79.5658],
    zoom: 11,
    elevation: '1,890 m',
    description: 'Dhauliganga / Rishiganga gorge — site of the February 2021 rock-ice avalanche and downstream hydroelectric barrage devastation.',
    cloudEstimate: '19%',
    overpassTerra: '10:41 AM IST',
    overpassAqua: '01:37 PM IST',
    keyStations: [
      { name: 'Tapovan Barrage Site', lat: 30.4950, lng: 79.6270, status: 'Critical Sludge Washout', note: '2021 surge bottleneck' },
      { name: 'Rishiganga Confluence', lat: 30.4855, lng: 79.6990, status: 'Debris Flow Corridor', note: 'Rock-ice avalanche source run' },
      { name: 'Joshimath Ridge Observatory', lat: 30.5576, lng: 79.5658, status: 'Subsidence Monitoring', note: 'Slope stabilization radar' }
    ]
  }
};

// ─── Historical Flood Event & Baseline Date Presets ────────────────
export const DATE_PRESETS = [
  {
    id: 'monsoon_2023',
    label: 'Aug 2023 Cloudburst',
    sub: 'Mandakini & Alaknanda Deluge',
    baselineDate: '2023-05-15',
    eventDate: '2023-08-14',
    highlight: 'Disaster Inundation'
  },
  {
    id: 'chamoli_2021',
    label: 'Feb 2021 Chamoli Surge',
    sub: 'Rishiganga Avalanche Event',
    baselineDate: '2021-01-20',
    eventDate: '2021-02-07',
    highlight: 'Flash Flood Debris'
  },
  {
    id: 'kedarnath_2013',
    label: 'June 2013 Kedarnath Flood',
    sub: 'Chorabari Glacial Breach',
    baselineDate: '2013-05-20',
    eventDate: '2013-06-17',
    highlight: 'Epic Multi-Day Deluge'
  },
  {
    id: 'monsoon_2024',
    label: 'July 2024 Peak Monsoon',
    sub: 'High Seasonal Inundation',
    baselineDate: '2024-04-18',
    eventDate: '2024-07-31',
    highlight: 'Active Hydrology Cycle'
  }
];

// ─── Satellite Layer Configurations ────────────────────────────────
export const SATELLITE_LAYERS = {
  // Baseline Layers
  esri_world: {
    id: 'esri_world',
    name: 'Esri World Imagery Reference',
    shortName: 'Esri High-Res',
    type: 'baseline',
    getUrl: () => 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, Maxar, Earthstar Geographics',
    maxNativeZoom: 18,
    maxZoom: 18,
    badge: '0.5m Reference',
    description: 'Cloud-free multi-source optical satellite basemap with sub-meter valley resolution.'
  },
  terra_truecolor_baseline: {
    id: 'terra_truecolor_baseline',
    name: 'NASA MODIS Terra TrueColor',
    shortName: 'Terra TrueColor',
    type: 'baseline',
    getUrl: (date) => `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/${date}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`,
    attribution: 'Imagery &copy; NASA GIBS / EOSDIS MODIS Terra',
    maxNativeZoom: 9,
    maxZoom: 18,
    badge: 'NASA 250m Pre-Flood',
    description: 'Pre-monsoon natural color surface reflectance (Bands 1-4-3) captured by EOS Terra.'
  },
  aqua_truecolor_baseline: {
    id: 'aqua_truecolor_baseline',
    name: 'NASA MODIS Aqua TrueColor',
    shortName: 'Aqua TrueColor',
    type: 'baseline',
    getUrl: (date) => `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Aqua_CorrectedReflectance_TrueColor/default/${date}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`,
    attribution: 'Imagery &copy; NASA GIBS / EOSDIS MODIS Aqua',
    maxNativeZoom: 9,
    maxZoom: 18,
    badge: 'NASA Aqua 1:30 PM',
    description: 'Pre-monsoon afternoon pass optical reflectance from EOS Aqua.'
  },

  // Event / Active Flood Layers
  terra_bands721_event: {
    id: 'terra_bands721_event',
    name: 'NASA MODIS Terra Flood / Inundation (Bands 7-2-1)',
    shortName: 'MODIS Flood (7-2-1)',
    type: 'event',
    getUrl: (date) => `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_Bands721/default/${date}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`,
    attribution: 'Imagery &copy; NASA GIBS / EOSDIS MODIS Terra (Bands 7-2-1 FalseColor)',
    maxNativeZoom: 9,
    maxZoom: 18,
    badge: 'Flood NIR/SWIR',
    description: 'False Color SWIR/NIR composite optimized for flood detection: water is dark black/blue, mud is dark brown, vegetation is bright green.'
  },
  terra_truecolor_event: {
    id: 'terra_truecolor_event',
    name: 'NASA MODIS Terra TrueColor (Event)',
    shortName: 'Terra TrueColor',
    type: 'event',
    getUrl: (date) => `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/${date}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`,
    attribution: 'Imagery &copy; NASA GIBS / EOSDIS MODIS Terra TrueColor',
    maxNativeZoom: 9,
    maxZoom: 18,
    badge: 'NASA 250m TrueColor',
    description: 'Natural optical RGB during active monsoon cloudburst/inundation event.'
  },
  aqua_truecolor_event: {
    id: 'aqua_truecolor_event',
    name: 'NASA MODIS Aqua TrueColor (Event)',
    shortName: 'Aqua TrueColor',
    type: 'event',
    getUrl: (date) => `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Aqua_CorrectedReflectance_TrueColor/default/${date}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`,
    attribution: 'Imagery &copy; NASA GIBS / EOSDIS MODIS Aqua TrueColor',
    maxNativeZoom: 9,
    maxZoom: 18,
    badge: 'Aqua NRT Afternoon',
    description: 'Afternoon pass TrueColor reflectance during active high-discharge monsoon event.'
  }
};

/**
 * Controller to smoothly animate map center and zoom when presets change.
 */
function MapViewController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (!center) return;
    map.flyTo(center, zoom, {
      duration: 1.4,
      easeLinearity: 0.25
    });
  }, [center, zoom, map]);
  return null;
}

/**
 * SplitClipController — Hardware-accelerated split-screen swipe shader/clipper.
 * Connects directly to Leaflet layer container and containerPointToLayerPoint
 * to achieve 60fps synchronous swipe clipping during both pan, zoom, and slider dragging.
 */
function SplitClipController({ eventLayerRef, sliderPos, mode }) {
  const map = useMap();

  const applyClip = useCallback(() => {
    if (!eventLayerRef.current) return;
    const container = eventLayerRef.current.getContainer?.() || eventLayerRef.current._container;
    if (!container) return;

    if (mode !== 'split') {
      container.style.clipPath = '';
      container.style.clip = '';
      return;
    }

    const size = map.getSize();
    if (!size || size.x === 0) return;

    const splitPx = (sliderPos / 100) * size.x;
    const nw = map.containerPointToLayerPoint([splitPx, 0]);
    const clipX = Math.round(nw.x);

    // Reveal Event (Active Flood) layer on the RIGHT of split line
    // Reveal Baseline layer on the LEFT of split line
    container.style.clipPath = `polygon(${clipX}px -50000px, 100000px -50000px, 100000px 50000px, ${clipX}px 50000px)`;
    container.style.clip = `rect(0px, 99999px, 99999px, ${clipX}px)`;
  }, [map, eventLayerRef, sliderPos, mode]);

  useEffect(() => {
    applyClip();
    map.on('move', applyClip);
    map.on('zoom', applyClip);
    map.on('viewreset', applyClip);
    map.on('resize', applyClip);

    // Polling safety check for newly added tile DOM containers
    const interval = setInterval(applyClip, 300);

    return () => {
      clearInterval(interval);
      map.off('move', applyClip);
      map.off('zoom', applyClip);
      map.off('viewreset', applyClip);
      map.off('resize', applyClip);
    };
  }, [map, applyClip]);

  return null;
}

/**
 * ModisCompareMap — Interactive Before & After Satellite Flood Comparison Map
 */
export function ModisCompareMap({
  selectedPreset = 'kedarnath',
  onPresetChange,
  initialBaselineDate = '2023-05-15',
  initialEventDate = '2023-08-14',
  className = '',
  height = '580px',
  onExportBriefing
}) {
  const { isDark } = useThemeStore();
  const mapContainerRef = useRef(null);
  const mapWrapperRef = useRef(null);
  const eventLayerRef = useRef(null);

  // Map state
  const [activePresetKey, setActivePresetKey] = useState(selectedPreset);
  const activePreset = COORDINATE_PRESETS[activePresetKey] || COORDINATE_PRESETS.kedarnath;

  // Comparison & Split Slider State
  const [sliderPos, setSliderPos] = useState(50); // percentage 0-100
  const [isDragging, setIsDragging] = useState(false);
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'blend'
  const [opacity, setOpacity] = useState(1.0); // 0 to 1
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showStations, setShowStations] = useState(true);

  // Layers & Dates State
  const [baselineDate, setBaselineDate] = useState(initialBaselineDate);
  const [eventDate, setEventDate] = useState(initialEventDate);
  const [baselineLayerId, setBaselineLayerId] = useState('esri_world');
  const [eventLayerId, setEventLayerId] = useState('terra_bands721_event');

  // Sync external preset changes
  useEffect(() => {
    if (selectedPreset && COORDINATE_PRESETS[selectedPreset]) {
      setActivePresetKey(selectedPreset);
    }
  }, [selectedPreset]);

  const handlePresetSelect = (key) => {
    setActivePresetKey(key);
    if (onPresetChange) onPresetChange(key);
  };

  // Resolve layer URLs
  const baselineConfig = SATELLITE_LAYERS[baselineLayerId] || SATELLITE_LAYERS.esri_world;
  const eventConfig = SATELLITE_LAYERS[eventLayerId] || SATELLITE_LAYERS.terra_bands721_event;

  const baselineTileUrl = useMemo(() => {
    return baselineConfig.getUrl(baselineDate);
  }, [baselineConfig, baselineDate]);

  const eventTileUrl = useMemo(() => {
    return eventConfig.getUrl(eventDate);
  }, [eventConfig, eventDate]);

  // Handle Dragging Divider
  const startDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e) => {
      if (!mapContainerRef.current) return;
      const rect = mapContainerRef.current.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const x = clientX - rect.left;
      const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setSliderPos(Math.round(pct * 10) / 10);
    };

    const handlePointerUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove, { passive: false });
    window.addEventListener('touchend', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [isDragging]);

  // Fullscreen Toggle
  const toggleFullscreen = async () => {
    if (!mapWrapperRef.current) return;
    try {
      if (!document.fullscreenElement) {
        if (mapWrapperRef.current.requestFullscreen) {
          await mapWrapperRef.current.requestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch {
      setIsFullscreen((prev) => !prev);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Quick Date Preset apply
  const applyDatePreset = (preset) => {
    setBaselineDate(preset.baselineDate);
    setEventDate(preset.eventDate);
  };

  return (
    <div
      ref={mapWrapperRef}
      className={`modis-compare-container relative flex flex-col font-sans transition-all duration-300 ${
        isFullscreen
          ? 'fixed inset-0 z-[9999] bg-slate-950 p-4 overflow-y-auto'
          : 'w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-xl'
      } ${className}`}
    >
      {/* ─── Top Control & Preset Selection Bar ───────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md select-none">
        {/* Preset Geographic Coordinates Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1">
            <MapPin size={13} className="text-blue-500" /> Basin:
          </span>
          {Object.entries(COORDINATE_PRESETS).map(([key, item]) => {
            const isActive = activePresetKey === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handlePresetSelect(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 whitespace-nowrap flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 scale-[1.02]'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>{item.name}</span>
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
              </button>
            );
          })}
        </div>

        {/* Action Controls & Fullscreen */}
        <div className="flex items-center gap-2">
          {/* Mode Switch (Split Swipe vs Opacity Blend) */}
          <div className="inline-flex rounded-lg p-0.5 bg-slate-200/70 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1 ${
                viewMode === 'split'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Split swipe slider comparison"
            >
              <ChevronLeft size={13} />
              <ChevronRight size={13} className="-ml-1.5" />
              <span>Swipe</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('blend')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1 ${
                viewMode === 'blend'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Overlay opacity blending"
            >
              <Eye size={13} />
              <span>Blend</span>
            </button>
          </div>

          {/* Toggle Stations */}
          <button
            type="button"
            onClick={() => setShowStations(!showStations)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
              showStations
                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
            }`}
            title="Toggle Hydrological Critical Points"
          >
            <Droplets size={13} />
            <span className="hidden sm:inline">Stations</span>
          </button>

          {/* Reset View */}
          <button
            type="button"
            onClick={() => {
              setSliderPos(50);
              setOpacity(1.0);
            }}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Reset slider and opacity"
          >
            <RotateCcw size={14} />
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* ─── Leaflet Interactive Map Viewport ───────────────────────── */}
      <div
        ref={mapContainerRef}
        style={{ height: isFullscreen ? 'calc(100vh - 220px)' : height }}
        className="relative w-full overflow-hidden bg-slate-950 select-none"
      >
        {/* Floating Overlay Badge: Left = Pre-Flood Baseline */}
        <div className="absolute top-3 left-3 z-[990] max-w-[260px] pointer-events-none transition-all">
          <div className="pointer-events-auto rounded-xl bg-slate-900/90 dark:bg-slate-950/90 text-white backdrop-blur-md p-2.5 border border-slate-700/80 shadow-2xl space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                PRE-MONSOON BASELINE
              </span>
              <span className="text-[10px] text-slate-400 font-mono">{baselineDate}</span>
            </div>
            <p className="text-xs font-semibold text-slate-100 truncate">
              {baselineConfig.name}
            </p>
            <p className="text-[10px] text-slate-400 line-clamp-1">
              {baselineConfig.description}
            </p>
          </div>
        </div>

        {/* Floating Overlay Badge: Right = Active Flood Inundation */}
        <div className="absolute top-3 right-3 z-[990] max-w-[280px] pointer-events-none transition-all">
          <div className="pointer-events-auto rounded-xl bg-slate-900/90 dark:bg-slate-950/90 text-white backdrop-blur-md p-2.5 border border-slate-700/80 shadow-2xl space-y-1 text-right">
            <div className="flex items-center justify-end gap-2">
              <span className="text-[10px] text-amber-400 font-mono">{eventDate}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-widest bg-rose-500/20 text-rose-400 border border-rose-500/30 uppercase flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                ACTIVE INUNDATION
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-100 truncate">
              {eventConfig.name}
            </p>
            <p className="text-[10px] text-slate-400 line-clamp-1">
              {eventConfig.description}
            </p>
          </div>
        </div>

        {/* Leaflet Map */}
        <MapContainer
          center={activePreset.coordinates}
          zoom={activePreset.zoom}
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%' }}
          zoomControl={false}
          attributionControl={false}
        >
          {/* Preset Camera Fly-To Controller */}
          <MapViewController center={activePreset.coordinates} zoom={activePreset.zoom} />

          {/* Baseline Satellite Layer (Underneath) */}
          <TileLayer
            key={`baseline-${baselineLayerId}-${baselineDate}`}
            url={baselineTileUrl}
            attribution={baselineConfig.attribution}
            maxNativeZoom={baselineConfig.maxNativeZoom}
            maxZoom={18}
            className={isDark ? 'brightness-[0.92] contrast-[1.05]' : ''}
          />

          {/* Event / Active Flood Satellite Layer (Clipped or Blended) */}
          <TileLayer
            ref={eventLayerRef}
            key={`event-${eventLayerId}-${eventDate}`}
            url={eventTileUrl}
            attribution={eventConfig.attribution}
            maxNativeZoom={eventConfig.maxNativeZoom}
            maxZoom={18}
            opacity={opacity}
          />

          {/* Synchronous Split Shader / Clipper */}
          <SplitClipController
            eventLayerRef={eventLayerRef}
            sliderPos={sliderPos}
            mode={viewMode}
          />

          {/* Key Hydrological Station Markers */}
          {showStations &&
            activePreset.keyStations?.map((stn, idx) => (
              <Marker
                key={idx}
                position={[stn.lat, stn.lng]}
                icon={createStationIcon(idx === 0 ? '#EF4444' : '#3B82F6')}
              >
                <Popup className="custom-modis-popup">
                  <div className="p-1 space-y-1 font-sans text-xs">
                    <p className="font-bold text-slate-900 dark:text-white">{stn.name}</p>
                    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-200">
                      {stn.status}
                    </span>
                    <p className="text-slate-600 dark:text-slate-300 text-[11px]">{stn.note}</p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Coord: {stn.lat.toFixed(4)}°N, {stn.lng.toFixed(4)}°E
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}
        </MapContainer>

        {/* ─── Split Slider Divider & Draggable Handle ──────────────── */}
        {viewMode === 'split' && (
          <div
            className="absolute top-0 bottom-0 pointer-events-none z-[995]"
            style={{ left: `${sliderPos}%` }}
          >
            {/* The vertical divider line */}
            <div className="absolute top-0 bottom-0 -left-[1.5px] w-[3px] bg-white shadow-[0_0_12px_rgba(0,0,0,0.85)]" />

            {/* Draggable center pill handle */}
            <div
              onPointerDown={startDrag}
              onTouchStart={startDrag}
              className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-11 h-11 rounded-full bg-slate-900/95 text-white border-2 border-white shadow-2xl flex items-center justify-center cursor-ew-resize pointer-events-auto select-none transition-transform duration-100 ${
                isDragging ? 'scale-125 ring-4 ring-blue-500/50' : 'hover:scale-110'
              }`}
              title="Drag left/right to compare Before vs After flood imagery"
            >
              <div className="flex items-center gap-0.5 text-xs font-black tracking-tighter text-blue-400">
                <ChevronLeft size={16} className="-mr-1 text-emerald-400" />
                <ChevronRight size={16} className="-ml-1 text-rose-400" />
              </div>
            </div>

            {/* Split Percentage Tooltip when Dragging */}
            {isDragging && (
              <div className="absolute top-4 -translate-x-1/2 px-2.5 py-1 rounded-full bg-slate-900/95 text-white border border-slate-700 text-[10px] font-mono shadow-xl pointer-events-none whitespace-nowrap">
                Split: {Math.round(sliderPos)}% Flood
              </div>
            )}
          </div>
        )}

        {/* Bottom Map Watermark & NASA GIBS Attribution */}
        <div className="absolute bottom-2 right-2 z-[980] pointer-events-none">
          <div className="rounded-md bg-slate-950/80 px-2 py-1 text-[10px] font-mono text-slate-300 backdrop-blur-sm border border-slate-800 flex items-center gap-2 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>NASA GIBS EPSG:3857 MODIS</span>
          </div>
        </div>
      </div>

      {/* ─── Bottom Navigation, Range Slider & Settings Console ─────── */}
      <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 space-y-4">
        {/* Main Swipe Comparison Scrubber Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 min-w-[140px]">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {viewMode === 'split' ? 'Split Revealer' : 'Overlay Opacity'}
            </span>
          </div>

          {/* Slider Bar */}
          <div className="flex-1 w-full flex items-center gap-3">
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
              Baseline (0%)
            </span>
            <input
              type="range"
              min="0"
              max="100"
              step="0.5"
              value={viewMode === 'split' ? sliderPos : opacity * 100}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (viewMode === 'split') {
                  setSliderPos(val);
                } else {
                  setOpacity(val / 100);
                }
              }}
              className="w-full h-2 rounded-lg bg-slate-200 dark:bg-slate-700 accent-blue-600 cursor-pointer"
            />
            <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 whitespace-nowrap">
              Flood (100%)
            </span>
          </div>

          {/* Quick Snap Positions */}
          <div className="flex items-center gap-1 text-[11px]">
            <button
              type="button"
              onClick={() => {
                if (viewMode === 'split') setSliderPos(0);
                else setOpacity(0);
              }}
              className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition cursor-pointer"
            >
              0%
            </button>
            <button
              type="button"
              onClick={() => {
                if (viewMode === 'split') setSliderPos(50);
                else setOpacity(0.5);
              }}
              className="px-2.5 py-1 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900 font-semibold transition cursor-pointer"
            >
              50% Split
            </button>
            <button
              type="button"
              onClick={() => {
                if (viewMode === 'split') setSliderPos(100);
                else setOpacity(1.0);
              }}
              className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition cursor-pointer"
            >
              100%
            </button>
          </div>
        </div>

        {/* ─── Layer & Date Configuration Grid ──────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Baseline Layer Config (Left Side) */}
          <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-950/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 uppercase tracking-wide">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Baseline (Pre-Flood Reference)
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                Layer 1
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Layer Selection */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Baseline Satellite Layer
                </label>
                <select
                  value={baselineLayerId}
                  onChange={(e) => setBaselineLayerId(e.target.value)}
                  className="w-full text-xs font-medium rounded-lg p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="esri_world">Esri World Imagery (High-Res 1m)</option>
                  <option value="terra_truecolor_baseline">NASA MODIS Terra TrueColor</option>
                  <option value="aqua_truecolor_baseline">NASA MODIS Aqua TrueColor</option>
                </select>
              </div>

              {/* Date Input */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Baseline Date (Pre-Monsoon)
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={baselineDate}
                    max={eventDate}
                    onChange={(e) => setBaselineDate(e.target.value)}
                    className="w-full text-xs font-mono font-medium rounded-lg p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Event / Active Flood Layer Config (Right Side) */}
          <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/5 dark:bg-rose-950/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5 uppercase tracking-wide">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                Active Inundation (Event Imagery)
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                Layer 2
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Layer Selection */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Event Satellite Sensor Layer
                </label>
                <select
                  value={eventLayerId}
                  onChange={(e) => setEventLayerId(e.target.value)}
                  className="w-full text-xs font-medium rounded-lg p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="terra_bands721_event">
                    NASA MODIS Terra (Bands 7-2-1 Flood/Water)
                  </option>
                  <option value="terra_truecolor_event">NASA MODIS Terra TrueColor</option>
                  <option value="aqua_truecolor_event">NASA MODIS Aqua TrueColor</option>
                </select>
              </div>

              {/* Date Input */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Event Date (Cloudburst / Surge)
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={eventDate}
                    min={baselineDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full text-xs font-mono font-medium rounded-lg p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Historical Flood Scenarios Quick Selector ─────────────── */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200/80 dark:border-slate-800/80">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1">
            <Calendar size={13} className="text-amber-500" /> Disaster Scenarios:
          </span>
          {DATE_PRESETS.map((preset) => {
            const isMatch = baselineDate === preset.baselineDate && eventDate === preset.eventDate;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyDatePreset(preset)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium tracking-wide transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
                  isMatch
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>{preset.label}</span>
                <span className="text-[10px] opacity-75 font-mono">({preset.sub})</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ModisCompareMap;
