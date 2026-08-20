/**
 * GlassTimeline — Vertical list of timeline events.
 * @param {Array} events — Array of { id, timestamp, label, description, color?, status? }
 */
export function GlassTimeline({ events = [] }) {
  const colorMap = {
    blue: '#3B82F6',
    green: '#22C55E',
    orange: '#F97316',
    red: '#EF4444',
    gray: '#94A3B8',
    yellow: '#EAB308',
  };

  const statusColorMap = {
    submitted: 'blue',
    assigned: 'yellow',
    in_progress: 'orange',
    resolved: 'green',
    pending: 'blue',
    dispatched: 'orange',
    created: 'blue',
    activated: 'green',
    dispatched_team: 'orange',
  };

  return (
    <div className="relative">
      {events.map((event, idx) => {
        const dotColor = event.color || colorMap[statusColorMap[event.status] || 'gray'] || '#3B82F6';
        const isLast = idx === events.length - 1;
        return (
          <div key={event.id || idx} className="flex gap-3.5 pb-4">
            {/* Dot + line */}
            <div className="flex flex-col items-center">
              <div
                className="w-3.5 h-3.5 rounded-full flex-shrink-0 mt-0.5 ring-2 ring-white dark:ring-slate-900 shadow-sm"
                style={{ background: dotColor }}
              />
              {!isLast && (
                <div
                  className="w-0.5 flex-1 mt-1 rounded-full"
                  style={{ background: 'var(--divider)' }}
                />
              )}
            </div>
            {/* Content */}
            <div className={`flex-1 min-w-0 ${isLast ? '' : 'pb-1'}`}>
              <p className="text-sm font-semibold leading-snug" style={{ color: 'var(--text-primary)' }}>
                {event.label}
              </p>
              {event.description && (
                <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {event.description}
                </p>
              )}
              {event.timestamp && (
                <p className="text-[11px] font-medium mt-1.5" style={{ color: 'var(--text-muted)' }}>
                  {new Date(event.timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              )}
            </div>
          </div>
        );
      })}
      {events.length === 0 && (
        <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>
          No events recorded yet.
        </p>
      )}
    </div>
  );
}
