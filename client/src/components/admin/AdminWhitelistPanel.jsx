import { useState, useEffect } from 'react';
import {
  Activity, Server, Clock, AlertCircle, AlertTriangle,
  CheckCircle, CheckCircle2, RefreshCw, Wifi, WifiOff,
  Shield, XCircle, Info, Zap, Plus, Trash2,
  ToggleLeft, ToggleRight, Search, Loader2
} from 'lucide-react';

import { GlassModal } from '../ui/GlassModal';
import { GlassButton } from '../ui/GlassButton';
import api from '../../services/api';
import toast from 'react-hot-toast';

export function AdminWhitelistPanel() {
  const [officials, setOfficials] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState({ officialId: '', name: '', jurisdiction: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { fetchOfficials(); }, []);

  const fetchOfficials = async (q = '') => {
    setIsLoading(true);
    try {
      const res = await api.get('/admin/whitelist', { params: q ? { q } : {} });
      setOfficials(res.data.data || []);
    } catch { toast.error('Failed to load whitelist'); }
    finally { setIsLoading(false); }
  };

  const handleSearch = (e) => {
    const v = e.target.value;
    setQuery(v);
    fetchOfficials(v);
  };

  const handleAdd = async () => {
    if (!form.officialId || !form.name || !form.jurisdiction) {
      toast.error('All fields are required');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post('/admin/whitelist', form);
      toast.success(`Official ${form.officialId} whitelisted`);
      setForm({ officialId: '', name: '', jurisdiction: '' });
      setIsAddOpen(false);
      fetchOfficials();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add');
    } finally { setIsSubmitting(false); }
  };

  const handleToggle = async (official) => {
    try {
      await api.put(`/admin/whitelist/${official.id}`, { isActive: !official.isActive });
      toast.success(`${official.officialId} ${official.isActive ? 'deactivated' : 'activated'}`);
      fetchOfficials(query);
    } catch { toast.error('Toggle failed'); }
  };

  const handleDelete = async (official) => {
    try {
      await api.delete(`/admin/whitelist/${official.id}`);
      toast.success('Official deactivated');
      fetchOfficials(query);
    } catch { toast.error('Delete failed'); }
  };

  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-800">Official ID Whitelist</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Users who register with a whitelisted Official ID automatically receive the <strong>government</strong> role.
          </p>
        </div>
        <GlassButton size="sm" variant="primary" onClick={() => setIsAddOpen(true)} className="gap-1 text-xs flex-shrink-0">
          <Plus size={12}/> Add Official
        </GlassButton>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
        <input
          type="text" value={query} onChange={handleSearch}
          placeholder="Search by ID, name or jurisdiction..."
          className="glass-input w-full pl-8 text-sm"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">{[1,2,3].map(i=><div key={i} className="h-12 animate-pulse bg-slate-100 rounded-xl"/>)}</div>
      ) : officials.length === 0 ? (
        <p className="text-center text-slate-400 text-sm py-6">No whitelisted officials found</p>
      ) : (
        <div className="space-y-2">
          {officials.map(o => (
            <div key={o.id} className={`glass-card p-3 flex items-center gap-3 ${!o.isActive ? 'opacity-50' : ''}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold text-blue-700">{o.officialId}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${o.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {o.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">{o.name} · {o.jurisdiction}</p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => handleToggle(o)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                  title={o.isActive ? 'Deactivate' : 'Activate'}
                >
                  {o.isActive ? <ToggleRight size={18} className="text-green-500"/> : <ToggleLeft size={18}/>}
                </button>
                <button
                  onClick={() => handleDelete(o)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors"
                  title="Remove"
                >
                  <Trash2 size={14}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      <GlassModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Official to Whitelist">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Official ID</label>
            <input
              type="text" className="glass-input w-full text-sm font-mono"
              placeholder="e.g. GOV-MH-2026-001"
              value={form.officialId}
              onChange={e => setForm(f => ({ ...f, officialId: e.target.value }))}
            />
            <p className="text-xs text-slate-400 mt-1">This ID must match what the official enters during registration.</p>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Full Name</label>
            <input type="text" className="glass-input w-full text-sm" placeholder="e.g. District Collector Dr. Rajesh Patil"
              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}/>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Jurisdiction</label>
            <input type="text" className="glass-input w-full text-sm" placeholder="e.g. Lonavla Municipal Council, Pune District"
              value={form.jurisdiction} onChange={e => setForm(f => ({ ...f, jurisdiction: e.target.value }))}/>
          </div>
          <div className="flex gap-3">
            <GlassButton variant="ghost" onClick={() => setIsAddOpen(false)} className="flex-1">Cancel</GlassButton>
            <GlassButton variant="primary" onClick={handleAdd} disabled={isSubmitting} className="flex-1 flex items-center justify-center gap-2">
              {isSubmitting ? <Loader2 size={14} className="animate-spin"/> : <Plus size={14}/>} Whitelist
            </GlassButton>
          </div>
        </div>
      </GlassModal>
    </div>
  );
}
