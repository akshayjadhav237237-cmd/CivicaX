import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Building2, Calculator, Users, ShieldAlert, Activity,
  CheckCircle, Plus, Satellite, ClipboardList,
  Truck, AlertTriangle, RefreshCw,
  Info, Zap, Clock
} from 'lucide-react';

import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import toast from 'react-hot-toast';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassButton } from '../components/ui/GlassButton';
import { GlassBadge } from '../components/ui/GlassBadge';
import { GlassStat } from '../components/ui/GlassStat';
import { GlassSelect, GlassInput } from '../components/ui/GlassInput';
import { GlassModal } from '../components/ui/GlassModal';
import { useAlertStore } from '../stores/alertStore';
import { GovernmentAlertsFeed } from '../components/government/GovernmentAlertsFeed';
import { GovernmentDispatchModal } from '../components/government/GovernmentDispatchModal';
import { GovernmentGrievanceQueue } from '../components/government/GovernmentGrievanceQueue';
import { ActiveFloodAlerts } from '../components/government/ActiveFloodAlerts';

const STATUS_BADGE = {
  dispatched: 'bg-blue-100 text-blue-700',
  en_route:   'bg-yellow-100 text-yellow-700',
  on_scene:   'bg-orange-100 text-orange-700',
  completed:  'bg-green-100 text-green-700',
};
const SVC_EMOJI = { ambulance:'🚑', police:'🚓', fire:'🚒', rescue:'🛟', medical:'💊', flood_rescue:'⛵' };
const STATUS_STEPS = ['dispatched', 'en_route', 'on_scene', 'completed'];

function DispatchesPanel({ dispatches, loading, onNewDispatch, onStatusUpdate }) {
  return (
    <div className="glass-card p-5 space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-slate-800">Recent Dispatches</h3>
        <GlassButton size="sm" variant="primary" onClick={onNewDispatch} className="text-xs gap-1">
          <Plus size={12}/> New Dispatch
        </GlassButton>
      </div>
      {loading && <div className="animate-pulse space-y-2">{[1,2,3].map(i=><div key={i} className="h-14 bg-slate-100 rounded-xl"/>)}</div>}
      {!loading && dispatches.length === 0 && <p className="text-slate-400 text-sm text-center py-6">No dispatches yet</p>}
      {dispatches.map(d => (
        <div key={d.id} className="glass-card p-3 flex items-center gap-3">
          <span className="text-xl">{SVC_EMOJI[d.serviceType]||'🚨'}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800 capitalize">{d.serviceType.replace('_',' ')} × {d.quantity}</p>
            <p className="text-xs text-slate-500">{d.destinationLabel || `${d.destinationLat?.toFixed(3)}, ${d.destinationLng?.toFixed(3)}`}</p>
            <p className="text-xs text-slate-400">{new Date(d.dispatchedAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${STATUS_BADGE[d.status]||'bg-slate-100 text-slate-600'}`}>{d.status.replace('_',' ')}</span>
            {d.status !== 'completed' && (
              <select
                className="text-[10px] bg-white/60 border border-slate-200 rounded px-1 py-0.5 text-slate-600 cursor-pointer"
                defaultValue=""
                onChange={e => { if (e.target.value) onStatusUpdate(d.id, e.target.value); }}
              >
                <option value="" disabled>Update→</option>
                {STATUS_STEPS.filter(s => STATUS_STEPS.indexOf(s) > STATUS_STEPS.indexOf(d.status)).map(s => (
                  <option key={s} value={s}>{s.replace('_',' ')}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}


export function GovernmentPage() {
  const { zones, fetchZones } = useAlertStore();
  const [activeTab, setActiveTab] = useState('situation');
  const [data, setData] = useState({ auditLogs: [], impact: null, safeZones: [] });
  const [isLoading, setIsLoading] = useState(true);
  
  // Resource Calculator State — pure frontend, no API needed
  const [calcParams, setCalcParams] = useState({ population: '50000', disasterType: 'flood', severity: 'severe' });
  const [calcResult, setCalcResult] = useState(null);

  // Dispatches state — lifted up so dispatch modal can update it instantly
  const [dispatches, setDispatches] = useState([]);
  const [dispatchesLoading, setDispatchesLoading] = useState(true);

  // New Alert State
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [alertForm, setAlertForm] = useState({ zoneId: '', level: 'yellow', title: '', description: '', evacuationOrder: false });

  // Dispatch Modal State
  const [isDispatchOpen, setIsDispatchOpen] = useState(false);
  const [dispatchSource, setDispatchSource] = useState(null);

  const handleDispatch = (event = null) => {
    setDispatchSource(event);
    setIsDispatchOpen(true);
  };

  // Pure-frontend resource calculator — NDMA formula
  const calculateResources = (e) => {
    e.preventDefault();
    const pop = Number(calcParams.population);
    if (!pop || pop <= 0) return toast.error('Please enter a valid population number');

    const multipliers = {
      flood:     { boats: 0.067, injury: 0.05 },
      landslide: { boats: 0,     injury: 0.08 },
      both:      { boats: 0.067, injury: 0.1  },
    };
    const severityMultiplier = { moderate: 1, severe: 1.5, catastrophic: 2 };
    const m = multipliers[calcParams.disasterType] || multipliers.flood;
    const s = severityMultiplier[calcParams.severity] || 1;

    const boats   = Math.ceil(pop * m.boats * s);
    const ambs    = Math.ceil(pop * m.injury * s);
    const kits    = Math.ceil(pop * 3 * s);
    const medic   = Math.ceil(pop * 0.02 * s);
    const budget  = boats * 50000 + ambs * 30000 + kits * 500 + medic * 35000;

    setCalcResult({
      resources: { boats, ambulances: ambs, reliefKits: kits, medicalPersonnel: medic },
      budgetEstimateINR: budget,
    });
    toast.success('Resources estimated');
  };

  // Fetch dispatches separately so they can be refreshed independently
  const fetchDispatches = useCallback(async () => {
    try {
      const r = await api.get('/government/dispatches');
      setDispatches(Array.isArray(r.data?.data) ? r.data.data : []);
    } catch (_) {}
    finally { setDispatchesLoading(false); }
  }, []);

  // Called when GovernmentDispatchModal succeeds — add to top of list
  const onDispatchSuccess = useCallback((newDispatch) => {
    setDispatches(prev => [newDispatch, ...prev]);
  }, []);

  // WebSocket status updates for dispatches
  const handleStatusUpdate = useCallback(async (dispatchId, newStatus) => {
    try {
      const r = await api.put(`/government/dispatch/${dispatchId}/status`, { status: newStatus });
      if (r.data?.success) {
        setDispatches(prev => prev.map(d => d.id === dispatchId ? { ...d, status: newStatus } : d));
        toast.success('Dispatch status updated');
      }
    } catch (_) { toast.error('Failed to update status'); }
  }, []);

  useEffect(() => {
    fetchGovData();
    fetchZones();
    fetchDispatches();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchGovData = async () => {
    setIsLoading(true);
    try {
      const [auditRes, impactRes, safeRes] = await Promise.all([
        api.get('/government/audit-log', { params: { limit: 10 } }),
        api.get('/government/impact-summary'),
        api.get('/emergency/safe-zones')
      ]);
      setData({
        auditLogs: auditRes.data?.data ?? auditRes.data?.logs ?? [],
        impact: impactRes.data?.data ?? impactRes.data ?? null,
        safeZones: safeRes.data?.data ?? safeRes.data?.safeZones ?? safeRes.data ?? [],
      });
    } catch (_err) {
      toast.error('Failed to load command center data');
    } finally {
      setIsLoading(false);
    }
  };

  const activateSafeZone = async (id, status) => {
    try {
      await api.put(`/government/safe-zones/${id}/activate`, { status });
      toast.success(`Safe zone status updated to ${status}`);
      fetchGovData();
    } catch (_err) {
      toast.error('Failed to update safe zone');
    }
  };

  const handleCreateAlert = async (e) => {
    e.preventDefault();
    try {
      await api.post('/emergency/alerts', alertForm);
      toast.success('Emergency alert broadcasted successfully!');
      setIsAlertModalOpen(false);
      
      // Reset form
      setAlertForm({ zoneId: '', level: 'yellow', title: '', description: '', evacuationOrder: false });
      
      // Refresh audit logs
      const auditRes = await api.get('/government/audit-log', { params: { limit: 10 } });
      setData(prev => ({ ...prev, auditLogs: auditRes.data.logs }));
    } catch (err) {
      toast.error(err.message || 'Failed to broadcast alert');
    }
  };

  if (isLoading) return <div className="p-8 text-center text-slate-500">Loading Command Center...</div>;

  const TABS = [
    { id: 'situation',  label: 'Situation',         icon: Building2 },
    { id: 'satellite',  label: 'Satellite Feed',    icon: Satellite },
    { id: 'grievances', label: 'Grievance Review',  icon: ClipboardList },
    { id: 'dispatches', label: 'Dispatches',        icon: Truck },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3" style={{ fontFamily: 'var(--font-heading)' }}>
            <Building2 className="text-blue-600" /> Command Center
          </h1>
          <p className="text-slate-600">Unified dashboard for crisis management, resource allocation, and auditing.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <GlassButton variant="ghost" onClick={() => handleDispatch()} className="flex-1 sm:flex-none whitespace-nowrap">
            <Truck size={16}/> Dispatch
          </GlassButton>
          <GlassButton variant="danger" onClick={() => setIsAlertModalOpen(true)} className="animate-pulse shadow-lg shadow-red-500/20 flex-1 sm:flex-none whitespace-nowrap">
            <Activity size={18} /> Broadcast Alert
          </GlassButton>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 glass-card p-1.5 w-fit">
        {TABS.map(tab => {
          const Ic = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-white/60'
              }`}
            >
              <Ic size={15}/> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Satellite Feed Tab */}
      {activeTab === 'satellite' && (
        <div className="glass-card p-5">
          <GovernmentAlertsFeed onDispatch={handleDispatch}/>
        </div>
      )}

      {/* Grievance Review Tab */}
      {activeTab === 'grievances' && (
        <div className="glass-card p-5">
          <GovernmentGrievanceQueue/>
        </div>
      )}

      {/* Dispatches Tab */}
      {activeTab === 'dispatches' && (
        <DispatchesPanel
          dispatches={dispatches}
          loading={dispatchesLoading}
          onNewDispatch={() => handleDispatch()}
          onStatusUpdate={handleStatusUpdate}
        />
      )}

      {/* Situation Tab (existing content) — only render when active */}
      {activeTab === 'situation' && (<>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Calculator & Stats */}
        <div className="col-span-1 flex flex-col gap-6">
          <GlassStat
            label="Total Available Relief Capacity"
            value={data.impact?.safeZoneCapacityAvailable || 0}
            icon={Users}
            color="blue"
          />

          {/* Resource Calculator */}
          <GlassCard padding="p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
              <Calculator size={20} className="text-indigo-500" /> Resource Calculator
            </h3>
            <p className="text-xs text-slate-500 mb-4 bg-indigo-50/50 p-2 rounded border border-indigo-100">
              Based on NDMA (National Disaster Management Authority) guidelines for immediate response.
            </p>
            
            <form onSubmit={calculateResources} className="flex flex-col gap-4">
              <GlassInput 
                label="Impacted Population Estimate" 
                type="number"
                value={calcParams.population}
                onChange={e => setCalcParams({...calcParams, population: e.target.value})}
                required min="1"
              />
              <div className="grid grid-cols-2 gap-4">
                <GlassSelect 
                  label="Disaster Type"
                  value={calcParams.disasterType}
                  onChange={e => setCalcParams({...calcParams, disasterType: e.target.value})}
                >
                  <option value="flood">Flash Flood</option>
                  <option value="landslide">Landslide</option>
                  <option value="both">Multiple Risk</option>
                </GlassSelect>
                <GlassSelect 
                  label="Severity"
                  value={calcParams.severity}
                  onChange={e => setCalcParams({...calcParams, severity: e.target.value})}
                >
                  <option value="moderate">Moderate</option>
                  <option value="severe">Severe</option>
                  <option value="catastrophic">Catastrophic</option>
                </GlassSelect>
              </div>
              <GlassButton type="submit" className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700">
                Run NDMA Formula
              </GlassButton>
            </form>

            {calcResult && (
              <div className="mt-6 pt-4 border-t border-slate-200">
                <h4 className="font-bold text-sm text-slate-700 mb-3">Required Resources:</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="text-slate-500 text-xs font-semibold mb-1 uppercase tracking-wider">Rescue Boats</div>
                    <div className="font-bold text-lg text-slate-800">{calcResult.resources.boats}</div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="text-slate-500 text-xs font-semibold mb-1 uppercase tracking-wider">Ambulances</div>
                    <div className="font-bold text-lg text-slate-800">{calcResult.resources.ambulances}</div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="text-slate-500 text-xs font-semibold mb-1 uppercase tracking-wider">NDRF Personnel</div>
                    <div className="font-bold text-lg text-slate-800">{calcResult.resources.medicalPersonnel}</div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="text-slate-500 text-xs font-semibold mb-1 uppercase tracking-wider">Relief Kits</div>
                    <div className="font-bold text-lg text-slate-800">{calcResult.resources.reliefKits.toLocaleString()}</div>
                  </div>
                </div>
                <div className="mt-3 bg-red-50 p-3 rounded-lg border border-red-100 flex justify-between items-center text-red-800">
                  <span className="text-xs font-semibold uppercase tracking-wider">Est. Response Budget</span>
                  <span className="font-bold">₹{calcResult.budgetEstimateINR.toLocaleString()}</span>
                </div>
              </div>
            )}
          </GlassCard>
        </div>

        {/* Right Col: Camps & Audit Log */}
        <div className="col-span-1 lg:col-span-2 flex flex-col gap-6">
          
          {/* Safe Zones Management */}
          <GlassCard padding="p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-4" style={{ fontFamily: 'var(--font-heading)' }}>Manage Relief Camps</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data.safeZones.map(zone => (
                <div key={zone.id} className="border border-slate-200 rounded-xl p-4 bg-white/40 flex flex-col hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-slate-800">{zone.name}</h4>
                    <GlassBadge 
                      level={zone.status === 'activated' ? 'safe' : zone.status === 'at_capacity' ? 'critical' : 'info'} 
                      label={zone.status.replace('_', ' ').toUpperCase()} 
                    />
                  </div>
                  <p className="text-xs text-slate-500 flex-1 mb-4 flex items-center gap-1"><Users size={12}/> Capacity: {zone.capacity}</p>
                  
                  <div className="flex flex-wrap gap-2 text-xs">
                    {zone.status === 'available' && (
                       <button onClick={() => activateSafeZone(zone.id, 'activated')} className="flex-1 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white font-bold transition-colors shadow">Activate Camp</button>
                    )}
                    {zone.status === 'activated' && (
                       <button onClick={() => activateSafeZone(zone.id, 'at_capacity')} className="flex-1 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 font-bold transition-colors">Mark Full</button>
                    )}
                    {zone.status !== 'available' && (
                       <button onClick={() => activateSafeZone(zone.id, 'available')} className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 font-medium transition-colors">Standby</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Tamper-evident Audit Log */}
          <GlassCard padding="p-6" className="flex-1">
            <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center justify-between" style={{ fontFamily: 'var(--font-heading)' }}>
              <span>Action Audit Log</span>
              <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200">Append-only</span>
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="pb-3 font-semibold">Timestamp</th>
                    <th className="pb-3 font-semibold">User Official</th>
                    <th className="pb-3 font-semibold">Action Type</th>
                    <th className="pb-3 font-semibold text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.auditLogs.map(log => (
                    <tr key={log.id} className="group hover:bg-white/50 transition-colors">
                      <td className="py-3 text-slate-500 font-mono text-xs">{new Date(log.createdAt).toLocaleString()}</td>
                      <td className="py-3 text-slate-800 font-medium">{log.user?.name || 'System'}</td>
                      <td className="py-3">
                        <span className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                          {log.action.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button 
                          onClick={() => alert(JSON.stringify(log.payload, null, 2))}
                          className="text-blue-500 hover:text-blue-700 text-xs font-semibold uppercase underline-offset-4 hover:underline"
                        >
                          View Payload
                        </button>
                      </td>
                    </tr>
                  ))}
                  {data.auditLogs.length === 0 && (
                    <tr>
                      <td colSpan="4" className="py-6 text-center text-slate-400">No actions recorded in audit log.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Active Flood Emergencies — live satellite intelligence */}
      <ActiveFloodAlerts onDispatch={({ event, resources }) => handleDispatch(event)} />

      {/* Broadcast Alert Modal */}
      <GlassModal isOpen={isAlertModalOpen} onClose={() => setIsAlertModalOpen(false)} title="Broadcast Emergency Alert" size="md">
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl mb-6 text-sm text-red-800 font-medium leading-relaxed">
          <AlertTriangle className="inline mr-2 mb-1" size={18} />
          Warning: Alerts broadcasted here will trigger immediate push notifications, SMS to registered regional users, and real-time dashboard takeovers.
        </div>
        
        <form onSubmit={handleCreateAlert} className="flex flex-col gap-4">
          <GlassSelect 
            label="Target Geofence Zone" 
            value={alertForm.zoneId} 
            onChange={e => setAlertForm({...alertForm, zoneId: e.target.value})}
            required
          >
            <option value="">Select a region...</option>
            {zones.map(z => (
              <option key={z.properties.id} value={z.properties.id}>{z.properties.name}</option>
            ))}
          </GlassSelect>
          
          <GlassSelect 
            label="Threat Level" 
            value={alertForm.level} 
            onChange={e => setAlertForm({...alertForm, level: e.target.value})}
            required
          >
            <option value="yellow">Yellow Watch (Monitor)</option>
            <option value="orange">Orange Warning (Prepare)</option>
            <option value="red">Red Critical (Take Action)</option>
          </GlassSelect>
          
          <GlassInput 
            label="Headline Title" 
            placeholder="e.g. Flash Flood Risk in Valley" 
            value={alertForm.title}
            onChange={e => setAlertForm({...alertForm, title: e.target.value})}
            required
            maxLength={100}
          />
          
          <GlassInput 
            label="Detailed Notice" 
            placeholder="Provide clear instructions to citizens..." 
            value={alertForm.description}
            onChange={e => setAlertForm({...alertForm, description: e.target.value})}
            required
          />
          
          {alertForm.level === 'red' && (
            <label className="flex items-start gap-3 p-4 bg-red-100 border-2 border-red-300 rounded-xl mt-2 cursor-pointer hover:bg-red-200/50 transition-colors">
              <input 
                type="checkbox" 
                className="mt-1 w-5 h-5 text-red-600 rounded bg-white focus:ring-red-500 cursor-pointer" 
                checked={alertForm.evacuationOrder}
                onChange={e => setAlertForm({...alertForm, evacuationOrder: e.target.checked})}
              />
              <span className="text-red-900 font-bold">
                Issue Mandatory Evacuation Order<br/>
                <span className="text-xs font-medium text-red-700 block mt-1">Directs citizens to the nearest active relief camp immediately.</span>
              </span>
            </label>
          )}

          <div className="flex justify-end gap-3 mt-4">
            <GlassButton variant="ghost" onClick={() => setIsAlertModalOpen(false)} type="button">Cancel</GlassButton>
            <GlassButton type="submit" variant="danger" className="animate-pulse shadow-lg shadow-red-500/40">Transmit Warning</GlassButton>
          </div>
        </form>
      </GlassModal>
      </>)}

      {/* Dispatch Modal */}
      <GovernmentDispatchModal
        isOpen={isDispatchOpen}
        onClose={() => { setIsDispatchOpen(false); setDispatchSource(null); }}
        sourceEvent={dispatchSource}
        onSuccess={onDispatchSuccess}
      />

    </div>
  );
}
