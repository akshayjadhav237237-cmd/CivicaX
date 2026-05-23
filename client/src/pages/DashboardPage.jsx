import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAlertStore } from '../stores/alertStore';
import { AlertTriangle, HardHat, ShieldAlert, ArrowRight, Activity, MapPin, Building2 } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassStat } from '../components/ui/GlassStat';
import { GlassBadge } from '../components/ui/GlassBadge';
import api from '../services/api';
import toast from 'react-hot-toast';

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { activeAlerts, fetchActiveAlerts, isLoadingAlerts } = useAlertStore();

  const [stats, setStats] = useState({
    civicActive: 0, safetyUrgent: 0, safeZonesCapacity: 0, isLoading: true
  });

  useEffect(() => {
    fetchActiveAlerts();
    const fetchStats = async () => {
      try {
        const [civicRes, safetyRes, govRes] = await Promise.all([
          api.get('/civic/stats').catch(() => ({ data: { byStatus: [] } })),
          api.get('/safety/reports').catch(() => ({ data: [] })),
          user?.role === 'government' || user?.role === 'admin'
            ? api.get('/government/impact-summary').catch(() => ({ data: { safeZoneCapacityAvailable: 0 } }))
            : Promise.resolve({ data: { safeZoneCapacityAvailable: 'N/A' } })
        ]);
        const activeCivic = civicRes.data.byStatus?.reduce((acc, curr) =>
          ['submitted', 'assigned', 'in_progress'].includes(curr.status) ? acc + curr._count._all : acc, 0) || 0;
        const urgentSafety = safetyRes.data.filter(r => r.urgency === 'immediate' && r.status !== 'resolved').length || 0;
        setStats({ civicActive: activeCivic, safetyUrgent: urgentSafety, safeZonesCapacity: govRes.data.safeZoneCapacityAvailable || 'N/A', isLoading: false });
      } catch {
        setStats(prev => ({ ...prev, isLoading: false }));
      }
    };
    fetchStats();
  }, [fetchActiveAlerts, user?.role]);

  const activeRedAlerts = activeAlerts.filter(a => a.level === 'red');

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
          Welcome back, {user?.name.split(' ')[0]}
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          CivicaX Intelligence Dashboard • {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Critical Alert Banner */}
      {activeRedAlerts.length > 0 && (
        <GlassCard padding="p-6 sm:p-8" className="border-red-500/50 bg-red-500/10 shadow-[0_8px_32px_rgba(239,68,68,0.15)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/20 blur-[80px] rounded-full pointer-events-none" />
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 relative z-10">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 border-2 border-red-500 text-red-400 shadow-lg shadow-red-500/30 animate-pulse">
              <AlertTriangle size={32} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <GlassBadge level="critical" label="CRITICAL EMERGENCY" className="animate-pulse shadow-sm shadow-red-500/50" />
                <span className="font-bold uppercase tracking-wider text-sm" style={{ color: 'var(--alert-critical-text)' }}>
                  {activeRedAlerts.length} Active Notice{activeRedAlerts.length > 1 ? 's' : ''}
                </span>
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--alert-critical-text)' }}>
                {activeRedAlerts[0].title}
              </h2>
              <p className="font-medium max-w-2xl" style={{ color: 'var(--alert-critical-text)', opacity: 0.8 }}>
                {activeRedAlerts[0].description}
              </p>
            </div>
            <button
              onClick={() => navigate('/emergency')}
              className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg shadow-red-600/30 transition-colors whitespace-nowrap"
            >
              View Map & Routing
            </button>
          </div>
        </GlassCard>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <GlassStat label="Active Alerts" value={isLoadingAlerts ? '...' : activeAlerts.length} icon={Activity} color={activeAlerts.length > 0 ? 'red' : 'blue'} />
        <GlassStat label="Open Civic Issues" value={stats.isLoading ? '...' : stats.civicActive} icon={HardHat} color="orange" />
        <GlassStat label="Urgent Safety Reports" value={stats.isLoading ? '...' : stats.safetyUrgent} icon={ShieldAlert} color={stats.safetyUrgent > 0 ? 'red' : 'green'} />
        <GlassStat label="Relief Capacity" value={stats.isLoading ? '...' : stats.safeZonesCapacity} icon={Building2} color="blue" />
      </div>

      {/* Operations heading */}
      <h3
        className="text-xl font-bold mt-4 pb-2"
        style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', borderBottom: '1px solid var(--divider)' }}
      >
        Operations
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Emergency Card */}
        <GlassCard padding="p-6" className="flex flex-col h-full hover:shadow-[0_12px_48px_rgba(59,130,246,0.15)] transition-shadow cursor-pointer group" onClick={() => navigate('/emergency')}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform" style={{ background: 'rgba(59,130,246,0.15)', color: '#60A5FA' }}>
            <AlertTriangle size={24} />
          </div>
          <h3 className="font-bold text-lg mb-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>Emergency Responder</h3>
          <p className="text-sm flex-1 mb-6" style={{ color: 'var(--text-secondary)' }}>Live early warning satellite feeds, geospatial risk zones, and dynamic evacuation routing.</p>
          <div className="flex items-center font-semibold text-sm text-blue-500 group-hover:gap-2 transition-all">
            Open Map View <ArrowRight size={16} className="ml-1" />
          </div>
        </GlassCard>

        {/* Civic Card */}
        <GlassCard padding="p-6" className="flex flex-col h-full hover:shadow-[0_12px_48px_rgba(249,115,22,0.15)] transition-shadow cursor-pointer group" onClick={() => navigate('/civic')}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform" style={{ background: 'rgba(249,115,22,0.15)', color: '#FB923C' }}>
            <HardHat size={24} />
          </div>
          <h3 className="font-bold text-lg mb-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>Civic Manager</h3>
          <p className="text-sm flex-1 mb-6" style={{ color: 'var(--text-secondary)' }}>Report infrastructure issues, track work resolution timelines, and coordinate with municipal ops.</p>
          <div className="flex items-center font-semibold text-sm text-orange-400 group-hover:gap-2 transition-all">
            Manage Reports <ArrowRight size={16} className="ml-1" />
          </div>
        </GlassCard>

        {/* Safety Card */}
        <GlassCard padding="p-6" className="flex flex-col h-full hover:shadow-[0_12px_48px_rgba(239,68,68,0.15)] transition-shadow cursor-pointer group" onClick={() => navigate('/safety')}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform" style={{ background: 'rgba(239,68,68,0.15)', color: '#F87171' }}>
            <ShieldAlert size={24} />
          </div>
          <h3 className="font-bold text-lg mb-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>Safety Watch</h3>
          <p className="text-sm flex-1 mb-6" style={{ color: 'var(--text-secondary)' }}>Crowdsourced public safety threat reporting with AI credibility scoring and realtime heatmaps.</p>
          <div className="flex items-center font-semibold text-sm text-red-400 group-hover:gap-2 transition-all">
            View Live Threats <ArrowRight size={16} className="ml-1" />
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
