import { useEffect, useState, useCallback } from 'react';
import { ShieldAlert, MapPin, Eye, Zap, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import toast from 'react-hot-toast';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassButton } from '../components/ui/GlassButton';
import { GlassBadge } from '../components/ui/GlassBadge';
import { GlassModal } from '../components/ui/GlassModal';
import { GlassInput, GlassSelect, GlassTextarea } from '../components/ui/GlassInput';

const CONFIRMED_KEY = 'civicax_confirmed_reports';

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
    <div className="animate-pulse flex flex-col gap-3 p-5 rounded-2xl bg-white/40 border border-slate-100">
      <div className="flex gap-3 items-center">
        <div className="h-5 w-16 rounded-full bg-slate-200" />
        <div className="h-4 w-28 rounded bg-slate-100" />
      </div>
      <div className="h-4 w-full rounded bg-slate-100" />
      <div className="h-4 w-3/4 rounded bg-slate-100" />
    </div>
  );
}

export function SafetyPage() {
  const { hasRole } = useAuth();
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedIds, setConfirmedIds] = useState(getConfirmedIds());

  const [formData, setFormData] = useState({
    incidentType: 'suspicious_activity',
    description: '',
    address: '',
    latitude: 18.7557,
    longitude: 73.4091,
    urgency: 'non_urgent',
    image: null
  });

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/safety/reports');
      const raw = res.data;
      const arr = raw?.data ?? raw?.reports ?? raw ?? [];
      setReports(Array.isArray(arr) ? arr : []);
    } catch {
      toast.error('Failed to load safety reports');
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
    try {
      // CRITICAL FIX: backend expects 'latitude' and 'longitude', NOT 'lat'/'lng'
      const data = new FormData();
      data.append('incidentType', formData.incidentType);
      data.append('description', formData.description);
      data.append('address', formData.address);
      data.append('latitude', String(formData.latitude));   // FIX: was 'lat'
      data.append('longitude', String(formData.longitude)); // FIX: was 'lng'
      data.append('urgency', formData.urgency);
      if (formData.image) data.append('images', formData.image);

      const res = await api.post('/safety/reports', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success(`Threat report submitted! ID: ${res.data.data?.id?.slice(0, 8).toUpperCase()}`);
      setIsModalOpen(false);
      setFormData({
        incidentType: 'suspicious_activity',
        description: '',
        address: '',
        latitude: 18.7557,
        longitude: 73.4091,
        urgency: 'non_urgent',
        image: null
      });
      fetchReports();
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to submit report';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm presence — safely increment score in local state only (never read from API response)
  const confirmReport = async (id) => {
    if (confirmedIds.includes(id)) return;
    try {
      await api.post(`/safety/reports/${id}/confirm`);
      saveConfirmedId(id);
      setConfirmedIds(prev => [...prev, id]);
      // Safe map: never reads from the API response — increments the existing value in state
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

  const urgentReports = reports.filter(r => r.urgency === 'immediate');
  const otherReports = reports.filter(r => r.urgency !== 'immediate');

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3" style={{ fontFamily: 'var(--font-heading)' }}>
            <ShieldAlert className="text-red-500" /> Safety Watch
          </h1>
          <p className="text-slate-600">Crowdsourced public safety threat monitoring.</p>
        </div>

        {hasRole(['citizen', 'admin', 'government']) && (
          <GlassButton variant="danger" onClick={() => setIsModalOpen(true)} className="whitespace-nowrap shadow-lg shadow-red-500/30">
            <Zap size={18} /> Report Threat
          </GlassButton>
        )}
      </div>

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
            <GlassCard className="text-center py-12 bg-green-50/30 border-green-200">
              <ShieldAlert size={40} className="mx-auto text-green-400 mb-4 opacity-50" />
              <p className="text-green-800 font-medium">No immediate safety threats reported.</p>
            </GlassCard>
          ) : (
            <div className="flex flex-col gap-4">
              {urgentReports.map(report => {
                const alreadyConfirmed = confirmedIds.includes(report.id);
                return (
                  <GlassCard key={report.id} padding="p-5" className="border-l-4 border-l-red-500 hover:shadow-lg transition-shadow bg-red-50/20">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <GlassBadge level="critical" label="URGENT" />
                        <span className="text-xs font-bold uppercase text-red-800 bg-red-100 px-2 py-0.5 rounded-full ring-1 ring-red-200">
                          {report.incidentType.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-semibold">{new Date(report.createdAt).toLocaleString()}</span>
                    </div>

                    <p className="text-sm font-medium text-slate-800 mb-4">{report.description}</p>

                    <div className="flex flex-wrap items-center justify-between gap-4 mt-auto">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium bg-white/60 px-2.5 py-1.5 rounded-lg border border-slate-200">
                        <MapPin size={14} className="text-red-500" />
                        <span className="truncate max-w-[200px]">{report.address}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-xs font-bold text-slate-500" title="Credibility Score">
                          <Eye size={14} /> {report.credibilityScore}
                        </div>
                        {alreadyConfirmed ? (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
                            <CheckCircle2 size={14} /> Confirmed ✓
                          </div>
                        ) : (
                          <GlassButton size="sm" variant="ghost" onClick={() => confirmReport(report.id)} className="h-8 py-0 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 border-[0.5px] border-blue-200">
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
          <h2 className="text-xl font-bold text-slate-800" style={{ fontFamily: 'var(--font-heading)' }}>
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
                return (
                  <GlassCard key={report.id} padding="p-4" className="hover:-translate-y-1 transition-transform cursor-pointer group">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold uppercase text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {report.incidentType.replace(/_/g, ' ')}
                      </span>
                      <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 group-hover:text-blue-500 transition-colors">
                        <Eye size={12} /> {report.credibilityScore}
                      </div>
                    </div>
                    <p className="text-sm text-slate-700 line-clamp-2 mb-3">{report.description}</p>
                    <div className="text-[10px] text-slate-500 flex justify-between items-center border-t border-slate-100 pt-2">
                      <span className="truncate max-w-[120px]">{report.address}</span>
                      <span>{new Date(report.createdAt).toLocaleDateString()}</span>
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
          <p><strong>Note:</strong> False reporting during emergencies is a punishable offense. AI credibility scoring is active.</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <GlassSelect
            label="Type of Incident"
            value={formData.incidentType}
            onChange={e => setFormData({...formData, incidentType: e.target.value})}
          >
            <option value="civil_unrest">Civil Unrest / Riot</option>
            <option value="suspicious_activity">Robbery / Suspicious Activity</option>
            <option value="medical_emergency">Public Medical Emergency</option>
            <option value="violence">Violence / Assault</option>
            <option value="road_accident">Severe Road Accident</option>
            <option value="other">Other Threat</option>
          </GlassSelect>

          <GlassSelect
            label="Urgency Level"
            value={formData.urgency}
            onChange={e => setFormData({...formData, urgency: e.target.value})}
          >
            <option value="non_urgent">Non-Urgent (Monitor)</option>
            <option value="immediate">IMMEDIATE THREAT (Dispatch Required)</option>
          </GlassSelect>

          <GlassTextarea
            label="Description"
            placeholder="Describe what is happening right now..."
            value={formData.description}
            onChange={e => setFormData({...formData, description: e.target.value})}
            required
            rows={3}
          />

          <GlassInput
            label="Current Location"
            placeholder="Landmark or exact address"
            icon={MapPin}
            value={formData.address}
            onChange={e => setFormData({...formData, address: e.target.value})}
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Photo Evidence (Optional)</label>
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
