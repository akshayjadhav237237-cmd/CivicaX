import { useEffect, useState } from 'react';
import { History, Search, Filter } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassBadge } from '../components/ui/GlassBadge';

export function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => { fetchAlertHistory(); }, []);

  const fetchAlertHistory = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/emergency/alerts');
      const data = response.data?.data || response.data || [];
      setAlerts(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load alert history');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = !searchQuery || 
      (alert.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (alert.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = levelFilter === 'all' || alert.level === levelFilter;
    
    // Date filter
    const alertDate = new Date(alert.createdAt);
    let matchesDate = true;
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      matchesDate = matchesDate && alertDate >= start;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && alertDate <= end;
    }

    return matchesSearch && matchesLevel && matchesDate;
  });

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto w-full">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
          <History className="text-blue-500" /> Alert History
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Past emergency broadcasts and evacuation orders.</p>
      </div>

      {/* Search / Filter Bar */}
      <GlassCard padding="p-4" className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px] relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search alerts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg text-sm focus:outline-none"
            style={{
              background: 'var(--input-bg)',
              border: '1px solid var(--input-border)',
              color: 'var(--text-primary)',
            }}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">From:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-lg px-2.5 py-1.5 text-xs focus:outline-none cursor-pointer"
            style={{
              background: 'var(--input-bg)',
              border: '1px solid var(--input-border)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">To:</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-lg px-2.5 py-1.5 text-xs focus:outline-none cursor-pointer"
            style={{
              background: 'var(--input-bg)',
              border: '1px solid var(--input-border)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={16} style={{ color: 'var(--text-muted)' }} />
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="rounded-lg px-3 py-2 text-sm focus:outline-none cursor-pointer"
            style={{
              background: 'var(--input-bg)',
              border: '1px solid var(--input-border)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="all">All Levels</option>
            <option value="red">Red Critical</option>
            <option value="orange">Orange Warning</option>
            <option value="yellow">Yellow Watch</option>
          </select>
        </div>
      </GlassCard>

      {/* Alert List */}
      <div className="flex flex-col gap-4">
        {isLoading ? (
          <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>Loading history...</div>
        ) : filteredAlerts.length === 0 ? (
          <GlassCard className="text-center py-16">
            <History size={48} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
            <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>No alerts found matching search criteria.</p>
          </GlassCard>
        ) : (
          filteredAlerts.map(alert => (
            <GlassCard key={alert.id} padding="p-5 sm:p-6" className="flex flex-col sm:flex-row gap-4 sm:gap-6 hover:shadow-md transition-shadow">
              {/* Date column */}
              <div
                className="flex-shrink-0 w-full sm:w-32 flex flex-col items-start sm:items-center justify-center pb-4 sm:pb-0 sm:pr-6"
                style={{ borderBottom: '1px solid var(--divider)', ['@media(min-width:640px)']: { borderBottom: 'none', borderRight: '1px solid var(--divider)' } }}
              >
                <GlassBadge level={alert.level} className="mb-2" />
                <span className="text-xs font-bold text-center" style={{ color: 'var(--text-secondary)' }}>
                  {new Date(alert.createdAt).toLocaleDateString()}
                </span>
                <span className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                  {new Date(alert.createdAt).toLocaleTimeString()}
                </span>
              </div>

              {/* Content column */}
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
                  {alert.title}
                </h3>
                <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>{alert.description}</p>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Zone badge */}
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded"
                    style={{ background: 'var(--badge-bg)', color: 'var(--text-secondary)', border: '1px solid var(--divider)' }}
                  >
                    Zone: {alert.zone?.name || alert.zoneId?.substring(0, 8)}
                  </span>

                  {/* Evacuation */}
                  {alert.evacuationOrder && (
                    <span className="text-xs font-bold px-2.5 py-1 rounded badge-critical">
                      Evacuation Ordered
                    </span>
                  )}

                  {/* Active / Resolved */}
                  {alert.isActive ? (
                    <span className="text-xs font-bold px-2.5 py-1 rounded" style={{ background: 'rgba(59,130,246,0.15)', color: 'var(--color-primary)', border: '1px solid rgba(59,130,246,0.3)' }}>
                      Currently Active
                    </span>
                  ) : (
                    <span className="text-xs font-bold px-2.5 py-1 rounded" style={{ background: 'var(--badge-bg)', color: 'var(--text-muted)', border: '1px solid var(--divider)' }}>
                      Resolved
                    </span>
                  )}
                </div>
              </div>
            </GlassCard>
          ))
        )}
      </div>
    </div>
  );
}
