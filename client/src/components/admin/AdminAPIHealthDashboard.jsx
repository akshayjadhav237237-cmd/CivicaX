import { useState, useEffect, useCallback } from 'react';
import {
  Activity, Server, Clock, AlertCircle, AlertTriangle,
  CheckCircle, CheckCircle2, RefreshCw, Wifi, WifiOff,
  Shield, XCircle, Info, Zap, Plus, Trash2,
  ToggleLeft, ToggleRight, Search, Loader2
} from 'lucide-react';

import { GlassButton } from '../ui/GlassButton';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useWebSocket } from '../../hooks/useWebSocket';

const STATUS_CONFIG = {
  healthy:      { icon: CheckCircle2, color: 'text-green-600',  bg: 'bg-green-50',    border: 'border-green-200', label: 'Healthy' },
  degraded:     { icon: AlertCircle,  color: 'text-yellow-600', bg: 'bg-yellow-50',   border: 'border-yellow-200', label: 'Degraded' },
  down:         { icon: XCircle,      color: 'text-red-600',    bg: 'bg-red-50',      border: 'border-red-200', label: 'Down' },
  unconfigured: { icon: Clock,        color: 'text-slate-400',  bg: 'bg-slate-50',    border: 'border-slate-200', label: 'Unconfigured' },
};

function APICard({ log }) {
  const cfg = STATUS_CONFIG[log.status] || STATUS_CONFIG.down;
  const Ic = cfg.icon;
  return (
    <div className={`glass-card p-4 border ${cfg.border} ${cfg.bg}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 leading-tight">{log.apiName}</p>
          <p className="text-xs text-slate-400 mt-0.5 truncate">{log.endpoint?.replace(/https?:\/\//,'')}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Ic size={16} className={cfg.color}/>
          <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
        </div>
      </div>
      {log.responseTimeMs !== null && log.responseTimeMs !== undefined && (
        <p className="text-xs text-slate-500 mt-2">
          ⏱ {log.responseTimeMs}ms response
          {log.responseTimeMs > 2000 && <span className="text-orange-500 ml-1">— slow</span>}
        </p>
      )}
      {log.errorMessage && (
        <p className="text-xs text-red-500 mt-1 truncate" title={log.errorMessage}>{log.errorMessage}</p>
      )}
      {log.checkedAt && (
        <p className="text-xs text-slate-300 mt-1">Checked {new Date(log.checkedAt).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</p>
      )}
    </div>
  );
}

export function AdminAPIHealthDashboard() {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await api.get('/admin/api-health');
      setLogs(res.data.data || []);
      setLastChecked(new Date());
    } catch { /* handled below */ }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  // Live updates via WebSocket
  useWebSocket('admin:api-health-update', (payload) => {
    if (payload?.results) {
      setLogs(payload.results);
      setLastChecked(new Date());
    }
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await api.post('/admin/api-health/refresh');
      setLogs(res.data.data || []);
      setLastChecked(new Date());
      toast.success('Health check complete');
    } catch { toast.error('Health check failed'); }
    finally { setIsRefreshing(false); }
  };

  const healthy = logs.filter(l => l.status === 'healthy').length;
  const down = logs.filter(l => l.status === 'down').length;
  const unconfigured = logs.filter(l => l.status === 'unconfigured').length;

  return (
    <div className="space-y-4">
      {/* Summary row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500"/>
            <span className="text-sm text-slate-600">{healthy} healthy</span>
          </div>
          {down > 0 && <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500"/>
            <span className="text-sm text-red-600 font-medium">{down} down</span>
          </div>}
          {unconfigured > 0 && <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-300"/>
            <span className="text-sm text-slate-500">{unconfigured} unconfigured</span>
          </div>}
          <div className="flex items-center gap-1 text-xs text-green-600">
            <Wifi size={12}/> Live
          </div>
        </div>
        <div className="flex items-center gap-3">
          {lastChecked && <span className="text-xs text-slate-400">Last: {lastChecked.toLocaleTimeString('en-IN')}</span>}
          <GlassButton size="sm" variant="ghost" onClick={handleRefresh} disabled={isRefreshing} className="gap-1 text-xs">
            <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''}/> Refresh Now
          </GlassButton>
        </div>
      </div>

      {/* API cards grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1,2,3,4,5,6,7].map(i => <div key={i} className="h-24 animate-pulse glass-card bg-slate-100/60"/>)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {logs.map(log => <APICard key={log.apiName} log={log}/>)}
        </div>
      )}

      {!isLoading && logs.length === 0 && (
        <div className="text-center py-8 text-slate-400 text-sm">
          No health data yet — health checks run every 2 minutes on server start
        </div>
      )}
    </div>
  );
}
