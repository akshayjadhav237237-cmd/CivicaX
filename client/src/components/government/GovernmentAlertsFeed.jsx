import { useState, useEffect } from 'react';
import {
  Satellite, AlertTriangle, AlertCircle, Flame, Waves, Wind,
  Mountain, Zap, RefreshCw, Globe, Activity, Info,
  CheckCircle, CheckCircle2, XCircle, Shield, Clock, Wifi
} from 'lucide-react';

import { GlassCard } from '../ui/GlassCard';
import { GlassButton } from '../ui/GlassButton';
import { GlassBadge } from '../ui/GlassBadge';
import api from '../../services/api';
import toast from 'react-hot-toast';

const EVENT_ICONS = {
  wildfire: Flame,
  flood: Waves,
  severe_storm: Wind,
  landslide: Mountain,
  volcanic: Zap,
  natural_event: Globe,
};

const SEVERITY_STYLES = {
  critical: 'bg-red-500/20 text-red-700 border-red-400/40',
  high:     'bg-orange-500/20 text-orange-700 border-orange-400/40',
  medium:   'bg-yellow-500/20 text-yellow-700 border-yellow-400/40',
  low:      'bg-green-500/20 text-green-700 border-green-400/40',
};

export function GovernmentAlertsFeed({ onDispatch }) {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [firmsConfigured, setFirmsConfigured] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => { fetchEvents(); }, []);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/government/satellite-events');
      setEvents(res.data.data || []);
    } catch (err) {
      // Check if FIRMS is unconfigured via health endpoint
      if (err.response?.status === 403) return;
      toast.error('Failed to load satellite feed');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1,2,3].map(i => (
          <div key={i} className="glass-card p-5 animate-pulse">
            <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"/>
            <div className="h-3 bg-slate-100 rounded w-1/2"/>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* EONET always-on banner */}
      <div className="glass-card p-3 flex items-center gap-2 bg-green-50/60 border-green-200">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/>
        <p className="text-xs text-green-700 font-medium">🛰️ NASA EONET live feed active — updates every 15 min (no API key required)</p>
      </div>

      {/* FIRMS unconfigured notice */}
      {!firmsConfigured && (
        <div className="glass-card p-3 bg-amber-50/60 border-amber-200">
          <p className="text-xs text-amber-700 font-medium">🔥 NASA FIRMS fire data requires a free key — set NASA_FIRMS_MAP_KEY in .env to enable</p>
          <a href="https://firms.modaps.eosdis.nasa.gov/api/map_key/" target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline">Register free API key →</a>
        </div>
      )}

      {/* Refresh */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">
          {events.length} Active Event{events.length !== 1 ? 's' : ''} (last 48h)
        </h3>
        <button onClick={fetchEvents} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {events.length === 0 && (
        <div className="glass-card p-8 text-center">
          <Satellite size={32} className="mx-auto text-slate-300 mb-3"/>
          <p className="text-slate-500 text-sm">No active satellite events in the last 48 hours</p>
          <p className="text-slate-400 text-xs mt-1">EONET is being polled every 15 minutes</p>
        </div>
      )}

      {events.map(event => {
        const Icon = EVENT_ICONS[event.eventType] || Globe;
        const severityStyle = SEVERITY_STYLES[event.severity] || SEVERITY_STYLES.low;
        const isExpanded = expandedId === event.id;

        return (
          <div
            key={event.id}
            className={`glass-card p-4 border-l-4 transition-all duration-200 cursor-pointer ${
              event.severity === 'critical' ? 'border-l-red-500' :
              event.severity === 'high'     ? 'border-l-orange-400' :
              event.severity === 'medium'   ? 'border-l-yellow-400' : 'border-l-green-400'
            }`}
            onClick={() => setExpandedId(isExpanded ? null : event.id)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1">
                <div className={`p-2 rounded-lg ${severityStyle} border flex-shrink-0`}>
                  <Icon size={16}/>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-slate-800 text-sm leading-tight">{event.title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${severityStyle}`}>
                      {event.severity.toUpperCase()}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                      {event.source}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {event.latitude && event.longitude
                      ? `📍 ${event.latitude.toFixed(3)}°N, ${event.longitude.toFixed(3)}°E`
                      : '📍 Location not specified'}
                    {' · '}
                    {new Date(event.detectedAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
                  </p>
                </div>
              </div>
              <GlassButton
                size="sm"
                variant="primary"
                onClick={(e) => { e.stopPropagation(); onDispatch && onDispatch(event); }}
                className="flex-shrink-0 text-xs"
              >
                Dispatch
              </GlassButton>
            </div>

            {/* Expanded situational description */}
            {isExpanded && event.situationalDesc && (
              <div className="mt-3 pt-3 border-t border-slate-200/60">
                <p className="text-xs text-slate-600 leading-relaxed">{event.situationalDesc}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
