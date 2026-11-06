import { useState, useEffect } from 'react';
import {
  WifiOff,
  Wifi,
  PhoneCall,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  MapPin,
  AlertTriangle,
  Radio,
  Minimize2,
  Maximize2,
  Mountain,
  Compass,
} from 'lucide-react';
import {
  EMERGENCY_CONTACTS,
  OFFLINE_SURVIVAL_INSTRUCTIONS,
  getLastSyncTime,
} from '../../services/offlineSync';

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(() => {
    return typeof navigator !== 'undefined' ? !navigator.onLine : false;
  });
  const [showRestoredNotice, setShowRestoredNotice] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [lastSync, setLastSync] = useState(() => getLastSyncTime());

  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true);
      setShowRestoredNotice(false);
      setLastSync(getLastSyncTime());
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate([200, 100, 200]);
        } catch {
          // ignore if vibration blocked
        }
      }
    };

    const handleOnline = () => {
      setIsOffline(false);
      setShowRestoredNotice(true);
      const timer = setTimeout(() => {
        setShowRestoredNotice(false);
      }, 5000);
      return () => clearTimeout(timer);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  // When connection is restored, show brief confirmation badge
  if (showRestoredNotice && !isOffline) {
    return (
      <div className="sticky top-0 z-50 w-full bg-emerald-950/95 border-b border-emerald-500/50 backdrop-blur-md px-4 py-2 text-emerald-200 transition-all duration-300 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <Wifi className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold text-emerald-100">Satellite & Cellular Link Restored</span>
            <span className="hidden md:inline text-emerald-300/80">— Resynchronizing live telemetry and hydrologic models.</span>
          </div>
          <button
            onClick={() => setShowRestoredNotice(false)}
            className="text-emerald-400 hover:text-white text-xs px-2 py-0.5 rounded border border-emerald-500/30 hover:border-emerald-500/60 transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  // Not offline and not restored notice
  if (!isOffline) {
    return null;
  }

  // Minimized floating emergency pill for unobstructed map inspection
  if (isMinimized) {
    return (
      <aside
        aria-label="Offline Mode Active Status"
        className="fixed bottom-4 right-4 z-50 bg-slate-950/90 border border-amber-500/60 rounded-full px-4 py-2.5 shadow-2xl backdrop-blur-xl flex items-center gap-3 animate-pulse"
      >
        <span className="flex h-3 w-3 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
        </span>
        <div className="flex items-center gap-1.5 text-xs text-amber-200 font-medium">
          <WifiOff className="w-3.5 h-3.5 text-amber-400" />
          <span>Offline Mode Active (Cached Telemetry)</span>
        </div>
        <div className="flex items-center gap-1 border-l border-white/10 pl-2">
          <a
            href="tel:1078"
            className="px-2 py-1 bg-red-600/80 hover:bg-red-500 text-white rounded text-[11px] font-bold transition-colors"
            title="Call NDRF Disaster Helpline (1078)"
          >
            NDRF: 1078
          </a>
          <button
            onClick={() => setIsMinimized(false)}
            className="p-1 text-slate-300 hover:text-white rounded hover:bg-white/10 ml-1 transition-colors"
            title="Expand Full Emergency Offline Panel"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside
      aria-label="Offline Emergency Information and Hotline Panel"
      className="sticky top-0 z-50 w-full bg-slate-950/95 border-b border-amber-500/50 backdrop-blur-xl shadow-2xl transition-all duration-300"
    >
      {/* Primary Banner Header Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Core Status */}
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex h-3 w-3 relative shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-80"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
          </span>
          <div className="flex items-center gap-1.5 p-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
            <WifiOff className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm font-bold text-amber-300 tracking-wide">
                Offline Mode Active — Operating from cached satellite telemetry
              </span>
              <span className="hidden sm:inline-block text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-amber-400/15 text-amber-300 border border-amber-400/30">
                Zero Connectivity
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">
              Himalayan emergency vault running • Last satellite sync:{' '}
              {lastSync ? new Date(lastSync).toLocaleTimeString() : 'Current Session'}
            </p>
          </div>
        </div>

        {/* Right: Instant Emergency Contacts & Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {/* Direct dial emergency chips */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs">
            <a
              href="tel:1078"
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-600/90 hover:bg-red-500 text-white font-semibold text-xs transition-colors shadow-sm"
              title="NDRF Flood & Glacial Rescue Helpline"
            >
              <PhoneCall className="w-3 h-3" />
              <span>NDRF 1078</span>
            </a>
            <a
              href="tel:1070"
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-600/90 hover:bg-amber-500 text-white font-semibold text-xs transition-colors shadow-sm"
              title="SDRF Uttarakhand Mountain Search Helpline"
            >
              <PhoneCall className="w-3 h-3" />
              <span>SDRF 1070</span>
            </a>
            <a
              href="tel:108"
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-600/90 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-sm"
              title="Uttarakhand Medical Emergency & Ambulance"
            >
              <PhoneCall className="w-3 h-3" />
              <span>108 Medical</span>
            </a>
            <a
              href="tel:112"
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-600/90 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shadow-sm"
              title="Integrated Emergency Police Command"
            >
              <PhoneCall className="w-3 h-3" />
              <span>112 Police</span>
            </a>
          </div>

          {/* Toggle survival protocols */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-slate-800/80 hover:bg-slate-700/80 text-amber-200 border border-amber-500/30 transition-colors"
            title="Toggle Flash Flood Survival & High-Ground Shelters"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Survival & Shelters</span>
            <span className="sm:hidden">Protocol</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {/* Minimize button */}
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
            title="Minimize to Compact Status Pill"
            aria-label="Minimize offline banner"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expandable Emergency Survival & Shelter Guide */}
      {isExpanded && (
        <div className="border-t border-slate-800/80 bg-slate-900/95 px-4 sm:px-6 py-4 transition-all">
          <div className="max-w-7xl mx-auto space-y-4">
            {/* Mobile Contact Grid for small screens */}
            <div className="lg:hidden">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-amber-400" />
                Instant Emergency Hotlines (One-Tap Dial)
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {EMERGENCY_CONTACTS.map((c) => (
                  <a
                    key={c.number}
                    href={c.tel}
                    className="flex flex-col p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/60 hover:border-amber-500/50 transition-colors group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-slate-400 group-hover:text-amber-300">
                        {c.name.split(' ')[0]}
                      </span>
                      <PhoneCall className="w-3 h-3 text-amber-400" />
                    </div>
                    <span className="text-sm font-extrabold text-white">{c.number}</span>
                    <span className="text-[10px] text-slate-400 line-clamp-1">{c.badge}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Emergency flash flood and high ground protocol */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {/* High Ground Shelter Directions */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-red-500/30 space-y-2">
                <div className="flex items-center gap-2 text-red-400 font-semibold text-xs sm:text-sm">
                  <Mountain className="w-4 h-4 text-red-400 shrink-0" />
                  <span>Kedarnath Valley High-Ground Shelter Coordinates</span>
                </div>
                <ul className="text-xs text-slate-300 space-y-1.5 pl-1">
                  <li className="flex items-start gap-1.5">
                    <span className="font-bold text-amber-400">1.</span>
                    <span>
                      <strong className="text-white">Kedarnath Higher Helipad (3,583m):</strong> Designated primary
                      aerial staging ground. Ascend via the eastern bypass ridge path.
                    </span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="font-bold text-amber-400">2.</span>
                    <span>
                      <strong className="text-white">GMVN High Terrace Shelter:</strong> Reinforced multi-tier complex
                      35m above Mandakini riverbed. Water-resistant structural core.
                    </span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="font-bold text-amber-400">3.</span>
                    <span>
                      <strong className="text-white">Bhairavnath Ridge Base:</strong> Elevated bedrock outcrop outside
                      active debris flow gullies.
                    </span>
                  </li>
                </ul>
              </div>

              {/* Flash Flood Survival Instructions */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-amber-500/30 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs sm:text-sm">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Flash Flood Action Protocol (Offline Instructions)</span>
                </div>
                <div className="text-xs text-slate-300 space-y-1.5">
                  <p>
                    <strong className="text-white">Ascend Immediately:</strong> Move at least 30 meters vertical
                    elevation above riverbeds. Do not pause to pack equipment.
                  </p>
                  <p>
                    <strong className="text-white">Never Cross Glacial Torrents:</strong> 15 cm of fast-moving mountain
                    runoff knocks down adults. 30 cm sweeps four-wheel drives.
                  </p>
                  <p>
                    <strong className="text-white">Emergency SMS Fallback:</strong> Send SMS to{' '}
                    <code className="text-amber-300 bg-amber-950/60 px-1 py-0.5 rounded">112</code> with{' '}
                    <span className="italic text-slate-400">"SOS [Name] [Approx Elevation / Landmark]"</span> — texts
                    frequently transmit through intermittent bursts.
                  </p>
                </div>
              </div>
            </div>

            {/* Offline Telemetry Notes */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 border-t border-slate-800/60 pt-2.5">
              <div className="flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                <span>Operating from local cache storage & Service Worker offline vault. Map tiles rendered in low-power topo grid mode.</span>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-amber-400 hover:text-white font-medium hover:underline"
              >
                Collapse Guide ▲
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

export default OfflineBanner;
