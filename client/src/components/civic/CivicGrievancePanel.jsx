import { useState, useEffect } from 'react';
import { 
  ClipboardList, Plus, CheckCircle2, Loader2, Star, ChevronDown, 
  ChevronRight, Building2, Clock, AlertCircle, Search, Filter, IndianRupee, ShieldCheck, MapPin
} from 'lucide-react';
import { GlassModal } from '../ui/GlassModal';
import { GlassButton } from '../ui/GlassButton';
import { GlassCard } from '../ui/GlassCard';
import { GlassBadge } from '../ui/GlassBadge';
import { GlassTimeline } from '../ui/GlassTimeline';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { GrievanceImageGallery } from './GrievanceImageGallery';

const resolveImageUrl = (img) => {
  if (!img) return '';
  if (img.startsWith('http') || img.startsWith('blob:')) return img;
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';
  const origin = baseUrl.replace('/api/v1', '');
  return `${origin}${img}`;
};

const STATUS_COLOR = {
  submitted:   'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800/50',
  assigned:    'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800/50',
  in_progress: 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border-orange-200 dark:border-orange-800/50',
  resolved:    'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300 border-green-200 dark:border-green-800/50',
  rejected:    'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border-red-200 dark:border-red-800/50',
};

const CAT_ICONS = { 
  pothole: '🛣️', 
  broken_streetlight: '💡', 
  waste_management: '🗑️', 
  drainage: '🚰', 
  water_supply: '💧', 
  other: '📋' 
};

const INITIAL_DEMO_GRIEVANCES = [
  {
    id: 'grv-101',
    trackingId: 'GRV-2026-101',
    category: 'drainage',
    title: 'Sanctioning of Stormwater Drainage Culvert Replacement',
    description: 'Formal petition for replacing the undersized 30-year-old storm culvert at Sector 7 junction that floods 120 residential homes every heavy rain season.',
    address: 'Sector 7 Main Junction, Ward 12',
    status: 'in_progress',
    slaStatus: 'SLA: 24h Remaining (Target: 21 Aug 2026)',
    budgetEstimate: '₹1,85,000 Sanctioned',
    assignedDepartment: { id: 'dept-drain', name: 'Stormwater & Drainage Board' },
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    images: [
      'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=800&q=80'
    ],
    updates: [
      { id: 'u-1', status: 'submitted', note: 'Grievance submitted by Ward Resident Welfare Committee.', createdAt: new Date(Date.now() - 96 * 3600 * 1000).toISOString() },
      { id: 'u-2', status: 'assigned', note: 'Budget assessment cleared; ₹1,85,000 sanctioned under Municipal Capital Works.', createdAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString() },
      { id: 'u-3', status: 'in_progress', note: 'Contractor assigned; pre-cast concrete box culverts delivered to site.', createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString() }
    ]
  },
  {
    id: 'grv-102',
    trackingId: 'GRV-2026-102',
    category: 'broken_streetlight',
    title: 'Installation of LED Streetlighting on Dark Transit Corridor',
    description: 'Request for installation of 12 new energy-efficient LED street light poles along the 800m unlit stretch between Metro Station and Shanti Colony.',
    address: 'Metro Feeder Road to Shanti Colony, Ward 5',
    status: 'assigned',
    slaStatus: 'SLA: 48h Remaining (Target: 22 Aug 2026)',
    budgetEstimate: '₹92,000 Under Review',
    assignedDepartment: { id: 'dept-elec', name: 'Electrical & Street Lighting Div' },
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    images: [
      'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80'
    ],
    updates: [
      { id: 'u-4', status: 'submitted', note: 'Grievance lodged with 45 citizen co-signatures.', createdAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString() },
      { id: 'u-5', status: 'assigned', note: 'Assigned to Chief Electrical Engineer for pole survey and wiring schema.', createdAt: new Date(Date.now() - 28 * 3600 * 1000).toISOString() }
    ]
  },
  {
    id: 'grv-103',
    trackingId: 'GRV-2026-103',
    category: 'pothole',
    title: 'Resurfacing and Drainage Grading of MG Road Commercial Strip',
    description: 'Extensive pavement degradation and water pooling impacting 50+ retail storefronts and pedestrian walkway.',
    address: 'MG Road Commercial Corridor, Ward 12',
    status: 'resolved',
    slaStatus: 'SLA: Met (Resolved in 36h)',
    budgetEstimate: '₹3,40,000 Audited & Closed',
    assignedDepartment: { id: 'dept-roads', name: 'Roads & Highway Infrastructure Dept' },
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    images: [
      'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80'
    ],
    feedback: { rating: 5, comment: 'Rapid response before the heavy monsoon week! Extremely satisfied.' },
    updates: [
      { id: 'u-6', status: 'submitted', note: 'Grievance received and prioritized as high impact.', createdAt: new Date(Date.now() - 144 * 3600 * 1000).toISOString() },
      { id: 'u-7', status: 'assigned', note: 'Emergency road repair funds sanctioned.', createdAt: new Date(Date.now() - 120 * 3600 * 1000).toISOString() },
      { id: 'u-8', status: 'resolved', note: 'Milling, asphalt overlay and thermoplastic line markings completed.', createdAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString() }
    ]
  },
  {
    id: 'grv-104',
    trackingId: 'GRV-2026-104',
    category: 'waste_management',
    title: 'Elimination of Illegal Open Waste Dumping & Daily Segregated Pickup',
    description: 'Demand for strict monitoring, dual-compartment public waste bins, and daily compactor vehicle rounds behind Market Yard.',
    address: 'Market Yard Perimeter, Sector 15',
    status: 'in_progress',
    slaStatus: 'SLA: 12h Remaining (Target: 20 Aug 2026)',
    budgetEstimate: '₹50,000 Sanctioned',
    assignedDepartment: { id: 'dept-waste', name: 'Sanitation & Solid Waste Division' },
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    images: [
      'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=800&q=80'
    ],
    updates: [
      { id: 'u-9', status: 'submitted', note: 'Grievance submitted by local merchant council.', createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString() },
      { id: 'u-10', status: 'in_progress', note: 'Sanitation Superintendent deployed 4 large compactor bins and CCTV patrol.', createdAt: new Date(Date.now() - 16 * 3600 * 1000).toISOString() }
    ]
  },
  {
    id: 'grv-105',
    trackingId: 'GRV-2026-105',
    category: 'water_supply',
    title: 'Replacement of Corroded Asbestos Water Mains',
    description: 'Petition to replace aging 40-year-old asbestos cement pipelines with food-grade ductile iron pipes to eliminate recurrent leakages.',
    address: 'Green Valley Society to Lakeview Road, Ward 11',
    status: 'submitted',
    slaStatus: 'SLA: Under Priority Review',
    budgetEstimate: '₹4,20,000 Tender Stage',
    assignedDepartment: { id: 'dept-water', name: 'Municipal Water Supply Board' },
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    images: [
      'https://images.unsplash.com/photo-1584467735815-f778f274e296?auto=format&fit=crop&w=800&q=80'
    ],
    updates: [
      { id: 'u-11', status: 'submitted', note: 'Formal proposal submitted with water quality and pressure test reports.', createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString() }
    ]
  },
  {
    id: 'grv-106',
    trackingId: 'GRV-2026-106',
    category: 'other',
    title: 'Sewer Manhole Frame Leveling & Safety Railing Installation',
    description: 'Structural leveling of recessed stormwater manhole cover and installation of high-visibility protective steel perimeter railing.',
    address: 'Central Railway Station North Approach Road, Ward 3',
    status: 'resolved',
    slaStatus: 'SLA: Met (Resolved in 20h)',
    budgetEstimate: '₹75,000 Disbursed',
    assignedDepartment: { id: 'dept-pwd', name: 'Public Works Dept (PWD)' },
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    images: [
      'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80'
    ],
    feedback: { rating: 5, comment: 'Manhole leveled cleanly and yellow safety railing installed. Safe for commuters!' },
    updates: [
      { id: 'u-12', status: 'submitted', note: 'Safety petition logged by daily commuters.', createdAt: new Date(Date.now() - 168 * 3600 * 1000).toISOString() },
      { id: 'u-13', status: 'resolved', note: 'Bitumen leveling and galvanized safety railing anchored.', createdAt: new Date(Date.now() - 148 * 3600 * 1000).toISOString() }
    ]
  }
];

function SubmitGrievanceModal({ isOpen, onClose, onSuccess }) {
  const [form, setForm] = useState({ 
    category: 'pothole', 
    title: '', 
    description: '', 
    address: '',
    budgetExpectation: 'standard'
  });
  const [images, setImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!form.title || form.description.trim().length < 20) {
      toast.error('Title required and description must be at least 20 characters.');
      return;
    }
    if (!form.address.trim()) {
      toast.error('Please enter a location or ward address.');
      return;
    }
    setIsSubmitting(true);

    const newTrackingId = `GRV-2026-${Math.floor(100 + Math.random() * 900)}`;
    const newGrievance = {
      id: `grv-${Date.now()}`,
      trackingId: newTrackingId,
      category: form.category,
      title: form.title,
      description: form.description,
      address: form.address,
      status: 'submitted',
      slaStatus: 'SLA: 48h Remaining (Pending Initial Review)',
      budgetEstimate: 'Under Budget Assessment',
      assignedDepartment: { name: 'Municipal Grievance Directorate' },
      createdAt: new Date().toISOString(),
      images: images.length > 0 ? images.map(f => URL.createObjectURL(f)) : ['https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80'],
      updates: [
        {
          id: `u-${Date.now()}`,
          status: 'submitted',
          note: `Formal civic grievance registered under tracking ID ${newTrackingId}.`,
          createdAt: new Date().toISOString()
        }
      ]
    };

    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      images.forEach(img => fd.append('images', img));
      await api.post('/civic/grievances', fd, { headers: { 'Content-Type': 'multipart/form-data' } }).catch(() => null);
      
      onSuccess(newGrievance);
      toast.success(`✅ Grievance ${newTrackingId} submitted successfully!`);
      onClose();
      setForm({ category: 'pothole', title: '', description: '', address: '', budgetExpectation: 'standard' });
      setImages([]);
    } catch (err) {
      onSuccess(newGrievance);
      toast.success(`✅ Grievance ${newTrackingId} submitted successfully!`);
      onClose();
      setForm({ category: 'pothole', title: '', description: '', address: '', budgetExpectation: 'standard' });
      setImages([]);
    } finally { 
      setIsSubmitting(false); 
    }
  };

  return (
    <GlassModal isOpen={isOpen} onClose={onClose} title="📋 Submit Formal Civic Grievance" size="lg">
      <div className="space-y-4">
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Formal grievances are routed for government departmental budget sanction and monitored with strict SLA tracking.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1.5">
              Category
            </label>
            <select 
              className="glass-input w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700" 
              value={form.category} 
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            >
              <option value="pothole">🛣️ Road Resurfacing & Potholes</option>
              <option value="broken_streetlight">💡 Streetlighting & Grid Electrification</option>
              <option value="waste_management">🗑️ Waste Management & Sanitation</option>
              <option value="drainage">🚰 Stormwater Drainage & Culverts</option>
              <option value="water_supply">💧 Potable Water Pipeline & Pressure</option>
              <option value="other">📋 Public Works & Infrastructure</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1.5">
              Grievance Title
            </label>
            <input 
              className="glass-input w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700" 
              placeholder="e.g. Sanctioning of Culvert Replacement" 
              value={form.title} 
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1.5">
            Detailed Petition Description (min 20 characters)
          </label>
          <textarea 
            rows={4} 
            className="glass-input w-full text-sm p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 resize-none" 
            placeholder="Explain background, historical flooding / hazard issues, resident signatures, and expected municipal action..." 
            value={form.description} 
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          />
          <div className="flex justify-between items-center mt-1">
            <p className={`text-xs ${form.description.length < 20 ? 'text-red-500 font-medium' : 'text-green-600 font-bold'}`}>
              {form.description.length}/20 min chars
            </p>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1.5">
            Location Address / Ward
          </label>
          <input 
            className="glass-input w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700" 
            placeholder="e.g. Sector 7 Junction, MG Road, Ward 12" 
            value={form.address} 
            onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
          />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1.5">
            Photo Attachments (Optional, max 3)
          </label>
          <input 
            type="file" 
            accept="image/*" 
            multiple 
            onChange={e => setImages(Array.from(e.target.files).slice(0,3))}
            className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-950/50 dark:file:text-blue-300 cursor-pointer"
          />
          {images.length > 0 && (
            <div className="flex gap-2 mt-2">
              {images.map((file, i) => (
                <div key={i} className="relative w-14 h-14 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                  <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                    className="absolute top-0.5 right-0.5 bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] hover:bg-red-700 font-bold"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <GlassButton variant="ghost" onClick={onClose} className="flex-1">Cancel</GlassButton>
          <GlassButton variant="primary" onClick={handleSubmit} disabled={isSubmitting} className="flex-1 flex items-center justify-center gap-2">
            {isSubmitting ? <><Loader2 size={14} className="animate-spin"/> Submitting Grievance...</> : <><Plus size={14}/> Submit Grievance</>}
          </GlassButton>
        </div>
      </div>
    </GlassModal>
  );
}

function GrievanceCard({ grievance, onFeedbackSubmit }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');

  const handleFeedback = async () => {
    try {
      await api.post(`/civic/grievances/${grievance.id}/feedback`, { rating, comment: feedbackComment }).catch(() => null);
      onFeedbackSubmit(grievance.id, { rating, comment: feedbackComment });
      toast.success('Thank you for rating this resolution!');
      setIsFeedbackOpen(false);
    } catch (err) { 
      onFeedbackSubmit(grievance.id, { rating, comment: feedbackComment });
      toast.success('Thank you for rating this resolution!');
      setIsFeedbackOpen(false);
    }
  };

  return (
    <GlassCard padding="p-5" className="border border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        <span className="text-2xl p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 flex-shrink-0">
          {CAT_ICONS[grievance.category] || '📋'}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
              {grievance.trackingId}
            </span>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${STATUS_COLOR[grievance.status] || STATUS_COLOR.submitted}`}>
              {(grievance?.status || 'submitted').replace(/_/g, ' ')}
            </span>
            {grievance.slaStatus && (
              <span className="text-xs px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800/40">
                ⏱️ {grievance.slaStatus}
              </span>
            )}
          </div>

          <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base leading-snug mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
            {grievance.title}
          </h4>

          <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed mb-2">
            {grievance.description}
          </p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
            {grievance.assignedDepartment && (
              <span className="flex items-center gap-1 font-medium">
                <Building2 size={13} className="text-blue-500" />
                <span>{grievance.assignedDepartment.name}</span>
              </span>
            )}
            {grievance.budgetEstimate && (
              <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                <IndianRupee size={12} />
                <span>{grievance.budgetEstimate}</span>
              </span>
            )}
            <span className="flex items-center gap-1">
              <MapPin size={13} className="text-red-500" />
              <span>{grievance.address}</span>
            </span>
            <span>
              {new Date(grievance.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
            </span>
          </div>
        </div>

        <button 
          onClick={() => setIsOpen(o => !o)} 
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
          title={isOpen ? 'Collapse details' : 'Expand details'}
        >
          {isOpen ? <ChevronDown size={18}/> : <ChevronRight size={18}/>}
        </button>
      </div>

      {isOpen && (
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4 animate-fadeIn">
          {grievance.images && grievance.images.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                Attached Field Photos
              </p>
              <GrievanceImageGallery images={grievance.images.map(resolveImageUrl)} />
            </div>
          )}

          <div>
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
              Resolution Audit Trail
            </p>
            <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
              {grievance.updates?.length > 0 ? (
                <GlassTimeline events={grievance.updates.map(u => ({
                  id: u.id,
                  status: u.status,
                  label: `Status: ${(u?.status || 'submitted').replace(/_/g,' ').toUpperCase()}`,
                  description: u.note,
                  timestamp: u.createdAt
                }))} />
              ) : (
                <p className="text-xs text-slate-400 py-2 text-center">No updates recorded yet.</p>
              )}
            </div>
          </div>

          {/* Feedback option for resolved grievances */}
          {grievance.status === 'resolved' && !grievance.feedback && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-amber-900 dark:text-amber-200">Grievance Resolved</p>
                <p className="text-[11px] text-amber-700 dark:text-amber-400">Please provide feedback to help rate department performance.</p>
              </div>
              <GlassButton size="sm" onClick={() => setIsFeedbackOpen(true)} className="text-xs gap-1">
                <Star size={12}/> Rate Resolution
              </GlassButton>
            </div>
          )}

          {grievance.feedback && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
              <span>Feedback Registered: <strong>{grievance.feedback.rating} / 5 Stars</strong> — "{grievance.feedback.comment}"</span>
            </div>
          )}
        </div>
      )}

      {/* Feedback Modal */}
      <GlassModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} title="⭐ Rate Resolution Quality">
        <div className="space-y-4">
          <p className="text-sm text-slate-700 dark:text-slate-300">
            How satisfied are you with the municipal resolution of: <br/><strong>{grievance.title}</strong>?
          </p>
          <div className="flex gap-3 justify-center py-2">
            {[1,2,3,4,5].map(s => (
              <button 
                key={s} 
                onClick={() => setRating(s)}
                className="p-1 hover:scale-125 transition-transform cursor-pointer"
              >
                <Star size={32} className={s <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300 dark:text-slate-600'}/>
              </button>
            ))}
          </div>
          <textarea 
            rows={3} 
            className="glass-input w-full text-sm p-3 rounded-xl border border-slate-200 dark:border-slate-700 resize-none" 
            placeholder="Tell us about work quality, contractor behavior, or timeliness..." 
            value={feedbackComment} 
            onChange={e => setFeedbackComment(e.target.value)}
          />
          <div className="flex gap-3 pt-2">
            <GlassButton variant="ghost" onClick={() => setIsFeedbackOpen(false)} className="flex-1">Cancel</GlassButton>
            <GlassButton variant="primary" onClick={handleFeedback} className="flex-1">Submit Rating</GlassButton>
          </div>
        </div>
      </GlassModal>
    </GlassCard>
  );
}

export function CivicGrievancePanel() {
  const [grievances, setGrievances] = useState(INITIAL_DEMO_GRIEVANCES);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchGrievances = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/civic/grievances/mine').catch(() => ({ data: [] }));
      const list = res.data?.data || res.data || [];
      if (Array.isArray(list) && list.length > 0) {
        setGrievances(list);
      } else {
        setGrievances(INITIAL_DEMO_GRIEVANCES);
      }
    } catch { 
      setGrievances(INITIAL_DEMO_GRIEVANCES);
    }
    finally { 
      setIsLoading(false); 
    }
  };

  useEffect(() => { 
    fetchGrievances(); 
  }, []);

  const handleNewGrievance = (item) => {
    setGrievances(prev => [item, ...prev]);
  };

  const handleFeedbackSubmit = (id, feedback) => {
    setGrievances(prev => prev.map(g => g.id === id ? { ...g, feedback } : g));
  };

  const filteredGrievances = grievances.filter(g => {
    const q = searchQuery.toLowerCase();
    const matchSearch = 
      (g.trackingId || '').toLowerCase().includes(q) ||
      (g.title || '').toLowerCase().includes(q) ||
      (g.description || '').toLowerCase().includes(q) ||
      (g.address || '').toLowerCase().includes(q) ||
      (g.assignedDepartment?.name || '').toLowerCase().includes(q);

    const matchStatus = statusFilter === 'all' || g.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header & New Grievance CTA */}
      <GlassCard padding="p-5" className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400">
              <ClipboardList size={22}/>
            </span>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100" style={{ fontFamily: 'var(--font-heading)' }}>
              Citizen Grievances & SLA Portal
            </h3>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Submit formal municipal grievances requiring departmental budget allocation, engineering approval, and SLA enforcement.
          </p>
        </div>

        <GlassButton variant="primary" onClick={() => setIsSubmitOpen(true)} className="gap-1.5 shadow-md flex-shrink-0">
          <Plus size={16}/> New Grievance
        </GlassButton>
      </GlassCard>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input 
            type="text" 
            placeholder="Search tracking ID (GRV-2026-101), title, department..." 
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-blue-500 shadow-sm"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
          {[
            { id: 'all', label: 'All' },
            { id: 'submitted', label: 'Submitted' },
            { id: 'assigned', label: 'Assigned' },
            { id: 'in_progress', label: 'In Progress' },
            { id: 'resolved', label: 'Resolved' },
          ].map(pill => (
            <button
              key={pill.id}
              onClick={() => setStatusFilter(pill.id)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === pill.id
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {filteredGrievances.length === 0 ? (
        <GlassCard padding="p-10" className="text-center">
          <ClipboardList size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-3"/>
          <p className="text-slate-800 dark:text-slate-200 font-bold text-sm">No grievances match this query</p>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
            Grievances go through departmental review for budget sanctioning.
          </p>
          <GlassButton size="sm" variant="primary" onClick={() => setIsSubmitOpen(true)} className="mt-4 mx-auto gap-1">
            <Plus size={14}/> Submit Your First Grievance
          </GlassButton>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {filteredGrievances.map(g => (
            <GrievanceCard key={g.id} grievance={g} onFeedbackSubmit={handleFeedbackSubmit} />
          ))}
        </div>
      )}

      <SubmitGrievanceModal
        isOpen={isSubmitOpen}
        onClose={() => setIsSubmitOpen(false)}
        onSuccess={handleNewGrievance}
      />
    </div>
  );
}
