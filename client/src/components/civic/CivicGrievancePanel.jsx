import { useState, useEffect } from 'react';
import { ClipboardList, Plus, CheckCircle2, Loader2, Star, ChevronDown, ChevronRight } from 'lucide-react';
import { GlassModal } from '../ui/GlassModal';
import { GlassButton } from '../ui/GlassButton';
import api from '../../services/api';
import toast from 'react-hot-toast';

const STATUS_COLOR = {
  submitted:    'bg-slate-100 text-slate-600',
  under_review: 'bg-blue-100 text-blue-700',
  approved:     'bg-green-100 text-green-700',
  assigned:     'bg-indigo-100 text-indigo-700',
  rejected:     'bg-red-100 text-red-700',
  in_progress:  'bg-yellow-100 text-yellow-700',
  resolved:     'bg-emerald-100 text-emerald-700',
};
const CAT_ICONS = { pothole:'🛣️', broken_streetlight:'💡', waste_management:'🗑️', drainage:'🚰', water_supply:'💧', other:'📋' };

function SubmitGrievanceModal({ isOpen, onClose, onSuccess }) {
  const [form, setForm] = useState({ category: 'pothole', title: '', description: '', address: '' });
  const [images, setImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!form.title || form.description.trim().length < 20) {
      toast.error('Title required and description must be at least 20 characters');
      return;
    }
    setIsSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      images.forEach(img => fd.append('images', img));
      const res = await api.post('/civic/grievances', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(res.data.message || 'Grievance submitted');
      onSuccess();
      onClose();
      setForm({ category: 'pothole', title: '', description: '', address: '' });
      setImages([]);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Submission failed');
    } finally { setIsSubmitting(false); }
  };

  return (
    <GlassModal isOpen={isOpen} onClose={onClose} title="📋 Submit a Grievance">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Category</label>
            <select className="glass-input w-full text-sm" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              <option value="pothole">🛣️ Pothole</option>
              <option value="broken_streetlight">💡 Streetlight</option>
              <option value="waste_management">🗑️ Waste Management</option>
              <option value="drainage">🚰 Drainage</option>
              <option value="water_supply">💧 Water Supply</option>
              <option value="other">📋 Other</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Title</label>
            <input className="glass-input w-full text-sm" placeholder="Brief issue title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}/>
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">Description (min 20 characters)</label>
          <textarea rows={3} className="glass-input w-full text-sm resize-none" placeholder="Describe the issue in detail..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}/>
          <p className={`text-xs mt-1 ${form.description.length < 20 ? 'text-red-400' : 'text-green-500'}`}>{form.description.length}/20 min</p>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">Location / Address</label>
          <input className="glass-input w-full text-sm" placeholder="e.g. Near Station Road, Lonavla" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}/>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">Photos (optional, max 3)</label>
          <input type="file" accept="image/*" multiple onChange={e => setImages(Array.from(e.target.files).slice(0,3))}/>
          {images.length > 0 && <p className="text-xs text-green-600 mt-1">{images.length} photo(s) selected</p>}
        </div>
        <div className="flex gap-3">
          <GlassButton variant="ghost" onClick={onClose} className="flex-1">Cancel</GlassButton>
          <GlassButton variant="primary" onClick={handleSubmit} disabled={isSubmitting} className="flex-1 flex items-center justify-center gap-2">
            {isSubmitting ? <><Loader2 size={14} className="animate-spin"/> Submitting...</> : <><Plus size={14}/> Submit</>}
          </GlassButton>
        </div>
      </div>
    </GlassModal>
  );
}

function GrievanceCard({ grievance }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');

  const handleFeedback = async () => {
    try {
      await api.post(`/civic/grievances/${grievance.id}/feedback`, { rating, comment: feedbackComment });
      toast.success('Thank you for your feedback!');
      setIsFeedbackOpen(false);
    } catch (err) { toast.error(err.response?.data?.error || 'Feedback failed'); }
  };

  return (
    <div className="glass-card p-4">
      <div className="flex items-start gap-3">
        <span className="text-xl">{CAT_ICONS[grievance.category] || '📋'}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h4 className="font-semibold text-slate-800 text-sm">{grievance.title}</h4>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[grievance.status]}`}>
              {grievance.status.replace('_', ' ')}
            </span>
          </div>
          <p className="text-xs text-slate-500 line-clamp-2">{grievance.description}</p>
          {grievance.assignedDepartment && (
            <p className="text-xs text-slate-400 mt-0.5">🏢 {grievance.assignedDepartment.name}</p>
          )}
          <p className="text-xs text-slate-400 mt-0.5">
            {new Date(grievance.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
          </p>
        </div>
        <button onClick={() => setIsOpen(o => !o)} className="text-slate-400 hover:text-slate-700">
          {isOpen ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
        </button>
      </div>

      {isOpen && grievance.updates?.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Timeline</p>
          {grievance.updates.map((u, i) => (
            <div key={i} className="flex gap-2 text-xs">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0"/>
              <div>
                <span className="font-medium text-slate-700 capitalize">{u.status?.replace('_',' ')}</span>
                {u.note && <p className="text-slate-500 mt-0.5">{u.note}</p>}
                <p className="text-slate-400">{new Date(u.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</p>
              </div>
            </div>
          ))}
          {/* Feedback option for resolved grievances */}
          {grievance.status === 'resolved' && !grievance.feedback && (
            <GlassButton size="sm" variant="ghost" onClick={() => setIsFeedbackOpen(true)} className="text-xs gap-1 mt-2">
              <Star size={12}/> Rate Resolution
            </GlassButton>
          )}
          {grievance.feedback && (
            <p className="text-xs text-green-600">✓ Feedback submitted — {grievance.feedback.rating} stars</p>
          )}
        </div>
      )}

      {/* Feedback Modal */}
      <GlassModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} title="⭐ Rate Resolution">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">How satisfied are you with the resolution of: <strong>{grievance.title}</strong>?</p>
          <div className="flex gap-2 justify-center">
            {[1,2,3,4,5].map(s => (
              <button key={s} onClick={() => setRating(s)}>
                <Star size={28} className={s <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'}/>
              </button>
            ))}
          </div>
          <textarea rows={2} className="glass-input w-full text-sm resize-none" placeholder="Any comments..." value={feedbackComment} onChange={e => setFeedbackComment(e.target.value)}/>
          <div className="flex gap-3">
            <GlassButton variant="ghost" onClick={() => setIsFeedbackOpen(false)} className="flex-1">Cancel</GlassButton>
            <GlassButton variant="primary" onClick={handleFeedback} className="flex-1">Submit Feedback</GlassButton>
          </div>
        </div>
      </GlassModal>
    </div>
  );
}

export function CivicGrievancePanel() {
  const [grievances, setGrievances] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);

  const fetchGrievances = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/civic/grievances/mine');
      setGrievances(res.data.data || []);
    } catch { toast.error('Failed to load grievances'); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchGrievances(); }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <ClipboardList size={18} className="text-orange-500"/> My Grievances
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Submit issues that require government budget approval and department assignment.</p>
        </div>
        <GlassButton size="sm" variant="primary" onClick={() => setIsSubmitOpen(true)} className="gap-1 text-xs flex-shrink-0">
          <Plus size={12}/> New Grievance
        </GlassButton>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 animate-pulse glass-card bg-slate-100/60"/>)}</div>
      ) : grievances.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <ClipboardList size={32} className="mx-auto text-slate-300 mb-3"/>
          <p className="text-slate-500 text-sm">No grievances submitted yet</p>
          <p className="text-slate-400 text-xs mt-1">
            Grievances go through government review for budget approval — different from regular civic reports.
          </p>
          <GlassButton size="sm" variant="primary" onClick={() => setIsSubmitOpen(true)} className="mt-4 mx-auto gap-1">
            <Plus size={12}/> Submit Your First Grievance
          </GlassButton>
        </div>
      ) : (
        <div className="space-y-3">
          {grievances.map(g => <GrievanceCard key={g.id} grievance={g}/>)}
        </div>
      )}

      <SubmitGrievanceModal
        isOpen={isSubmitOpen}
        onClose={() => setIsSubmitOpen(false)}
        onSuccess={fetchGrievances}
      />
    </div>
  );
}
