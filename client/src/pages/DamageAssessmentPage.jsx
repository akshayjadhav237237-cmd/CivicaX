import { useState } from 'react';
import {
  FileText,
  ShieldAlert,
  AlertTriangle,
  Building2,
  Users,
  Waves,
  Calendar,
  Clock,
  CheckCircle2,
  Filter,
  Plus,
  Download,
  Share2,
  ChevronRight,
  ExternalLink,
  Flame,
  Droplets,
  Activity
} from 'lucide-react';
import { NDMAReportBuilder } from '../components/reports/NDMAReportBuilder';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

// Incident Archive & Active Incidents Roster
const ACTIVE_INCIDENTS = [
  {
    id: 'NDMA-UK-RUD-2026-FL08',
    title: 'Mandakini Basin Cloudburst & Flash Surge',
    district: 'Rudraprayag',
    state: 'Uttarakhand',
    severity: 'RED',
    disasterType: 'Flash Flood / GLOF',
    activeWards: '6 / 9 Wards Inundated',
    evacuated: '9,480 Evacuated',
    status: 'ACTIVE EMERGENCY',
    lastUpdated: '07 Nov 2026, 06:45 IST',
    sitrepCount: 4,
    commander: 'Dr. Saurabh Joshi, IAS (DM Rudraprayag)'
  },
  {
    id: 'NDMA-UK-CHA-2026-FL03',
    title: 'Alaknanda Tributary Inundation',
    district: 'Chamoli',
    state: 'Uttarakhand',
    severity: 'ORANGE',
    disasterType: 'Glacial Splay / Snowmelt Swell',
    activeWards: '3 / 7 Wards Affected',
    evacuated: '5,100 Evacuated',
    status: 'CONTAINED SURGE',
    lastUpdated: '06 Nov 2026, 21:30 IST',
    sitrepCount: 2,
    commander: 'Himanshu Khurana, IAS (DM Chamoli)'
  }
];

const HISTORICAL_SITREPS = [
  {
    id: 'SITREP-04',
    incidentId: 'NDMA-UK-RUD-2026-FL08',
    timestamp: '07 Nov 2026, 06:45 IST',
    author: 'Dr. Saurabh Joshi, IAS',
    summary: 'NASA GPM telemetry peak wave arrival at Sonprayag (T+42m). 6 wards submerged. 33kV substation isolated.',
    classification: 'RESTRICTED // OPERATIONAL',
    status: 'Transmitted to SEOC & MHA'
  },
  {
    id: 'SITREP-03',
    incidentId: 'NDMA-UK-RUD-2026-FL08',
    timestamp: '06 Nov 2026, 22:30 IST',
    author: 'Col. R. K. Rawat, NDRF',
    summary: 'Stage II Mandatory Evacuation order enforced for 14,200 riparian residents. 4 NDRF teams deployed.',
    classification: 'RESTRICTED // OPERATIONAL',
    status: 'Transmitted to SEOC'
  },
  {
    id: 'SITREP-02',
    incidentId: 'NDMA-UK-RUD-2026-FL08',
    timestamp: '06 Nov 2026, 17:15 IST',
    author: 'DEOC Rudraprayag Ops',
    summary: 'Catchment AWS Kedarnath recorded 118mm rain in 90 min. Mandakini gauge breached Warning Level (624.5m).',
    classification: 'OPERATIONAL WATCH',
    status: 'Archived'
  },
  {
    id: 'SITREP-01',
    incidentId: 'NDMA-UK-CHA-2026-FL03',
    timestamp: '06 Nov 2026, 11:00 IST',
    author: 'Himanshu Khurana, IAS',
    summary: 'Tapovan tunnel access single-lane restriction. Barrage water discharge maintained at 980 m3/s.',
    classification: 'OPERATIONAL WATCH',
    status: 'Archived'
  }
];

export function DamageAssessmentPage() {
  const { user } = useAuth();
  const [selectedIncidentId, setSelectedIncidentId] = useState('NDMA-UK-RUD-2026-FL08');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [severityFilter, setSeverityFilter] = useState('ALL');

  const activeIncident = ACTIVE_INCIDENTS.find(inc => inc.id === selectedIncidentId) || ACTIVE_INCIDENTS[0];

  const filteredIncidents = ACTIVE_INCIDENTS.filter(inc => {
    if (severityFilter === 'ALL') return true;
    return inc.severity === severityFilter;
  });

  const handleIncidentSelect = (id) => {
    setSelectedIncidentId(id);
    toast.success(`Active SITREP switched to ${id}`);
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-12">
      {/* Page Title & Official Government Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-blue-600 text-white font-mono">
              NDMA / DDMA CRISIS SUITE
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Disaster Management Act 2005 Compliant
            </span>
          </div>
          <h1
            className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            <ShieldAlert className="text-red-600" size={28} />
            Situation Report & Damage Assessment Builder
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-3xl">
            Official National Disaster Management Authority (NDMA) incident command & damage assessment module for District Magistrates, Incident Commanders, Relief Commissioners, and Municipal Executives.
          </p>
        </div>

        {/* Quick Utility Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowHistoryModal(!showHistoryModal)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-sm transition-all cursor-pointer"
          >
            <Calendar size={14} className="text-blue-500" />
            SITREP History ({HISTORICAL_SITREPS.length})
          </button>
          <div className="px-3 py-2 text-xs font-mono font-bold rounded-xl bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-900 flex items-center gap-1.5">
            <Activity size={14} className="text-red-600 animate-pulse" />
            OPERATIONAL WATCH: ACTIVE
          </div>
        </div>
      </div>

      {/* Top Situational Overview Cards (District Rudraprayag / Garhwal) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="glass-card p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase">
            <span>Inundated Wards</span>
            <Building2 size={15} className="text-red-500" />
          </div>
          <div className="text-2xl font-black text-red-600 font-mono mt-1">6 / 9</div>
          <div className="text-[10px] text-slate-500 mt-0.5">High Water Depth &gt; 1.8m</div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase">
            <span>Evacuation Rate</span>
            <Users size={15} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 font-mono mt-1">66.8%</div>
          <div className="text-[10px] text-slate-500 mt-0.5">9,480 of 14,200 Sheltered</div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase">
            <span>River Surge Ratio</span>
            <Waves size={15} className="text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-600 font-mono mt-1">1.34x</div>
          <div className="text-[10px] text-red-600 font-semibold mt-0.5">+3.40m over Danger Datum</div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase">
            <span>Deployed Battalions</span>
            <ShieldAlert size={15} className="text-purple-500" />
          </div>
          <div className="text-2xl font-black text-purple-600 font-mono mt-1">255 Rescuers</div>
          <div className="text-[10px] text-slate-500 mt-0.5">NDRF 8th Bn + SDRF Teams</div>
        </div>

        <div className="col-span-2 lg:col-span-1 glass-card p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase">
            <span>Peak Wave ETA</span>
            <Clock size={15} className="text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 font-mono mt-1">T+42 min</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Sonprayag Gorge Choke Point</div>
        </div>
      </div>

      {/* Incident Selection Bar & Historical SITREP Drawer (Toggled) */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 glass-card p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5 pl-1">
            <Filter size={13} className="text-blue-500" /> Filter Incident:
          </span>
          {ACTIVE_INCIDENTS.map((inc) => (
            <button
              key={inc.id}
              onClick={() => handleIncidentSelect(inc.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                selectedIncidentId === inc.id
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${inc.severity === 'RED' ? 'bg-red-500' : 'bg-amber-500'}`} />
              <span>{inc.district}: {inc.title}</span>
              <span className="text-[10px] opacity-80 font-mono">({inc.id})</span>
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono text-right pr-1">
          Active Commander: <strong className="text-slate-800 dark:text-slate-200">{activeIncident.commander}</strong>
        </div>
      </div>

      {/* Historical SITREPs Expandable Box */}
      {showHistoryModal && (
        <div className="glass-card p-5 rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar size={14} className="text-blue-600" />
              Official Situation Reports (SITREP Archive Log)
            </h3>
            <button
              onClick={() => setShowHistoryModal(false)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
            >
              Close Archive
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {HISTORICAL_SITREPS.map((sitrep) => (
              <div
                key={sitrep.id}
                className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-black text-blue-600 dark:text-blue-400">
                      {sitrep.id} // {sitrep.incidentId}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {sitrep.timestamp}
                    </span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed mt-1">
                    {sitrep.summary}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px]">
                  <span className="font-semibold text-slate-500">Filed by: {sitrep.author}</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{sitrep.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Official Report Builder & Editor Component */}
      <div className="pt-2">
        <NDMAReportBuilder initialPresetId={selectedIncidentId} />
      </div>
    </div>
  );
}

export default DamageAssessmentPage;
