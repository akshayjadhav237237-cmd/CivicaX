import { useEffect, useState } from 'react';
import {
  Users, Search, ShieldAlert, List, Wifi, Activity,
  AlertTriangle, AlertCircle, CheckCircle, CheckCircle2,
  XCircle, RefreshCw, Clock, Server, Shield, Info, Zap
} from 'lucide-react';

import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import toast from 'react-hot-toast';
import { GlassCard } from '../components/ui/GlassCard';
import { AdminWhitelistPanel } from '../components/admin/AdminWhitelistPanel';
import { AdminAPIHealthDashboard } from '../components/admin/AdminAPIHealthDashboard';
import { AdminFeatureHealthDashboard } from '../components/admin/AdminFeatureHealthDashboard';

const TABS = [
  { id: 'users',     label: 'Users',         icon: Users },
  { id: 'whitelist', label: 'Whitelist',      icon: List },
  { id: 'api-health',label: 'API Health',     icon: Wifi },
  { id: 'features',  label: 'Feature Health', icon: Activity },
];

export function AdminPage() {
  const { hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [failingFeatures, setFailingFeatures] = useState(0);

  useEffect(() => {
    fetchUsers();
    api.get('/admin/feature-health').then(res => {
      const data = res.data.data || [];
      setFailingFeatures(data.filter(r => r.status === 'failing').length);
    }).catch(() => {});
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get('/government/users');
      setUsers(data);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  if (!hasRole(['admin'])) {
    return <div className="p-8 text-center text-red-500 font-bold">Unauthorized Access</div>;
  }

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3" style={{ fontFamily: 'var(--font-heading)' }}>
          <ShieldAlert className="text-purple-600" /> Platform Administration
        </h1>
        <p className="text-slate-600">User management, official whitelisting, and system health monitoring.</p>
      </div>

      {failingFeatures > 0 && (
        <div className="glass-card p-3 bg-red-50/80 border-red-300 flex items-center gap-3">
          <Activity size={18} className="text-red-600 flex-shrink-0"/>
          <p className="text-sm text-red-700 font-medium">
            ⚠️ {failingFeatures} feature{failingFeatures !== 1 ? 's are' : ' is'} currently failing
          </p>
          <button onClick={() => setActiveTab('features')} className="ml-auto text-xs text-red-600 underline font-medium">View →</button>
        </div>
      )}

      <div className="flex gap-1 glass-card p-1.5 w-fit flex-wrap">
        {TABS.map(tab => {
          const Ic = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-600 hover:bg-white/60'
              }`}
            >
              <Ic size={14}/> {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'whitelist' && <AdminWhitelistPanel/>}

      {activeTab === 'api-health' && (
        <GlassCard padding="p-5">
          <h3 className="font-semibold text-slate-800 mb-4">External API Health</h3>
          <AdminAPIHealthDashboard/>
        </GlassCard>
      )}

      {activeTab === 'features' && (
        <GlassCard padding="p-5">
          <h3 className="font-semibold text-slate-800 mb-4">Application Feature Health</h3>
          <AdminFeatureHealthDashboard/>
        </GlassCard>
      )}

      {activeTab === 'users' && (<>
        <GlassCard padding="p-4" className="flex flex-wrap items-center gap-4 bg-white/40">
          <div className="flex-1 min-w-[200px] relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search users..."
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-white/60 border border-slate-200 text-sm focus:outline-none focus:border-purple-400"
            />
          </div>
        </GlassCard>

        <GlassCard padding="p-0" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-slate-50/50">
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="px-6 py-4 font-semibold">User</th>
                  <th className="px-6 py-4 font-semibold">Contact</th>
                  <th className="px-6 py-4 font-semibold">Role</th>
                  <th className="px-6 py-4 font-semibold">Location</th>
                  <th className="px-6 py-4 font-semibold">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr><td colSpan="5" className="py-8 text-center text-slate-500">Loading users...</td></tr>
                ) : users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{u.name}</div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">{u.id.substring(0,8)}...</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 truncate max-w-[200px]">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        u.role === 'admin' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                        u.role === 'government' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                        u.role === 'department_op' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                        'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{u.city}</td>
                    <td className="px-6 py-4 text-slate-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </>)}
    </div>
  );
}
