import { useState, useEffect } from 'react';
import {
  ClipboardList, CheckCircle, CheckCircle2, XCircle,
  ChevronDown, ChevronRight, Loader2, AlertTriangle,
  AlertCircle, RefreshCw, Activity, Info, Clock
} from 'lucide-react';

import { GlassCard } from '../ui/GlassCard';
import { GlassButton } from '../ui/GlassButton';
import { GlassBadge } from '../ui/GlassBadge';
import { GlassModal } from '../ui/GlassModal';
import api from '../../services/api';
import toast from 'react-hot-toast';

const CATEGORY_ICONS = {
  pothole:             '🛣️',
  broken_streetlight:  '💡',
  waste_management:    '🗑️',
  drainage:            '🚰',
  water_supply:        '💧',
  other:               '📋',
};

const STATUS_STYLE = {
  submitted:     'bg-slate-100 text-slate-600',
  under_review:  'bg-blue-100 text-blue-700',
  approved:      'bg-green-100 text-green-700',
  assigned:      'bg-indigo-100 text-indigo-700',
  rejected:      'bg-red-100 text-red-700',
  in_progress:   'bg-yellow-100 text-yellow-700',
  resolved:      'bg-emerald-100 text-emerald-700',
};

function ApprovalModal({ grievance, isOpen, onClose, departments, onSuccess }) {
  const [form, setForm] = useState({
    approvedBudget: '',
    assignedDepartmentId: '',
    estimatedResolutionDays: 30,
    priority: 'medium',
    internalNotes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleApprove = async () => {
    if (!form.approvedBudget || !form.assignedDepartmentId) {
      toast.error('Budget and department are required');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.put(`/government/grievances/${grievance.id}/approve`, {
        ...form,
        approvedBudget: Number(form.approvedBudget),
        estimatedResolutionDays: Number(form.estimatedResolutionDays),
      });
      toast.success('Grievance approved and assigned');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Approval failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <GlassModal isOpen={isOpen} onClose={onClose} title="✅ Approve Grievance">
      <div className="space-y-4">
        <div className="glass-card p-3 bg-blue-50/60 text-sm text-blue-800">
          <strong>{CATEGORY_ICONS[grievance?.category]} {grievance?.title}</strong>
          <p className="text-xs mt-1 text-blue-600 line-clamp-2">{grievance?.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Approved Budget (₹)</label>
            <input
              type="number" min="1"
              className="glass-input w-full text-sm"
              placeholder="e.g. 150000"
              value={form.approvedBudget}
              onChange={e => setForm(f => ({ ...f, approvedBudget: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Est. Days to Resolve</label>
            <input
              type="number" min="1" max="365"
              className="glass-input w-full text-sm"
              value={form.estimatedResolutionDays}
              onChange={e => setForm(f => ({ ...f, estimatedResolutionDays: e.target.value }))}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">Assign Department</label>
          <select
            className="glass-input w-full text-sm"
            value={form.assignedDepartmentId}
            onChange={e => setForm(f => ({ ...f, assignedDepartmentId: e.target.value }))}
          >
            <option value="">-- Select Department --</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">Priority</label>
          <select
            className="glass-input w-full text-sm"
            value={form.priority}
            onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
          >
            <option value="low">🟢 Low</option>
            <option value="medium">🟡 Medium</option>
            <option value="high">🟠 High</option>
            <option value="critical">🔴 Critical</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">Internal Notes (optional)</label>
          <textarea
            rows={2} className="glass-input w-full text-sm resize-none"
            value={form.internalNotes}
            onChange={e => setForm(f => ({ ...f, internalNotes: e.target.value }))}
            placeholder="Notes for the department..."
          />
        </div>

        <div className="flex gap-3">
          <GlassButton variant="ghost" onClick={onClose} className="flex-1">Cancel</GlassButton>
          <GlassButton
            variant="primary" onClick={handleApprove}
            disabled={isSubmitting}
            className="flex-1 flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader2 size={14} className="animate-spin"/> : <CheckCircle2 size={14}/>}
            Approve
          </GlassButton>
        </div>
      </div>
    </GlassModal>
  );
}

function RejectModal({ grievance, isOpen, onClose, onSuccess }) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReject = async () => {
    if (!reason || reason.trim().length < 5) {
      toast.error('Please provide a rejection reason');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.put(`/government/grievances/${grievance.id}/reject`, { reason });
      toast.success('Grievance rejection recorded');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Rejection failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <GlassModal isOpen={isOpen} onClose={onClose} title="❌ Reject Grievance">
      <div className="space-y-4">
        <div className="glass-card p-3 bg-red-50/60 text-sm text-red-800">
          <strong>{CATEGORY_ICONS[grievance?.category]} {grievance?.title}</strong>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">Rejection Reason</label>
          <textarea
            rows={3} className="glass-input w-full text-sm resize-none"
            placeholder="Explain why this grievance cannot be addressed..."
            value={reason}
            onChange={e => setReason(e.target.value)}
          />
        </div>
        <div className="flex gap-3">
          <GlassButton variant="ghost" onClick={onClose} className="flex-1">Cancel</GlassButton>
          <GlassButton
            variant="danger" onClick={handleReject}
            disabled={isSubmitting}
            className="flex-1 flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader2 size={14} className="animate-spin"/> : <XCircle size={14}/>}
            Reject
          </GlassButton>
        </div>
      </div>
    </GlassModal>
  );
}

export function GovernmentGrievanceQueue() {
  const [grievances, setGrievances] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('submitted');
  const [expandedId, setExpandedId] = useState(null);
  const [approveTarget, setApproveTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);

  useEffect(() => { fetchAll(); }, [statusFilter]);

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      const [gRes, dRes] = await Promise.all([
        api.get('/government/grievances', { params: { status: statusFilter } }),
        api.get('/civic/departments'),
      ]);
      setGrievances(gRes.data.data || []);
      setDepartments(dRes.data.departments || dRes.data.data || []);
    } catch (_) {
      toast.error('Failed to load grievances');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1,2,3].map(i => <div key={i} className="glass-card p-5 animate-pulse h-20 bg-slate-100/60"/>)}
      </div>
    );
  }

  const filters = ['submitted', 'under_review', 'assigned', 'in_progress', 'resolved', 'rejected'];

  return (
    <div className="space-y-4">
      {/* Status filter pills */}
      <div className="flex gap-2 flex-wrap">
        {filters.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all capitalize ${
              statusFilter === s
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white/50 text-slate-600 hover:bg-white/70 border border-slate-200'
            }`}
          >
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {grievances.length === 0 && (
        <div className="glass-card p-8 text-center">
          <ClipboardList size={32} className="mx-auto text-slate-300 mb-3"/>
          <p className="text-slate-500 text-sm">No {statusFilter.replace('_', ' ')} grievances</p>
        </div>
      )}

      {grievances.map(g => {
        const isExpanded = expandedId === g.id;
        return (
          <div key={g.id} className="glass-card p-4">
            <div className="flex items-start gap-3">
              <span className="text-xl">{CATEGORY_ICONS[g.category] || '📋'}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h4 className="font-semibold text-slate-800 text-sm">{g.title}</h4>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[g.status]}`}>
                    {g.status.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-slate-400 capitalize">{g.category.replace('_', ' ')}</span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2">{g.description}</p>
                {g.address && <p className="text-xs text-slate-400 mt-0.5">📍 {g.address}</p>}
                <p className="text-xs text-slate-400 mt-0.5">
                  {new Date(g.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                </p>
              </div>
              <button
                onClick={() => setExpandedId(isExpanded ? null : g.id)}
                className="text-slate-400 hover:text-slate-700 flex-shrink-0"
              >
                {isExpanded ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
              </button>
            </div>

            {/* Action buttons for submitted/under_review */}
            {['submitted', 'under_review'].includes(g.status) && (
              <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                <GlassButton
                  size="sm" variant="primary"
                  onClick={() => setApproveTarget(g)}
                  className="flex-1 text-xs flex items-center justify-center gap-1"
                >
                  <CheckCircle2 size={12}/> Approve & Assign
                </GlassButton>
                <GlassButton
                  size="sm" variant="danger"
                  onClick={() => setRejectTarget(g)}
                  className="flex-1 text-xs flex items-center justify-center gap-1"
                >
                  <XCircle size={12}/> Reject
                </GlassButton>
              </div>
            )}

            {/* Expanded detail */}
            {isExpanded && (
              <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
                {g.assignedDepartment && (
                  <p className="text-xs text-slate-600">🏢 Assigned to: <strong>{g.assignedDepartment.name}</strong></p>
                )}
                {g.approvedBudget && (
                  <p className="text-xs text-slate-600">💰 Budget: <strong>₹{g.approvedBudget.toLocaleString('en-IN')}</strong></p>
                )}
                {g.estimatedResolutionDays && (
                  <p className="text-xs text-slate-600">📅 Est. resolution: <strong>{g.estimatedResolutionDays} days</strong></p>
                )}
                {g.updates?.length > 0 && (
                  <p className="text-xs text-slate-400">{g.updates.length} status update(s)</p>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Modals */}
      <ApprovalModal
        isOpen={!!approveTarget}
        grievance={approveTarget}
        departments={departments}
        onClose={() => setApproveTarget(null)}
        onSuccess={fetchAll}
      />
      <RejectModal
        isOpen={!!rejectTarget}
        grievance={rejectTarget}
        onClose={() => setRejectTarget(null)}
        onSuccess={fetchAll}
      />
    </div>
  );
}
