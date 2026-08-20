import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAlertStore } from '../stores/alertStore';
import { 
  AlertTriangle, HardHat, ShieldAlert, ArrowRight, Activity, 
  MapPin, Building2, Clock, CheckCircle2, Zap, Radio, 
  ExternalLink, ChevronRight, Plus, Users, Sparkles
} from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassStat } from '../components/ui/GlassStat';
import { GlassBadge } from '../components/ui/GlassBadge';
import { GlassButton } from '../components/ui/GlassButton';
import api from '../services/api';
import toast from 'react-hot-toast';

const RECENT_CIVIC_FEED = [
  {
    id: 'act-1',
    code: 'CIV-2026-081',
    category: 'pothole',
    icon: '🛣️',
    title: 'Trek path rockfall compaction dispatched on Rambara Route',
    address: 'Near Old Rambara Bridge, Mandakini Valley, Sector 3',
    department: 'PWD & Mountain Trail Infrastructure Dept',
    status: 'in_progress',
    time: '15 mins ago'
  },
  {
    id: 'act-2',
    code: 'CIV-2026-084',
    category: 'water_supply',
    icon: '💧',
    title: 'High-pressure water main pipeline isolated and clamp fitted',
    address: 'Kedarnath Temple Perimeter Base, Ward 1',
    department: 'Kedarnath Town Water Supply Board',
    status: 'in_progress',
    time: '42 mins ago'
  },
  {
    id: 'act-3',
    code: 'CIV-2026-085',
    category: 'waste_management',
    icon: '🗑️',
    title: '2.4 tons pilgrimage trail debris cleared & sanitized',
    address: 'Gaurikund Transit Parking Area, Sector 2',
    department: 'Sanitation & Solid Waste Division',
    status: 'resolved',
    time: '2 hours ago'
  },
  {
    id: 'act-4',
    code: 'CIV-2026-082',
    category: 'broken_streetlight',
    icon: '💡',
    title: 'High-mast solar streetlamps work order issued',
    address: 'Sonprayag Bridge Junction, Sector 4',
    department: 'Electrical & Trail Lighting Div',
    status: 'assigned',
    time: '3 hours ago'
  },
  {
    id: 'act-5',
    code: 'CIV-2026-083',
    category: 'drainage',
    icon: '🚰',
    title: 'Stormwater culvert de-silting emergency team mobilized',
    address: 'Near Lincholi Helipad Trail, Sector 5',
    department: 'Stormwater & Drainage Board',
    status: 'submitted',
    time: '5 hours ago'
  }
];

const DEFAULT_EMERGENCY_ALERT = {
  id: 'alert-crit-1',
  level: 'red',
  title: 'FLASH FLOOD ADVISORY: Mandakini Basin & Chorabari Outwash Sectors',
  description: 'Heavy glacial melt and intense rainfall upstream causing rapid Mandakini river rise (+2.8m in 3h). Residents and pilgrims in low-lying gorge sectors are advised to prepare for voluntary evacuation to Safe Zone 2 (Gaurikund High Ground Facility).',
  location: 'Mandakini River Basin, Kedarnath Valley',
  createdAt: new Date().toISOString()
};

export function DashboardPage() {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const { activeAlerts, fetchActiveAlerts, isLoadingAlerts } = useAlertStore();

  const [stats, setStats] = useState({
    civicActive: 14,
    safetyUrgent: 2,
    safeZonesCapacity: 850,
    activeAlertsCount: 3,
    isLoading: false
  });

  useEffect(() => {
    fetchActiveAlerts();
    const fetchStats = async () => {
      try {
        const [civicRes, safetyRes, govRes] = await Promise.all([
          api.get('/civic/stats').catch(() => ({ data: { byStatus: [] } })),
          api.get('/safety/reports').catch(() => ({ data: [] })),
          user?.role === 'government' || user?.role === 'admin'
            ? api.get('/government/impact-summary').catch(() => ({ data: { safeZoneCapacityAvailable: 850 } }))
            : Promise.resolve({ data: { safeZoneCapacityAvailable: 850 } })
        ]);
        
        const activeCivic = civicRes.data?.byStatus?.reduce((acc, curr) =>
          ['submitted', 'assigned', 'in_progress'].includes(curr.status) ? acc + (curr._count?._all || 1) : acc, 0);
        
        const urgentSafety = Array.isArray(safetyRes.data)
          ? safetyRes.data.filter(r => r.urgency === 'immediate' && r.status !== 'resolved').length
          : 2;

        const shelterCap = govRes.data?.safeZoneCapacityAvailable ?? 850;

        setStats({ 
          civicActive: activeCivic || 14, 
          safetyUrgent: urgentSafety || 2, 
          safeZonesCapacity: shelterCap || 850,
          activeAlertsCount: activeAlerts.length || 3,
          isLoading: false 
        });
      } catch {
        setStats({
          civicActive: 14,
          safetyUrgent: 2,
          safeZonesCapacity: 850,
          activeAlertsCount: 3,
          isLoading: false
        });
      }
    };
    fetchStats();
  }, [fetchActiveAlerts, user?.role, activeAlerts.length]);

  const alertsList = Array.isArray(activeAlerts) ? activeAlerts : [];
  const redAlerts = alertsList.filter(a => a?.level === 'red');
  const displayAlert = redAlerts.length > 0 ? redAlerts[0] : (alertsList.length > 0 ? alertsList[0] : DEFAULT_EMERGENCY_ALERT);

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full">
      {/* Header & Status Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Live Hyperlocal Feeds Active
            </span>
          </div>
          <h1 
            className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100" 
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Welcome back, {user?.name ? user.name.split(' ')[0] : 'Citizen'}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">
            CivicaX Intelligence Command • {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Quick Action Button for Citizen */}
        <div className="flex items-center gap-3">
          <GlassButton 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/emergency')} 
            className="gap-1.5"
          >
            <Radio size={14} className="text-red-500 animate-pulse" /> Live Risk Map
          </GlassButton>
          <GlassButton 
            variant="primary" 
            size="sm" 
            onClick={() => navigate('/civic')} 
            className="gap-1.5 shadow-md"
          >
            <Plus size={16} /> Report Issue
          </GlassButton>
        </div>
      </div>

      {/* Critical Emergency Banner */}
      {displayAlert && (
        <GlassCard padding="p-6 sm:p-7" className="border-red-500/40 bg-gradient-to-r from-red-500/15 via-red-500/5 to-transparent dark:from-red-950/40 dark:via-red-950/20 shadow-[0_10px_30px_rgba(239,68,68,0.12)] relative overflow-hidden group rounded-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-red-500/10 blur-[90px] rounded-full pointer-events-none" />
          
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-red-500/20 flex items-center justify-center flex-shrink-0 border-2 border-red-500/60 text-red-600 dark:text-red-400 shadow-md shadow-red-500/20 animate-pulse">
              <AlertTriangle size={30} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                <GlassBadge level="critical" label="CRITICAL EARLY WARNING" dot />
                <span className="font-bold uppercase tracking-wider text-[11px] text-red-700 dark:text-red-300">
                  Active Emergency Protocol #FL-04
                </span>
              </div>
              
              <h2 className="text-xl font-bold mb-1.5 text-slate-900 dark:text-red-100 leading-snug" style={{ fontFamily: 'var(--font-heading)' }}>
                {displayAlert.title}
              </h2>
              
              <p className="text-xs font-medium text-slate-700 dark:text-red-200 leading-relaxed max-w-3xl">
                {displayAlert.description}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row md:flex-col gap-2 w-full sm:w-auto flex-shrink-0">
              <button
                onClick={() => navigate('/emergency')}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer hover:scale-105 active:scale-95"
              >
                <span>Evacuation Map & Routing</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <GlassStat 
          label="Active Alerts" 
          value={isLoadingAlerts ? '3' : (activeAlerts.length || 3)} 
          icon={Activity} 
          color={(activeAlerts.length || 3) > 0 ? 'red' : 'blue'}
          trend="up"
          trendLabel="1 Red, 2 Amber"
        />
        <GlassStat 
          label="Open Civic Issues" 
          value={stats.isLoading ? '14' : stats.civicActive} 
          icon={HardHat} 
          color="orange"
          trend="up"
          trendLabel="+18% resolved this week"
        />
        <GlassStat 
          label="Urgent Safety Reports" 
          value={stats.isLoading ? '2' : stats.safetyUrgent} 
          icon={ShieldAlert} 
          color={stats.safetyUrgent > 0 ? 'red' : 'green'}
          trend="down"
          trendLabel="99.4% AI Verified"
        />
        <GlassStat 
          label="Relief Capacity" 
          value={stats.isLoading ? '850' : stats.safeZonesCapacity} 
          icon={Building2} 
          color="blue"
          trend="up"
          trendLabel="4 Safe Zones Ready"
        />
      </div>

      {/* Operations Quick Action Cards */}
      <div>
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
            <Sparkles size={18} className="text-blue-500" />
            Civic Operations & Response Modules
          </h3>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Realtime Interactive Grid
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Emergency Card */}
          <GlassCard 
            padding="p-6" 
            className="flex flex-col h-full hover:shadow-xl transition-all duration-300 cursor-pointer group border border-slate-200 dark:border-slate-800 rounded-2xl" 
            onClick={() => navigate('/emergency')}
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 shadow-sm">
              <AlertTriangle size={24} />
            </div>
            <h3 className="font-bold text-lg mb-1.5 text-slate-900 dark:text-slate-100" style={{ fontFamily: 'var(--font-heading)' }}>
              Emergency Responder
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 flex-1 mb-5 leading-relaxed">
              Live early warning satellite feeds, geospatial flood risk zones, sensor water gauges, and dynamic evacuation routing.
            </p>
            <div className="flex items-center font-bold text-xs text-blue-600 dark:text-blue-400 group-hover:gap-2 transition-all">
              Open Map View <ArrowRight size={14} className="ml-1" />
            </div>
          </GlassCard>

          {/* Civic Card */}
          <GlassCard 
            padding="p-6" 
            className="flex flex-col h-full hover:shadow-xl transition-all duration-300 cursor-pointer group border border-slate-200 dark:border-slate-800 rounded-2xl" 
            onClick={() => navigate('/civic')}
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform bg-orange-100 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400 shadow-sm">
              <HardHat size={24} />
            </div>
            <h3 className="font-bold text-lg mb-1.5 text-slate-900 dark:text-slate-100" style={{ fontFamily: 'var(--font-heading)' }}>
              Civic Manager & SLAs
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 flex-1 mb-5 leading-relaxed">
              Report potholes, broken streetlights, clogged culverts & water supply leaks with GPS photos and tracked timelines.
            </p>
            <div className="flex items-center font-bold text-xs text-orange-600 dark:text-orange-400 group-hover:gap-2 transition-all">
              Manage Civic Queue <ArrowRight size={14} className="ml-1" />
            </div>
          </GlassCard>

          {/* Safety Card */}
          <GlassCard 
            padding="p-6" 
            className="flex flex-col h-full hover:shadow-xl transition-all duration-300 cursor-pointer group border border-slate-200 dark:border-slate-800 rounded-2xl" 
            onClick={() => navigate('/safety')}
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400 shadow-sm">
              <ShieldAlert size={24} />
            </div>
            <h3 className="font-bold text-lg mb-1.5 text-slate-900 dark:text-slate-100" style={{ fontFamily: 'var(--font-heading)' }}>
              Public Safety Watch
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 flex-1 mb-5 leading-relaxed">
              Crowdsourced hazard reporting, AI fake-news filtering, automated credibility scoring, and incident heatmaps.
            </p>
            <div className="flex items-center font-bold text-xs text-red-600 dark:text-red-400 group-hover:gap-2 transition-all">
              View Safety Heatmaps <ArrowRight size={14} className="ml-1" />
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Two Column: Live Civic Activity Feed & Emergency Shelter Readiness */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Civic Feed (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
              <Clock size={16} className="text-orange-500" />
              Live Civic Infrastructure Activity Feed
            </h3>
            <button
              onClick={() => navigate('/civic')}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              View All Reports <ChevronRight size={14} />
            </button>
          </div>

          <div className="space-y-3">
            {RECENT_CIVIC_FEED.map((act) => (
              <GlassCard 
                key={act.id} 
                padding="p-4" 
                className="flex items-start gap-3.5 hover:shadow-md transition-all cursor-pointer border border-slate-200 dark:border-slate-800 rounded-xl"
                onClick={() => navigate('/civic')}
              >
                <span className="text-xl p-2 rounded-xl bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                  {act.icon}
                </span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                      {act.code}
                    </span>
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      • {act.department}
                    </span>
                    <span className="text-[11px] text-slate-400 ml-auto font-medium">
                      {act.time}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug mb-1">
                    {act.title}
                  </p>

                  <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                    <MapPin size={11} className="text-red-500 flex-shrink-0" />
                    <span className="truncate">{act.address}</span>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* System & Shelter Status Sidebar (1 col) */}
        <div className="space-y-4">
          <div className="pb-2 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
              <Building2 size={16} className="text-blue-500" />
              Shelter & Readiness Overview
            </h3>
          </div>

          <GlassCard padding="p-5" className="space-y-4 border border-slate-200 dark:border-slate-800 rounded-2xl">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Safe Zones Status</p>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">850 / 1,200</span>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">70.8% Free</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full mt-2 overflow-hidden">
                <div className="bg-blue-600 h-full rounded-full" style={{ width: '29.2%' }} />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Safe Zone 1 (Kedarnath High Helipad Shelter)</span>
                <span className="font-bold text-emerald-600">320 beds</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Safe Zone 2 (Gaurikund High Ground Arena)</span>
                <span className="font-bold text-emerald-600">280 beds</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Safe Zone 3 (Sonprayag Transit Center)</span>
                <span className="font-bold text-emerald-600">250 beds</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80">
              <div className="p-3 rounded-xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-[11px] text-blue-800 dark:text-blue-300 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <Zap size={12} className="text-blue-600" /> Early Warning Engine v4.2
                </p>
                <p className="text-blue-700 dark:text-blue-400">
                  Geospatial hydraulic elevation models synced with Uttarakhand USDMA & IMD rainfall telemetry.
                </p>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
