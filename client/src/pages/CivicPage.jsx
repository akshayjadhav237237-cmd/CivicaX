import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { HardHat, Plus, MapPin, CheckCircle, Clock, Search, Filter, ClipboardList } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import toast from 'react-hot-toast';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassButton } from '../components/ui/GlassButton';
import { GlassBadge } from '../components/ui/GlassBadge';
import { GlassModal } from '../components/ui/GlassModal';
import { GlassInput, GlassSelect, GlassTextarea } from '../components/ui/GlassInput';
import { GlassTimeline } from '../components/ui/GlassTimeline';
import { CivicGrievancePanel } from '../components/civic/CivicGrievancePanel';
import { GrievanceImageGallery } from '../components/civic/GrievanceImageGallery';

import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const resolveImageUrl = (img) => {
  if (!img) return '';
  if (img.startsWith('http')) return img;
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';
  const origin = baseUrl.replace('/api/v1', '');
  return `${origin}${img}`;
};

function RecenterMap({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

export function CivicPage() {
  const { user, hasRole } = useAuth();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'grievances' ? 'grievances' : 'reports';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [reports, setReports] = useState([]);
  const [depts, setDepts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (selectedReport) {
      setSelectedDeptId(selectedReport.departmentId || '');
    } else {
      setSelectedDeptId('');
    }
  }, [selectedReport]);
  
  // New Report Form
  const [formStep, setFormStep] = useState(1);
  const [formData, setFormData] = useState({
    category: 'pothole',
    description: '',
    address: '',
    latitude: 18.7557,
    longitude: 73.4091,
    images: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
        headers: {
          'User-Agent': 'CivicaX/1.0'
        }
      });
      const data = await res.json();
      if (data && data.display_name) {
        setFormData(prev => ({ ...prev, address: data.display_name, latitude: lat, longitude: lng }));
      } else {
        setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
      }
    } catch (err) {
      console.error('Reverse geocode failed:', err);
      setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
    }
  };

  const requestUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setFormData(prev => ({ ...prev, latitude, longitude }));
          reverseGeocode(latitude, longitude);
        },
        (error) => {
          console.warn('Geolocation error:', error);
          toast.error('Could not fetch your precise location. Using default center.');
        }
      );
    } else {
      toast.error('Geolocation is not supported by your browser.');
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [reportsRes, deptsRes] = await Promise.all([
        api.get('/civic/reports'),
        api.get('/civic/departments')
      ]);
      const reportsArr = reportsRes.data?.data?.reports || reportsRes.data?.data || reportsRes.data || [];
      const deptsArr   = deptsRes.data?.data || deptsRes.data || [];
      setReports(Array.isArray(reportsArr) ? reportsArr : []);
      setDepts(Array.isArray(deptsArr) ? deptsArr : []);
    } catch (err) {
      toast.error('Failed to load civic reports');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files).slice(0, 3);
      setFormData(prev => ({ ...prev, images: filesArray }));
    }
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (formData.description.trim().length < 10) {
      toast.error('Description must be at least 10 characters.');
      return;
    }
    if (!formData.address.trim()) {
      toast.error('Please provide a location address.');
      return;
    }
    setIsSubmitting(true);
    try {
      const data = new FormData();
      data.append('category', formData.category);
      data.append('description', formData.description);
      data.append('address', formData.address);
      data.append('latitude', String(formData.latitude));
      data.append('longitude', String(formData.longitude));
      if (formData.images && formData.images.length > 0) {
        formData.images.forEach(file => {
          data.append('images', file);
        });
      }

      // Do NOT set Content-Type manually — browser must set it with the correct multipart boundary
      const res = await api.post('/civic/reports', data);

      const code = res.data?.reportCode || res.reportCode || 'submitted';
      toast.success(`✅ Report ${code} submitted successfully!`);
      setIsModalOpen(false);
      setFormData({ category: 'pothole', description: '', address: '', latitude: 18.7557, longitude: 73.4091, images: [] });
      setFormStep(1);
      fetchData();
    } catch (err) {
      const msg = err.message || 'Failed to submit report';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };


  const updateStatus = async (reportId, newStatus, departmentId = null) => {
    try {
      const payload = {
        status: newStatus,
        note: `Status updated to ${newStatus.replace('_', ' ')}`,
      };
      if (departmentId) payload.departmentId = departmentId;
      // Correct URL: PUT /civic/reports/:id (no /status suffix)
      await api.put(`/civic/reports/${reportId}`, payload);
      toast.success('Status updated');
      fetchData();
      if (selectedReport && selectedReport.id === reportId) {
        setSelectedReport(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'submitted': return <GlassBadge level="info" label="Submitted" />;
      case 'assigned': return <GlassBadge level="warning" label="Assigned" />;
      case 'in_progress': return <GlassBadge level="watch" label="In Progress" />;
      case 'resolved': return <GlassBadge level="safe" label="Resolved" />;
      case 'rejected': return <GlassBadge level="critical" label="Rejected" />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-3" style={{ fontFamily: 'var(--font-heading)' }}>
            <HardHat className="text-orange-500" /> {hasRole(['department_op']) ? 'Department Queue' : 'Civic Manager'}
          </h1>
          <p className="text-slate-600 dark:text-slate-400">Track and manage community infrastructure reports.</p>
        </div>
        {hasRole(['citizen', 'admin']) && (
          <GlassButton onClick={() => setIsModalOpen(true)} className="whitespace-nowrap">
            <Plus size={18} /> New Report
          </GlassButton>
        )}
      </div>

      {/* Tab bar — only for citizens */}
      {hasRole(['citizen']) && (
        <div className="flex gap-1 glass-card p-1.5 w-fit">
          {[
            { id: 'reports',     label: 'Civic Reports', icon: HardHat },
            { id: 'grievances',  label: 'My Grievances', icon: ClipboardList },
          ].map(t => {
            const Ic = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === t.id ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-800/60'
                }`}
              >
                <Ic size={14}/> {t.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Grievances Tab */}
      {activeTab === 'grievances' ? (
        <CivicGrievancePanel/>
      ) : (<>

      {/* Filters */}
      <GlassCard padding="p-4" className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px] relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input 
            type="text" 
            placeholder="Search address or description..." 
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-white/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-blue-400"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-400 dark:text-slate-500" />
          <select 
            className="bg-white/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </GlassCard>

      {/* Reports Grid */}
      {(() => {
        const filteredReports = reports.filter((report) => {
          const matchesSearch = 
            report.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            report.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            report.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            report.reportCode?.toLowerCase().includes(searchQuery.toLowerCase());
          const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
          return matchesSearch && matchesStatus;
        });

        if (isLoading) {
          return <div className="text-center py-20 text-slate-500 dark:text-slate-400">Loading reports...</div>;
        }

        if (filteredReports.length === 0) {
          return (
            <GlassCard className="text-center py-16">
              <CheckCircle size={48} className="mx-auto text-green-500 mb-4 opacity-50" />
              <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">No issues found</h3>
              <p className="text-slate-500 dark:text-slate-400 mt-2">Adjust your query or check back later.</p>
            </GlassCard>
          );
        }

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredReports.map((report) => (
              <GlassCard key={report.id} padding="p-0" className="flex flex-col overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedReport(report)}>
                {report.imageUrl ? (
                <div className="h-48 w-full bg-slate-200 dark:bg-slate-800 relative">
                  <img src={report.imageUrl.startsWith('http') ? report.imageUrl : `http://localhost:3001${report.imageUrl}`} alt="Report" className="w-full h-full object-cover" />
                  <div className="absolute top-3 right-3">{getStatusBadge(report.status)}</div>
                </div>
              ) : (
                <div className="h-32 w-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center relative">
                  <HardHat size={32} className="text-slate-300 dark:text-slate-700" />
                  <div className="absolute top-3 right-3">{getStatusBadge(report.status)}</div>
                </div>
              )}
              
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 capitalize" style={{ fontFamily: 'var(--font-heading)' }}>
                    {report.category.replace('_', ' ')}
                  </h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </span>
                </div>
                
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2 flex-1">{report.description}</p>
                
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                  <MapPin size={14} className="text-blue-500" />
                  <span className="truncate">{report.address}</span>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      );
    })()}

      {/* New Report Modal */}
      <GlassModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Report Civic Issue" size="md">
        <form onSubmit={handleSubmitReport} className="flex flex-col gap-4">
          {formStep === 1 && (
            <div className="flex flex-col gap-4 animate-fadeIn">
              <GlassSelect 
                label="Issue Category" 
                value={formData.category} 
                onChange={e => setFormData({...formData, category: e.target.value})}
              >
                <option value="pothole">Pothole / Road Damage</option>
                <option value="broken_streetlight">Broken Streetlight</option>
                <option value="drainage">Clogged Drainage / Flooding</option>
                <option value="waste_management">Garbage / Waste Dump</option>
                <option value="water_supply">Water Supply Issue</option>
                <option value="other">Other Infrastructure</option>
              </GlassSelect>
              
              <GlassTextarea 
                label="Description" 
                placeholder="Provide details about the issue..." 
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                required
              />

              <div className="flex justify-end gap-3 mt-6">
                <GlassButton variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>Cancel</GlassButton>
                <GlassButton
                  type="button"
                  onClick={() => {
                    if (formData.description.trim().length < 10) {
                      toast.error('Description must be at least 10 characters.');
                      return;
                    }
                    setFormStep(2);
                  }}
                >
                  Next: Location &rarr;
                </GlassButton>
              </div>
            </div>
          )}

          {formStep === 2 && (
            <div className="flex flex-col gap-4 animate-fadeIn">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Issue Location</label>
                <button
                  type="button"
                  onClick={requestUserLocation}
                  className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1 font-semibold"
                >
                  📍 Use Current Location
                </button>
              </div>

              <div className="w-full h-[200px] relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                <MapContainer
                  center={[formData.latitude, formData.longitude]}
                  zoom={13}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  />
                  <Marker
                    position={[formData.latitude, formData.longitude]}
                    draggable={true}
                    eventHandlers={{
                      dragend: (e) => {
                        const marker = e.target;
                        const position = marker.getLatLng();
                        reverseGeocode(position.lat, position.lng);
                      },
                    }}
                  />
                  <RecenterMap lat={formData.latitude} lng={formData.longitude} />
                </MapContainer>
              </div>

              <GlassInput 
                label="Location Address" 
                placeholder="Drag pin on map or enter manually" 
                icon={MapPin}
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value})}
                required
              />

              <p className="text-[11px] text-slate-400">
                Coords: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
              </p>

              <div className="flex justify-end gap-3 mt-6">
                <GlassButton variant="ghost" type="button" onClick={() => setFormStep(1)}>&larr; Back</GlassButton>
                <GlassButton
                  type="button"
                  onClick={() => {
                    if (!formData.address.trim()) {
                      toast.error('Please provide a location address.');
                      return;
                    }
                    setFormStep(3);
                  }}
                >
                  Next: Photo &rarr;
                </GlassButton>
              </div>
            </div>
          )}

          {formStep === 3 && (
            <div className="flex flex-col gap-4 animate-fadeIn">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Photo Evidence (Optional)</label>
                <input 
                  type="file" 
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-300 cursor-pointer"
                />
              </div>

              {formData.images.length > 0 && (
                <div className="flex gap-2 mt-2 flex-wrap">
                  {formData.images.map((file, i) => (
                    <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200">
                      <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, images: prev.images.filter((_, idx) => idx !== i) }))}
                        className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] hover:bg-red-600 font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <GlassButton variant="ghost" type="button" onClick={() => setFormStep(2)}>&larr; Back</GlassButton>
                <GlassButton type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit Report'}
                </GlassButton>
              </div>
            </div>
          )}
        </form>
      </GlassModal>

      {/* Report Details Modal */}
      <GlassModal isOpen={!!selectedReport} onClose={() => setSelectedReport(null)} title="Report Details" size="lg">
        {selectedReport && (
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/2 flex flex-col gap-4">
              {selectedReport.images && selectedReport.images.length > 0 ? (
                <GrievanceImageGallery images={selectedReport.images.map(resolveImageUrl)} />
              ) : selectedReport.imageUrl ? (
                <img src={resolveImageUrl(selectedReport.imageUrl)} alt="Evidence" className="w-full h-48 object-cover rounded-xl border border-slate-200 dark:border-slate-800" />
              ) : (
                <div className="w-full h-48 bg-slate-100 dark:bg-slate-900 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-800">
                  <HardHat size={48} className="text-slate-300 dark:text-slate-700" />
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <GlassBadge level="info" label={selectedReport.category.replace('_', ' ').toUpperCase()} />
                {getStatusBadge(selectedReport.status)}
              </div>
              
              <div>
                <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">Description</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 bg-white/50 dark:bg-slate-900/40 p-3 rounded-lg border border-slate-100 dark:border-slate-800">{selectedReport.description}</p>
              </div>

              <div>
                <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">Location</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <MapPin size={16} className="text-blue-500" /> {selectedReport.address}
                </p>
              </div>
            </div>

            <div className="w-full md:w-1/2 flex flex-col gap-4">
              <h4 className="font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-2">Resolution Timeline</h4>
              
              <div className="bg-white/40 dark:bg-slate-950/20 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex-1 overflow-y-auto max-h-[300px]">
                {selectedReport.timeline && selectedReport.timeline.length > 0 ? (
                  <GlassTimeline events={selectedReport.timeline.map(t => ({
                    id: t.id,
                    status: t.status,
                    label: `Status: ${t.status.replace('_', ' ')}`,
                    description: t.note,
                    timestamp: t.createdAt
                  }))} />
                ) : (
                  <p className="text-sm text-slate-500 text-center py-4">No timeline events yet.</p>
                )}
              </div>

              {hasRole(['department_op', 'admin']) && selectedReport.status !== 'resolved' && (
                <div className="border-t border-slate-200 dark:border-slate-800 pt-4 mt-auto">
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Update Status</h4>
                  
                  {selectedReport.status === 'submitted' && (
                    <div className="flex flex-col gap-1.5 mb-3 w-full animate-fadeIn">
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Select Department</label>
                      <select
                        className="bg-white/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none w-full"
                        value={selectedDeptId}
                        onChange={e => setSelectedDeptId(e.target.value)}
                      >
                        <option value="">-- Select Department --</option>
                        {depts.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 text-sm">
                    {selectedReport.status === 'submitted' && (
                      <GlassButton 
                        size="sm" 
                        onClick={() => {
                          if (!selectedDeptId) {
                            toast.error('Please select a department first');
                            return;
                          }
                          updateStatus(selectedReport.id, 'assigned', selectedDeptId);
                        }}
                      >
                        Assign to Dept
                      </GlassButton>
                    )}
                    {['submitted','assigned'].includes(selectedReport.status) && <GlassButton size="sm" onClick={() => updateStatus(selectedReport.id, 'in_progress')}>Mark In Progress</GlassButton>}
                    {selectedReport.status === 'in_progress' && <GlassButton size="sm" onClick={() => updateStatus(selectedReport.id, 'resolved')} className="bg-green-600 hover:bg-green-700 text-white border-0 shadow-lg">Mark Resolved</GlassButton>}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </GlassModal>
      </>)}
    </div>
  );
}
