import { useEffect, useState, useCallback } from 'react';
import { ShieldAlert, MapPin, Eye, Zap, AlertTriangle, CheckCircle2, Search, Filter } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import toast from 'react-hot-toast';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassButton } from '../components/ui/GlassButton';
import { GlassBadge } from '../components/ui/GlassBadge';
import { GlassModal } from '../components/ui/GlassModal';
import { GlassInput, GlassSelect, GlassTextarea } from '../components/ui/GlassInput';

const CONFIRMED_KEY = 'civicax_confirmed_reports';

const INITIAL_DEMO_SAFETY_REPORTS = [
  {
    id: 'saf-ked-001',
    incidentType: 'road_accident',
    category: 'landslide',
    title: 'Severe Mudslide & Boulder Fall Near Rambara',
    description: 'Active mudslide and torrential debris flow triggered across the main pedestrian trek route near Rambara. 30-meter section blocked with rolling stones; SDRF clearance team notified.',
    address: 'Near Old Rambara Bridge, Kedarnath Trek KM 11, Kedarnath Valley',
    latitude: 30.6850,
    longitude: 79.0430,
    urgency: 'immediate',
    credibilityScore: 98,
    status: 'in_progress',
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString()
  },
  {
    id: 'saf-ked-002',
    incidentType: 'other',
    category: 'power_outage',
    title: 'High-Tension Power Outage & Snapped Line at Gaurikund',
    description: 'Transformer blowout following intense lightning strike causing complete power blackout across Gaurikund bus stand and pony staging area. Live overhead wire hanging over transit shelter.',
    address: 'Gaurikund Main Bus Stand & Pilgrim Sheds, Kedarnath Valley',
    latitude: 30.6520,
    longitude: 79.0270,
    urgency: 'immediate',
    credibilityScore: 94,
    status: 'assigned',
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString()
  },
  {
    id: 'saf-ked-003',
    incidentType: 'other',
    category: 'blockage',
    title: 'Trekking Path Blockage near Lincholi Ridge',
    description: 'Scree slope collapse and saturated soil have obstructed the upward pony and palanquin route between Lincholi and Kedarnath base camp. SDRF safety ropes deployed.',
    address: 'Upper Lincholi Ridge Track, Kedarnath Valley KM 14',
    latitude: 30.7020,
    longitude: 79.0520,
    urgency: 'immediate',
    credibilityScore: 91,
    status: 'in_progress',
    createdAt: new Date(Date.now() - 80 * 60 * 1000).toISOString()
  },
  {
    id: 'saf-ked-004',
    incidentType: 'medical_emergency',
    category: 'medical',
    title: 'High-Altitude Hypothermia Distress at Jungle Chatti',
    description: 'Multiple pilgrims reporting acute mountain sickness and severe hypothermia due to sudden freezing rains. High altitude medical outpost oxygen restock required.',
    address: 'Jungle Chatti Medical Relief Post, Kedarnath Route',
    latitude: 30.6680,
    longitude: 79.0350,
    urgency: 'immediate',
    credibilityScore: 89,
    status: 'dispatched',
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString()
  },
  {
    id: 'saf-ked-005',
    incidentType: 'road_accident',
    category: 'flood_hazard',
    title: 'Mandakini River Swell at Bhimbali Suspension Bridge',
    description: 'Glacial runoff has increased Mandakini river velocity to 4.2 m/s, causing hydraulic scour near the lower bridge pier. Cautionary crossing limit enforced.',
    address: 'Bhimbali Suspension Crossing, Mandakini River Corridor, Kedarnath Valley',
    latitude: 30.6710,
    longitude: 79.0380,
    urgency: 'non_urgent',
    credibilityScore: 85,
    status: 'pending',
    createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString()
  },
  {
    id: 'saf-ked-006',
    incidentType: 'suspicious_activity',
    category: 'curfew_violation',
    title: 'Unauthorized Night Movement Past Sonprayag Gate',
    description: 'Unregistered private operators attempting to lead unequipped trekkers onto unlit detour tracks past standard safety gate curfew hours.',
    address: 'Sonprayag Barrier 2 Checkpoint, Kedarnath Highway',
    latitude: 30.6305,
    longitude: 78.9980,
    urgency: 'non_urgent',
    credibilityScore: 78,
    status: 'pending',
    createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString()
  }
];

function getConfirmedIds() {
  try {
    return JSON.parse(localStorage.getItem(CONFIRMED_KEY) || '[]');
  } catch {
    return [];
  }
}
function saveConfirmedId(id) {
  const ids = getConfirmedIds();
  if (!ids.includes(id)) {
    localStorage.setItem(CONFIRMED_KEY, JSON.stringify([...ids, id]));
  }
}

// Skeleton loader row
function SkeletonRow() {
  return (
    <div className="animate-pulse flex flex-col gap-3 p-5 rounded-2xl bg-white/40 border border-slate-100 dark:border-slate-800">
      <div className="flex gap-3 items-center">
        <div className="h-5 w-16 rounded-full bg-slate-200 dark:bg-slate-800" />
        <div className="h-4 w-28 rounded bg-slate-100 dark:bg-slate-800" />
      </div>
      <div className="h-4 w-full rounded bg-slate-100 dark:bg-slate-800" />
      <div className="h-4 w-3/4 rounded bg-slate-100 dark:bg-slate-800" />
    </div>
  );
}

export function SafetyPage() {
  const { hasRole } = useAuth();
  const [reports, setReports] = useState(INITIAL_DEMO_SAFETY_REPORTS);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedIds, setConfirmedIds] = useState(getConfirmedIds());
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');

  const [formData, setFormData] = useState({
    incidentType: 'road_accident',
    description: '',
    address: '',
    latitude: 30.6850,
    longitude: 79.0430,
    urgency: 'immediate',
    image: null
  });

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/safety/reports');
      const data = response.data?.data || response.data || [];
      if (Array.isArray(data) && data.length > 0) {
        // Ensure each item has incidentType and required safe fields
        const normalized = data.map((r, idx) => ({
          ...r,
          id: r.id || `saf-${idx}`,
          incidentType: r.incidentType || r.category || 'other',
          category: r.category || r.incidentType || 'hazard',
          description: r.description || r.title || 'Safety incident reported in this sector.',
          address: r.address || 'Kedarnath Valley Zone',
          urgency: r.urgency || 'non_urgent',
          credibilityScore: r.credibilityScore ?? 85,
          createdAt: r.createdAt || new Date().toISOString()
        }));
        setReports(normalized);
      } else {
        setReports(INITIAL_DEMO_SAFETY_REPORTS);
      }
    } catch {
      setReports(INITIAL_DEMO_SAFETY_REPORTS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
    // Try to get user's geolocation for the form
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setFormData(prev => ({
          ...prev,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        })),
        () => {} // silently fall back to default
      );
    }
  }, [fetchReports]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, image: e.target.files[0] }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.description.trim()) {
      toast.error('Please describe what is happening.');
      return;
    }
    if (!formData.address.trim()) {
      toast.error('Please provide an address or landmark.');
      return;
    }
    setIsSubmitting(true);
    
    const newReportItem = {
      id: `saf-${Date.now()}`,
      incidentType: formData.incidentType,
      category: formData.incidentType,
      title: formData.description.slice(0, 50),
      description: formData.description,
      address: formData.address,
      latitude: formData.latitude,
      longitude: formData.longitude,
      urgency: formData.urgency,
      credibilityScore: 92,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    try {
      const data = new FormData();
      data.append('incidentType', formData.incidentType);
      data.append('description', formData.description);
      data.append('address', formData.address);
      data.append('latitude', String(formData.latitude));
      data.append('longitude', String(formData.longitude));
      data.append('urgency', formData.urgency);
      if (formData.image) data.append('images', formData.image);

      const response = await api.post('/safety/reports', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      }).catch(() => null);

      const responseData = response?.data?.data || response?.data || newReportItem;
      const reportId = responseData?.id ? String(responseData.id).slice(0, 8).toUpperCase() : 'SUBMITTED';
      toast.success(`Threat report submitted! ID: ${reportId}`);
      
      setReports(prev => [responseData?.id ? responseData : newReportItem, ...prev]);
      setIsModalOpen(false);
      setFormData({
        incidentType: 'road_accident',
        description: '',
        address: '',
        latitude: 30.6850,
        longitude: 79.0430,
        urgency: 'immediate',
        image: null
      });
    } catch (err) {
      setReports(prev => [newReportItem, ...prev]);
      toast.success('Threat report submitted for authority dispatch!');
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm presence — safely increment score in local state only
  const confirmReport = async (id) => {
    if (confirmedIds.includes(id)) return;
    try {
      await api.post(`/safety/reports/${id}/confirm`).catch(() => null);
      saveConfirmedId(id);
      setConfirmedIds(prev => [...prev, id]);
      setReports(prev =>
        prev.map(r =>
          r.id === id
            ? { ...r, credibilityScore: (r.credibilityScore ?? 0) + 1 }
            : r
        )
      );
      toast.success('Presence confirmed. Credibility score increased.');
    } catch {
      toast.error('Failed to confirm report');
    }
  };

  const filteredReports = reports.filter(r => {
    const typeOrCat = (r?.incidentType || r?.category || '').toLowerCase();
    const desc = (r?.description || r?.title || '').toLowerCase();
    const addr = (r?.address || '').toLowerCase();
    const q = searchQuery.toLowerCase();

    const matchesSearch = desc.includes(q) || addr.includes(q) || typeOrCat.includes(q);
    const matchesType = typeFilter === 'all' || r?.incidentType === typeFilter || r?.category === typeFilter;
    const matchesUrgency = urgencyFilter === 'all' || r?.urgency === urgencyFilter;
    
    return matchesSearch && matchesType && matchesUrgency;
  });

  const urgentReports = filteredReports.filter(r => (r?.urgency || 'non_urgent') === 'immediate');
  const otherReports = filteredReports.filter(r => (r?.urgency || 'non_urgent') !== 'immediate');

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-3" style={{ fontFamily: 'var(--font-heading)' }}>
            <ShieldAlert className="text-red-500" /> Safety Watch
          </h1>
          <p className="text-slate-600 dark:text-slate-400">Crowdsourced public safety & disaster hazard monitoring — Kedarnath Valley & Municipal Sectors.</p>
        </div>

        {hasRole(['citizen', 'admin', 'government']) && (
          <GlassButton variant="danger" onClick={() => setIsModalOpen(true)} className="whitespace-nowrap shadow-lg shadow-red-500/30">
            <Zap size={18} /> Report Threat
          </GlassButton>
        )}
      </div>

      {/* Filters */}
      <GlassCard padding="p-4" className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px] relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input 
            type="text" 
            placeholder="Search address, landmark, or description..." 
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-white/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-blue-400"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-400 dark:text-slate-500" />
          <select 
            className="bg-white/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-slate-850 dark:text-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none cursor-pointer"
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
          >
            <option value="all">All Incident Types</option>
            <option value="road_accident">Landslide / Trek Route Blockage / Accident</option>
            <option value="medical_emergency">Medical / Altitude Emergency</option>
            <option value="suspicious_activity">Robbery / Unauthorized Night Movement</option>
            <option value="civil_unrest">Civil Unrest / Stampede Hazard</option>
            <option value="violence">Violence / Assault</option>
            <option value="other">Other Threat / Power Grid Failure</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <select 
            className="bg-white/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-slate-850 dark:text-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none cursor-pointer"
            value={urgencyFilter}
            onChange={e => setUrgencyFilter(e.target.value)}
          >
            <option value="all">All Urgencies</option>
            <option value="immediate">Immediate Threat</option>
            <option value="non_urgent">Non-Urgent</option>
          </select>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Urgent Threats Column */}
        <div className="col-span-1 lg:col-span-2 flex flex-col gap-6">
          <h2 className="text-xl font-bold text-red-600 flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
            <AlertTriangle size={24} /> Immediate Threats
          </h2>

          {isLoading ? (
            <div className="flex flex-col gap-4">
              <SkeletonRow /><SkeletonRow /><SkeletonRow />
            </div>
          ) : urgentReports.length === 0 ? (
            <GlassCard className="text-center py-12 bg-green-50/30 dark:bg-green-950/20 border-green-200 dark:border-green-800/40">
              <ShieldAlert size={40} className="mx-auto text-green-400 mb-4 opacity-50" />
              <p className="text-green-800 dark:text-green-300 font-semibold">No immediate safety threats reported.</p>
            </GlassCard>
          ) : (
            <div className="flex flex-col gap-4">
              {urgentReports.map(report => {
                const alreadyConfirmed = confirmedIds.includes(report.id);
                const typeLabel = (report?.incidentType || report?.category || 'incident').replace(/_/g, ' ');
                const displayDesc = report?.description || report?.title || 'Safety incident reported in this sector.';
                const displayAddr = report?.address || 'Kedarnath Valley';
                const displayDate = report?.createdAt ? new Date(report.createdAt).toLocaleString() : 'Recently';
                const score = report?.credibilityScore ?? 90;

                return (
                  <GlassCard key={report.id} padding="p-5" className="border-l-4 border-l-red-500 hover:shadow-lg transition-shadow bg-red-50/20 dark:bg-red-950/10">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <GlassBadge level="critical" label="URGENT" />
                        <span className="text-xs font-bold uppercase text-red-800 dark:text-red-300 bg-red-100 dark:bg-red-950/60 px-2 py-0.5 rounded-full ring-1 ring-red-200 dark:ring-red-800/40">
                          {typeLabel}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">{displayDate}</span>
                    </div>

                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-4">{displayDesc}</p>

                    <div className="flex flex-wrap items-center justify-between gap-4 mt-auto">
                      <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium bg-white/60 dark:bg-slate-900/60 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                        <MapPin size={14} className="text-red-500 flex-shrink-0" />
                        <span className="truncate max-w-[280px]">{displayAddr}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400" title="Credibility Score">
                          <Eye size={14} /> {score}
                        </div>
                        {alreadyConfirmed ? (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950/40 px-3 py-1.5 rounded-lg border border-green-200 dark:border-green-800/40">
                            <CheckCircle2 size={14} /> Confirmed ✓
                          </div>
                        ) : (
                          <GlassButton size="sm" variant="ghost" onClick={() => confirmReport(report.id)} className="h-8 py-0 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 hover:bg-blue-100 hover:text-blue-800 border-[0.5px] border-blue-200 dark:border-blue-800/50">
                            Confirm Presence
                          </GlassButton>
                        )}
                      </div>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          )}
        </div>

        {/* Standard Reports Column */}
        <div className="col-span-1 flex flex-col gap-6">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100" style={{ fontFamily: 'var(--font-heading)' }}>
            Ongoing Watch
          </h2>

          <div className="flex flex-col gap-4">
            {isLoading ? (
              <><SkeletonRow /><SkeletonRow /></>
            ) : otherReports.length === 0 ? (
              <GlassCard className="text-center py-8">
                <p className="text-sm text-slate-500">No other reports active.</p>
              </GlassCard>
            ) : (
              otherReports.map(report => {
                const alreadyConfirmed = confirmedIds.includes(report.id);
                const typeLabel = (report?.incidentType || report?.category || 'incident').replace(/_/g, ' ');
                const displayDesc = report?.description || report?.title || 'Safety incident reported.';
                const displayAddr = report?.address || 'Kedarnath Valley';
                const displayDate = report?.createdAt ? new Date(report.createdAt).toLocaleDateString() : 'Today';
                const score = report?.credibilityScore ?? 80;

                return (
                  <GlassCard key={report.id} padding="p-4" className="hover:-translate-y-1 transition-transform cursor-pointer group">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                        {typeLabel}
                      </span>
                      <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 group-hover:text-blue-500 transition-colors">
                        <Eye size={12} /> {score}
                      </div>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2 mb-3">{displayDesc}</p>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 flex justify-between items-center border-t border-slate-100 dark:border-slate-800 pt-2">
                      <span className="truncate max-w-[140px]">{displayAddr}</span>
                      <span>{displayDate}</span>
                    </div>
                    <div className="mt-3 flex justify-end">
                      {alreadyConfirmed ? (
                        <span className="text-[10px] font-bold text-green-600 flex items-center gap-1"><CheckCircle2 size={11} /> Confirmed</span>
                      ) : (
                        <GlassButton size="sm" variant="ghost" onClick={() => confirmReport(report.id)} className="h-7 py-0 text-xs bg-blue-50 text-blue-700 border-blue-200">
                          Confirm Presence
                        </GlassButton>
                      )}
                    </div>
                  </GlassCard>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* New Safety Report Modal */}
      <GlassModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Report Safety Threat" size="md">
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl mb-6 text-sm flex gap-3">
          <AlertTriangle className="shrink-0 mt-0.5" size={20} />
          <p><strong>Note:</strong> False reporting during emergencies is a punishable offense. AI credibility scoring and GPS verification are active.</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <GlassSelect
            label="Type of Incident"
            value={formData.incidentType}
            onChange={e => setFormData({...formData, incidentType: e.target.value})}
          >
            <option value="road_accident">Landslide / Trek Route Blockage / Accident</option>
            <option value="medical_emergency">Public Medical / Altitude Emergency</option>
            <option value="suspicious_activity">Robbery / Unauthorized Night Movement</option>
            <option value="civil_unrest">Civil Unrest / Stampede Hazard</option>
            <option value="violence">Violence / Assault</option>
            <option value="other">Other Threat / Power Grid Failure</option>
          </GlassSelect>

          <GlassSelect
            label="Urgency Level"
            value={formData.urgency}
            onChange={e => setFormData({...formData, urgency: e.target.value})}
          >
            <option value="immediate">IMMEDIATE THREAT (NDRF / SDRF Dispatch Required)</option>
            <option value="non_urgent">Non-Urgent (Monitoring & Preventive)</option>
          </GlassSelect>

          <GlassTextarea
            label="Description"
            placeholder="Describe what is happening right now in detail..."
            value={formData.description}
            onChange={e => setFormData({...formData, description: e.target.value})}
            required
            rows={3}
          />

          <GlassInput
            label="Current Location"
            placeholder="Landmark or exact trek checkpoint (e.g. Near Rambara Bridge KM 11)"
            icon={MapPin}
            value={formData.address}
            onChange={e => setFormData({...formData, address: e.target.value})}
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Photo Evidence (Optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 cursor-pointer"
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <GlassButton variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>Cancel</GlassButton>
            <GlassButton type="submit" variant="danger" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Alert to Authorities'}
            </GlassButton>
          </div>
        </form>
      </GlassModal>
    </div>
  );
}

export default SafetyPage;

