/**
 * GlassTimeline — Vertical list of timeline events.
 * @param {Array} events — Array of { id, timestamp, label, description, color? }
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
        const dotColor = event.color || colorMap[statusColorMap[event.status] || 'gray'] || '#94A3B8';
        const isLast = idx === events.length - 1;
        return (
          <div key={event.id || idx} className="flex gap-4 pb-4">
            {/* Dot + line */}
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5" style={{ background: dotColor, boxShadow: `0 0 0 3px ${dotColor}22` }} />
              {!isLast && <div className="w-px flex-1 mt-1" style={{ background: 'rgba(203,213,225,0.6)' }} />}
            </div>
            {/* Content */}
            <div className={isLast ? '' : 'pb-1'}>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{event.label}</p>
              {event.description && <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{event.description}</p>}
              {event.timestamp && (
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-light)' }}>
                  {new Date(event.timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              )}
            </div>
          </div>
        );
      })}
      {events.length === 0 && (
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No events recorded yet.</p>
      )}
    </div>
  );
}
