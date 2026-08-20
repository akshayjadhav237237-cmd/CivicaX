import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Bell, Menu, Search, Sun, Moon, MapPin, AlertCircle, 
  FileText, ShieldAlert, Loader2, X, Sparkles, ArrowRight 
} from 'lucide-react';
import { useNotificationStore } from '../../stores/notificationStore';
import { useAuth } from '../../hooks/useAuth';
import { useThemeStore } from '../../stores/themeStore';
import { GlassDrawer } from '../ui/GlassDrawer';
import { GlassTimeline } from '../ui/GlassTimeline';
import api from '../../services/api';

// Instant local search database for Kedarnath Valley, Street Micro-Zones, Alerts, Civic & Safety reports
const LOCAL_SEARCH_DATABASE = [
  // Street-Level Micro-Zones (Kedarnath Valley)
  {
    type: 'zone',
    id: 'zone-mandakini-ghat-001',
    title: 'Mandakini Riverfront Ghat Road • Ward 1',
    subtitle: '1.85m inundation depth • 3.8 m/s surge • Mandatory evacuation ordered.',
    level: 'red',
    keywords: ['mandakini', 'riverfront', 'ghat', 'road', 'ward 1', 'temple', 'kedarnath', 'red', 'depth', '1.85m', 'surge'],
    url: '/emergency?zone=zone-mandakini-ghat-001',
  },
  {
    type: 'zone',
    id: 'zone-temple-bazaar-002',
    title: 'Temple Bazaar Marg • Central Precinct',
    subtitle: '0.75m inundation depth • 2.4 m/s • Narrow corridor backwater drainage choke.',
    level: 'orange',
    keywords: ['temple', 'bazaar', 'marg', 'market', 'central', 'precinct', 'orange', '0.75m', 'kedarnath'],
    url: '/emergency?zone=zone-temple-bazaar-002',
  },
  {
    type: 'zone',
    id: 'zone-saraswati-bridge-003',
    title: 'Saraswati Sangam Bridge • Sector 2',
    subtitle: '0.30m depth • 1.6 m/s • Swirling current pedestrian crossing watch.',
    level: 'yellow',
    keywords: ['saraswati', 'sangam', 'bridge', 'sector 2', 'crossing', 'yellow', '0.30m', 'confluence'],
    url: '/emergency?zone=zone-saraswati-bridge-003',
  },
  {
    type: 'zone',
    id: 'zone-upper-helipad-004',
    title: 'Upper Helipad Ridge • Safe Haven Base',
    subtitle: '0.00m depth • Safe high ground ridge • Medical triage & helicopter staging.',
    level: 'green',
    keywords: ['helipad', 'ridge', 'safe', 'haven', 'upper', 'airlift', 'green', 'triage'],
    url: '/emergency?zone=zone-upper-helipad-004',
  },
  {
    type: 'zone',
    id: 'zone-rambara-bridge-005',
    title: 'Rambara Bridge & Gorge Crossing',
    subtitle: '1.20m inundation depth • 4.1 m/s debris slurry • Critical gorge chokepoint.',
    level: 'red',
    keywords: ['rambara', 'bridge', 'gorge', 'crossing', 'red', '1.20m', 'landslide', 'debris', 'trail'],
    url: '/emergency?zone=zone-rambara-bridge-005',
  },
  {
    type: 'zone',
    id: 'zone-lincholi-track-006',
    title: 'Lincholi Track • Mid-Valley Route',
    subtitle: '0.60m depth • 2.2 m/s • Mountain runoff cascading across paved mule path.',
    level: 'orange',
    keywords: ['lincholi', 'track', 'route', 'trail', 'mid-valley', 'orange', '0.60m', 'mule'],
    url: '/emergency?zone=zone-lincholi-track-006',
  },
  {
    type: 'zone',
    id: 'zone-gaurikund-kund-007',
    title: 'Gaurikund Kund Road • Thermal Springs',
    subtitle: '0.50m depth • 2.0 m/s • Mandakini riverbank seepage at lower hot spring pools.',
    level: 'orange',
    keywords: ['gaurikund', 'kund', 'road', 'lane', 'thermal', 'springs', 'bath', 'orange', '0.50m'],
    url: '/emergency?zone=zone-gaurikund-kund-007',
  },
  {
    type: 'zone',
    id: 'zone-gaurikund-bus-008',
    title: 'Gaurikund Bus Terminal & Taxi Stand',
    subtitle: '0.25m depth • 1.2 m/s • Vehicle staging loop culvert overflow watch.',
    level: 'yellow',
    keywords: ['gaurikund', 'bus', 'terminal', 'taxi', 'stand', 'parking', 'yellow', '0.25m'],
    url: '/emergency?zone=zone-gaurikund-bus-008',
  },
  {
    type: 'zone',
    id: 'zone-sonprayag-bay-009',
    title: 'Sonprayag Shuttle Bay • NH-107 Junction',
    subtitle: '0.05m depth • Safe staging post • Motorway transit operating normally.',
    level: 'green',
    keywords: ['sonprayag', 'shuttle', 'bay', 'nh-107', 'junction', 'confluence', 'green'],
    url: '/emergency?zone=zone-sonprayag-bay-009',
  },

  // Active Alerts
  {
    type: 'alert',
    id: 'alert-chorabari-red',
    title: 'RED ALERT: Mandakini Riverfront & Ghat Road Overflow',
    subtitle: 'Surge rate 420 m³/s. Inundation depth 1.85m. Immediate mandatory evacuation.',
    level: 'red',
    keywords: ['alert', 'breach', 'overflow', 'evacuation', 'mandakini', 'ghat', 'kedarnath', 'flood', 'red'],
    url: '/emergency?alert=alert-chorabari-red',
  },
  {
    type: 'alert',
    id: 'alert-rambara-orange',
    title: 'ORANGE WARNING: Rambara Bridge Slope Debris Flow',
    subtitle: 'Soil saturation at 84%. Inundation 1.20m. Trek path suspended at Rambara.',
    level: 'orange',
    keywords: ['alert', 'rambara', 'landslide', 'debris', 'warning', 'orange', 'bridge', 'trail'],
    url: '/emergency?alert=alert-rambara-orange',
  },
  {
    type: 'alert',
    id: 'alert-gaurikund-yellow',
    title: 'YELLOW WATCH: High Inflow at Gaurikund Kund Lane',
    subtitle: 'Rainfall exceeding 48mm/hr. River monitoring telemetry active.',
    level: 'yellow',
    keywords: ['alert', 'gaurikund', 'inflow', 'rain', 'watch', 'yellow', 'kund'],
    url: '/emergency?alert=alert-gaurikund-yellow',
  },

  // Civic Reports
  {
    type: 'civic',
    id: 'CIV-2026-081',
    title: 'CIV-2026-081 • Pothole / Trek Compaction',
    subtitle: 'Trek path rockfall cleared & compacted near Rambara bridge.',
    status: 'in_progress',
    keywords: ['civ-2026-081', 'civ-81', 'civic', 'pothole', 'trail', 'rambara', 'compaction'],
    url: '/civic?report=CIV-2026-081',
  },
  {
    type: 'civic',
    id: 'CIV-2026-084',
    title: 'CIV-2026-084 • Water Pipeline Repair',
    subtitle: 'High-pressure water main pipeline isolated and clamp fitted at Kedarnath Base.',
    status: 'in_progress',
    keywords: ['civ-2026-084', 'civ-84', 'civic', 'water', 'pipeline', 'kedarnath'],
    url: '/civic?report=CIV-2026-084',
  },
  {
    type: 'civic',
    id: 'CIV-2026-085',
    title: 'CIV-2026-085 • Drainage & Culvert Clearance',
    subtitle: 'Stormwater culvert de-silting emergency team mobilized at Sonprayag.',
    status: 'resolved',
    keywords: ['civ-2026-085', 'civ-85', 'civic', 'drainage', 'culvert', 'sonprayag'],
    url: '/civic?report=CIV-2026-085',
  },
  {
    type: 'civic',
    id: 'CIV-2026-082',
    title: 'CIV-2026-082 • Streetlighting Restoration',
    subtitle: 'Solar streetlamps high-mast work order at Gaurikund transit hub.',
    status: 'assigned',
    keywords: ['civ-2026-082', 'civ-82', 'civic', 'streetlight', 'lighting', 'gaurikund'],
    url: '/civic?report=CIV-2026-082',
  },

  // Safety Reports
  {
    type: 'safety',
    id: 'SAF-2026-012',
    title: 'SAF-2026-012 • Hazard & Debris Observation',
    subtitle: 'Rockfall debris accumulation near Lincholi rest point. Trekker detour.',
    urgency: 'high',
    status: 'verified',
    keywords: ['saf-2026-012', 'saf-12', 'safety', 'hazard', 'debris', 'lincholi'],
    url: '/safety?incident=SAF-2026-012',
  },
  {
    type: 'safety',
    id: 'SAF-2026-015',
    title: 'SAF-2026-015 • High Water Level Alert',
    subtitle: 'Surging river level reported near Mandakini Riverfront Ghat Road.',
    urgency: 'immediate',
    status: 'investigating',
    keywords: ['saf-2026-015', 'saf-15', 'safety', 'bridge', 'river', 'mandakini', 'ghat'],
    url: '/safety?incident=SAF-2026-015',
  },
];

const POPULAR_SUGGESTIONS = [
  { label: 'Mandakini Ghat (Red: 1.85m)', url: '/emergency?zone=zone-mandakini-ghat-001', type: 'zone' },
  { label: 'Temple Bazaar Marg (0.75m)', url: '/emergency?zone=zone-temple-bazaar-002', type: 'zone' },
  { label: 'Saraswati Bridge (0.30m)', url: '/emergency?zone=zone-saraswati-bridge-003', type: 'zone' },
  { label: 'Rambara Bridge (Red: 1.20m)', url: '/emergency?zone=zone-rambara-bridge-005', type: 'zone' },
  { label: 'Gaurikund Kund Road (0.50m)', url: '/emergency?zone=zone-gaurikund-kund-007', type: 'zone' },
  { label: 'Helipad Safe Haven (Safe)', url: '/emergency?zone=zone-upper-helipad-004', type: 'zone' },
  { label: 'CIV-2026-081', url: '/civic?report=CIV-2026-081', type: 'civic' },
  { label: 'SAF-2026-012', url: '/safety?incident=SAF-2026-012', type: 'safety' },
];

function performLocalSearch(q) {
  const query = q.toLowerCase().trim();
  if (!query) return [];
  return LOCAL_SEARCH_DATABASE.filter(item => {
    if (item.id.toLowerCase().includes(query)) return true;
    if (item.title.toLowerCase().includes(query)) return true;
    if (item.subtitle.toLowerCase().includes(query)) return true;
    if (item.keywords?.some(k => k.toLowerCase().includes(query))) return true;
    return false;
  });
}

export function TopBar({ onMenuClick }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDark, toggleTheme } = useThemeStore();
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const notifications = useNotificationStore((state) => state.notifications);
  const markAsRead = useNotificationStore((state) => state.markAsRead);
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead);
  const fetchNotifications = useNotificationStore((state) => state.fetchNotifications);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchContainerRef = useRef(null);
  const inputRef = useRef(null);
  const mobileInputRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Focus input when mobile search expands
  useEffect(() => {
    if (isSearchExpanded) {
      setTimeout(() => mobileInputRef.current?.focus(), 100);
    }
  }, [isSearchExpanded]);

  // Handle outside click to close search dropdown & mobile search
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
        setIsSearchExpanded(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Instant local matching + debounced API search query
  const executeSearch = useCallback((rawQuery) => {
    const q = rawQuery.trim();
    if (!q) {
      setSearchResults([]);
      return;
    }

    // 1. Instant local fallback matching (0ms response)
    const localMatches = performLocalSearch(q);
    setSearchResults(localMatches);
    setIsDropdownOpen(true);
  }, []);

  const handleQueryChange = (val) => {
    setSearchQuery(val);
    executeSearch(val);
  };

  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) return;

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.get(`/emergency/search?q=${encodeURIComponent(q)}`);
        const remoteData = res.data?.data || res.data || [];
        if (Array.isArray(remoteData) && remoteData.length > 0) {
          // Merge API results with local results, avoiding duplicate IDs/URLs
          setSearchResults(prev => {
            const seen = new Set();
            const combined = [];
            for (const item of [...remoteData, ...prev]) {
              const key = item.url || item.id || item.title;
              if (!seen.has(key)) {
                seen.add(key);
                combined.push(item);
              }
            }
            return combined;
          });
        }
      } catch (err) {
        console.warn('Live API search fallback used:', err.message);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectResult = (result) => {
    setIsDropdownOpen(false);
    setIsSearchExpanded(false);
    setSearchQuery('');
    if (result.url) {
      navigate(result.url);
    }
  };

  const handleNotificationClick = (id) => {
    markAsRead(id);
  };

  const pathMap = {
    '/dashboard':  'Dashboard',
    '/emergency':  'Emergency Responder',
    '/civic':      'Civic Manager',
    '/safety':     'Safety Watch',
    '/government': 'Command Center',
    '/alerts':     'Alert History',
    '/profile':    'User Profile',
    '/admin':      'Admin Panel',
  };
  const title = pathMap[location.pathname] || 'CivicaX';

  const notificationEvents = (Array.isArray(notifications) ? notifications : []).map(n => ({
    id: n.id,
    label: n.title,
    description: n.body,
    timestamp: n.createdAt,
    color: n.isRead ? (isDark ? '#64748B' : '#94A3B8') : (isDark ? '#60A5FA' : '#2563EB'),
  }));

  return (
    <>
      <header
        className="h-16 w-full flex items-center justify-between px-4 sm:px-8 sticky top-0 z-30 shadow-sm"
        style={{
          background: 'var(--bg-nav)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '1px solid var(--bg-card-border)',
        }}
      >
        <div className="flex items-center gap-4">
          <button
            className="md:hidden p-2 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
            style={{ color: 'var(--text-primary)' }}
            onClick={onMenuClick}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <h2
            className="text-xl font-bold tracking-tight"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}
          >
            {title}
          </h2>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          {/* Universal Search Container */}
          <div className="flex items-center relative" ref={searchContainerRef}>
            {/* Mobile Search Toggle Button */}
            <button
              onClick={() => {
                setIsSearchExpanded(!isSearchExpanded);
                if (!isSearchExpanded) setIsDropdownOpen(true);
              }}
              className="sm:hidden p-2.5 rounded-full transition-all cursor-pointer hover:border-blue-500/50"
              style={{
                background: 'var(--input-bg)',
                border: '1px solid var(--input-border)',
                color: 'var(--text-primary)',
              }}
              aria-label="Toggle search"
            >
              <Search size={16} />
            </button>

            {/* Mobile Expanded Overlay Search Bar */}
            {isSearchExpanded && (
              <div 
                className="sm:hidden fixed inset-x-2 top-2 z-50 p-2 rounded-2xl shadow-2xl border"
                style={{
                  background: 'var(--bg-card)',
                  backdropFilter: 'blur(28px)',
                  borderColor: 'var(--bg-card-border)',
                }}
              >
                <div 
                  className="flex items-center rounded-xl px-3 py-2 border shadow-inner"
                  style={{
                    background: 'var(--input-bg)',
                    borderColor: 'var(--input-border)',
                  }}
                >
                  <Search size={16} className="text-blue-500 flex-shrink-0 mr-2" />
                  <input
                    ref={mobileInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleQueryChange(e.target.value)}
                    onFocus={() => setIsDropdownOpen(true)}
                    placeholder="Search Kedarnath, CIV-, SAF-..."
                    className="bg-transparent border-none outline-none text-sm w-full"
                    style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => handleQueryChange('')} 
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X size={14} />
                    </button>
                  )}
                  <button 
                    onClick={() => setIsSearchExpanded(false)}
                    className="ml-2 px-2 py-1 text-xs font-bold rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {/* Desktop Search Bar */}
            <div
              className="hidden sm:flex items-center rounded-full px-3.5 py-1.5 shadow-sm transition-all focus-within:ring-2 focus-within:ring-blue-500/30 focus-within:border-blue-500"
              style={{
                background: 'var(--input-bg)',
                border: '1px solid var(--input-border)',
                minWidth: '260px'
              }}
            >
              {isSearching ? (
                <Loader2 size={16} className="animate-spin text-blue-500 flex-shrink-0" />
              ) : (
                <Search size={16} style={{ color: 'var(--text-secondary)' }} className="flex-shrink-0" />
              )}
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => handleQueryChange(e.target.value)}
                onFocus={() => setIsDropdownOpen(true)}
                onClick={() => setIsDropdownOpen(true)}
                placeholder="Search ID, Zone, or Incident..."
                className="bg-transparent border-none outline-none text-sm px-2 w-full"
                style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}
              />
              {searchQuery && (
                <button 
                  onClick={() => handleQueryChange('')} 
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Live Search Dropdown */}
            {isDropdownOpen && (
              <div
                className={`absolute right-0 ${
                  isSearchExpanded ? 'top-16 w-[calc(100vw-24px)] fixed left-3 sm:static' : 'top-12 mt-1 w-84 sm:w-96'
                } max-h-[420px] overflow-y-auto rounded-2xl p-2.5 shadow-2xl z-50 border`}
                style={{
                  background: 'var(--bg-card)',
                  backdropFilter: 'blur(24px)',
                  borderColor: 'var(--bg-card-border)',
                }}
              >
                {!searchQuery.trim() ? (
                  // Quick Suggestions when input is focused with no query
                  <div className="p-2">
                    <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <Sparkles size={12} className="text-blue-500" />
                      Popular Quick Searches
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {POPULAR_SUGGESTIONS.map((sug, i) => (
                        <button
                          key={i}
                          onClick={() => handleSelectResult(sug)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800/80 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/60 dark:hover:text-blue-300 transition-colors flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-200"
                        >
                          {sug.type === 'zone' && <MapPin size={11} className="text-blue-500" />}
                          {sug.type === 'civic' && <FileText size={11} className="text-amber-500" />}
                          {sug.type === 'safety' && <ShieldAlert size={11} className="text-purple-500" />}
                          <span>{sug.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="p-5 text-center text-xs text-slate-500 dark:text-slate-400">
                    No results found for "{searchQuery}". Try "Kedarnath", "Chorabari", "Rambara", "CIV-", or "SAF-".
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <span>Matches ({searchResults.length})</span>
                      <span className="text-[9px] font-mono text-blue-500">Instant Local Telemetry</span>
                    </div>

                    {searchResults.map((item, idx) => {
                      const isZone = item.type === 'zone';
                      const isAlert = item.type === 'alert';
                      const isCivic = item.type === 'civic';
                      const isSafety = item.type === 'safety';

                      return (
                        <button
                          key={idx}
                          onClick={() => handleSelectResult(item)}
                          className="w-full text-left p-2.5 rounded-xl transition-all hover:bg-black/5 dark:hover:bg-white/10 flex items-start gap-2.5 cursor-pointer group"
                        >
                          <div className={`mt-0.5 p-2 rounded-xl flex-shrink-0 ${
                            isZone ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400' :
                            isAlert ? 'bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400' :
                            isCivic ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400' :
                            'bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400'
                          }`}>
                            {isZone && <MapPin size={15} />}
                            {isAlert && <AlertCircle size={15} />}
                            {isCivic && <FileText size={15} />}
                            {isSafety && <ShieldAlert size={15} />}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1.5">
                              <span 
                                className="text-xs font-bold truncate text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
                                style={{ fontFamily: 'var(--font-heading)' }}
                              >
                                {item.title}
                              </span>

                              {item.level && (
                                <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded flex-shrink-0 ${
                                  item.level === 'red' ? 'bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300' :
                                  item.level === 'orange' ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/80 dark:text-orange-300' :
                                  item.level === 'yellow' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/80 dark:text-yellow-300' :
                                  'bg-green-100 text-green-800 dark:bg-green-950/80 dark:text-green-300'
                                }`}>
                                  {item.level}
                                </span>
                              )}

                              {item.status && (
                                <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex-shrink-0">
                                  {item.status.replace('_', ' ')}
                                </span>
                              )}

                              {item.urgency && (
                                <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded flex-shrink-0 ${
                                  item.urgency === 'immediate' ? 'bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300' :
                                  'bg-orange-100 text-orange-700 dark:bg-orange-950/80 dark:text-orange-300'
                                }`}>
                                  {item.urgency}
                                </span>
                              )}
                            </div>

                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 leading-snug">
                              {item.subtitle}
                            </p>

                            <div className="flex items-center gap-1 mt-1 text-[10px] text-blue-600 dark:text-blue-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                              <span>Jump to module</span>
                              <ArrowRight size={10} />
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-full transition-all duration-300 hover:scale-105 shadow-sm cursor-pointer"
            style={{
              background: isDark ? 'rgba(51, 65, 85, 0.7)' : 'rgba(241, 245, 249, 0.9)',
              border: isDark ? '1px solid rgba(148, 163, 184, 0.3)' : '1px solid rgba(203, 213, 225, 0.8)',
            }}
            aria-label="Toggle dark mode"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark
              ? <Sun size={18} color="#F59E0B" />
              : <Moon size={18} color="#4F46E5" />
            }
          </button>

          {/* Notification Bell */}
          <button
            className="relative p-2.5 rounded-full shadow-sm transition-all cursor-pointer hover:border-blue-500/50"
            style={{
              background: 'var(--input-bg)',
              border: '1px solid var(--input-border)',
            }}
            onClick={() => { fetchNotifications(); setIsDrawerOpen(true); }}
            aria-label="View notifications"
          >
            <Bell size={18} style={{ color: 'var(--text-primary)' }} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 min-w-5 px-1 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-900">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Avatar */}
          <div
            className="hidden sm:flex w-9 h-9 items-center justify-center rounded-full font-bold text-sm border-2 shadow-sm cursor-help select-none"
            style={{
              background: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.12)',
              color: isDark ? '#60A5FA' : '#2563EB',
              borderColor: isDark ? 'rgba(59, 130, 246, 0.4)' : 'rgba(59, 130, 246, 0.25)',
            }}
            title={`${user?.name || 'User'} (${user?.role || 'Citizen'})`}
          >
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
        </div>
      </header>

      <GlassDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title="Notifications" width="400px">
        <div className="flex items-center justify-between mb-5 pb-3" style={{ borderBottom: '1px solid var(--divider)' }}>
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
            {unreadCount} unread
          </span>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs font-semibold transition-colors cursor-pointer"
              style={{ color: isDark ? '#60A5FA' : '#2563EB' }}
            >
              Mark all read
            </button>
          )}
        </div>
        <div
          className="space-y-1"
          onClick={(e) => {
            const id = e.target.closest('[data-id]')?.dataset.id;
            if (id) handleNotificationClick(id);
          }}
        >
          {notificationEvents.map(event => (
            <div
              key={event.id}
              data-id={event.id}
              className="cursor-pointer p-3 rounded-xl transition-all hover:bg-black/5 dark:hover:bg-white/5"
            >
              <GlassTimeline events={[event]} />
            </div>
          ))}
          {notificationEvents.length === 0 && (
            <p className="text-sm text-center py-10" style={{ color: 'var(--text-muted)' }}>
              You're all caught up!
            </p>
          )}
        </div>
      </GlassDrawer>
    </>
  );
}
