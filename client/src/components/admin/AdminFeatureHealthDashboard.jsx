import { useState, useEffect, useCallback } from 'react';
import {
  Activity, Server, Clock, AlertCircle, AlertTriangle,
  CheckCircle, CheckCircle2, RefreshCw, Wifi, WifiOff,
  Shield, XCircle, Info, Zap, Plus, Trash2,
  ToggleLeft, ToggleRight, Search, Loader2,
  ChevronDown, ChevronRight
} from 'lucide-react';

import { GlassButton } from '../ui/GlassButton';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useWebSocket } from '../../hooks/useWebSocket';

const STATUS_CONFIG = {
  passing: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50',   dot: 'bg-green-500' },
  warning: { icon: AlertCircle,  color: 'text-yellow-600',bg: 'bg-yellow-50',  dot: 'bg-yellow-500' },
  failing: { icon: XCircle,      color: 'text-red-600',   bg: 'bg-red-50',     dot: 'bg-red-500' },
};

function FeatureRow({ feature }) {
  const cfg = STATUS_CONFIG[feature.status] || STATUS_CONFIG.failing;
  const Ic = cfg.icon;
  return (
    <div className={`flex items-center gap-3 px-3 py-2 rounded-lg ${cfg.bg}`}>
      <Ic size={14} className={cfg.color}/>
      <span className="text-sm text-slate-700 flex-1">{feature.feature}</span>
      {feature.responseMs && (
        <span className={`text-xs ${feature.responseMs > 2000 ? 'text-orange-500' : 'text-slate-400'}`}>
          {feature.responseMs}ms
        </span>
      )}
      {feature.errorMessage && (
        <span className="text-xs text-red-400 max-w-32 truncate" title={feature.errorMessage}>
          {feature.errorMessage}
        </span>
      )}
    </div>
  );
}

function PageGroup({ page, features }) {
  const [isOpen, setIsOpen] = useState(true);
  const failing = features.filter(f => f.status === 'failing').length;
  const warning = features.filter(f => f.status === 'warning').length;
  return (
    <div className="glass-card overflow-hidden">
      <button
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50/50 transition-colors"
        onClick={() => setIsOpen(o => !o)}
      >
        {isOpen ? <ChevronDown size={14} className="text-slate-400"/> : <ChevronRight size={14} className="text-slate-400"/>}
        <span className="font-semibold text-slate-800 font-mono text-sm">{page}</span>
        <span className="text-xs text-slate-400">{features.length} feature{features.length!==1?'s':''}</span>
        {failing > 0 && <span className="ml-auto text-xs text-red-600 font-medium">⚠ {failing} failing</span>}
        {failing === 0 && warning > 0 && <span className="ml-auto text-xs text-yellow-600 font-medium">{warning} slow</span>}
        {failing === 0 && warning === 0 && <span className="ml-auto text-xs text-green-600">✓ All passing</span>}
      </button>
      {isOpen && (
        <div className="px-4 pb-3 space-y-1 border-t border-slate-100/50">
          {features.map(f => <FeatureRow key={`${f.page}:${f.feature}`} feature={f}/>)}
        </div>
      )}
    </div>
  );
}

export function AdminFeatureHealthDashboard() {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);

  const fetchReports = useCallback(async () => {
    try {
      const res = await api.get('/admin/feature-health');
      setReports(res.data.data || []);
      setLastChecked(new Date());
    } catch { /* silently handle */ }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  useWebSocket('admin:feature-health-update', (payload) => {
    if (payload?.results) {
      setReports(payload.results);
      setLastChecked(new Date());
    }
  });

  const handleRunCheck = async () => {
    setIsRunning(true);
    try {
      const res = await api.post('/admin/feature-health/run');
      setReports(res.data.data || []);
      setLastChecked(new Date());
      toast.success('Feature health check complete');
    } catch { toast.error('Check failed'); }
    finally { setIsRunning(false); }
  };

  // Group by page
  const groupedByPage = reports.reduce((acc, r) => {
    const page = r.page || 'system';
    if (!acc[page]) acc[page] = [];
    acc[page].push(r);
    return acc;
  }, {});

  const totalFailing = reports.filter(r => r.status === 'failing').length;
  const totalPassing = reports.filter(r => r.status === 'passing').length;
  const totalWarning = reports.filter(r => r.status === 'warning').length;

  return (
    <div className="space-y-4">
      {/* Failing banner */}
      {totalFailing > 0 && (
        <div className="glass-card p-3 bg-red-50/80 border-red-300 flex items-center gap-3">
          <XCircle size={18} className="text-red-600 flex-shrink-0"/>
          <p className="text-sm text-red-700 font-medium">
            ⚠️ {totalFailing} feature{totalFailing!==1?'s are':' is'} currently failing — investigate immediately
          </p>
        </div>
      )}

      {/* Summary bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4 text-sm">
          <span className="text-green-600 font-medium">{totalPassing} passing</span>
          {totalWarning > 0 && <span className="text-yellow-600">{totalWarning} slow</span>}
          {totalFailing > 0 && <span className="text-red-600 font-medium">{totalFailing} failing</span>}
          <div className="flex items-center gap-1 text-xs text-green-600">
            <Wifi size={12}/> Live
          </div>
        </div>
        <div className="flex items-center gap-3">
          {lastChecked && <span className="text-xs text-slate-400">Last: {lastChecked.toLocaleTimeString('en-IN')}</span>}
          <GlassButton size="sm" variant="ghost" onClick={handleRunCheck} disabled={isRunning} className="gap-1 text-xs">
            <RefreshCw size={12} className={isRunning ? 'animate-spin' : ''}/> Run Check
          </GlassButton>
        </div>
      </div>

      {/* Groups */}
      {isLoading ? (
        <div className="space-y-3">{[1,2,3,4].map(i=><div key={i} className="h-16 animate-pulse glass-card bg-slate-100/60"/>)}</div>
      ) : Object.keys(groupedByPage).length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-sm">
          No feature health data yet — checks run 10 seconds after server start, then every 10 minutes
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(groupedByPage)
            .sort(([, a], [, b]) => {
              const aFail = a.filter(x=>x.status==='failing').length;
              const bFail = b.filter(x=>x.status==='failing').length;
              return bFail - aFail;
            })
            .map(([page, features]) => (
              <PageGroup key={page} page={page} features={features}/>
            ))}
        </div>
      )}
    </div>
  );
}
