/**
 * GlassBadge — Alert level badge using CSS variable design system colours.
 * Automatically adapts to dark/light mode via CSS variable tokens.
 * Guarantees high WCAG AA/AAA contrast on both light and dark card backgrounds.
 * @param {'watch'|'warning'|'critical'|'safe'|'info'|string} level
 * @param {string} [label] — custom text, otherwise uses level name
 * @param {string} [className]
 * @param {boolean} [dot] — whether to show a status dot indicator
 * @param {object} [style]
 */
export function GlassBadge({ level, label, className = '', dot = false, style = {}, ...props }) {
  const levelMap = {
    yellow: 'watch',
    orange: 'warning',
    red: 'critical',
    green: 'safe',
    blue: 'info',
    watch: 'watch',
    warning: 'warning',
    critical: 'critical',
    safe: 'safe',
    info: 'info',
    high: 'critical',
    medium: 'warning',
    low: 'watch',
  };
  const normalized = levelMap[String(level || '').toLowerCase()] || 'info';

  const labelMap = {
    watch: 'Yellow Watch',
    warning: 'Orange Warning',
    critical: 'Red Critical',
    safe: 'All Clear',
    info: 'Info',
  };

  // Use CSS variables so dark/light mode tokens from :root/.dark apply automatically
  const styleMap = {
    watch:    { background: 'var(--alert-watch-bg)',    border: '1px solid var(--alert-watch-border)',    color: 'var(--alert-watch-text)' },
    warning:  { background: 'var(--alert-warning-bg)',  border: '1px solid var(--alert-warning-border)',  color: 'var(--alert-warning-text)' },
    critical: { background: 'var(--alert-critical-bg)', border: '1px solid var(--alert-critical-border)', color: 'var(--alert-critical-text)' },
    safe:     { background: 'var(--alert-safe-bg)',     border: '1px solid var(--alert-safe-border)',     color: 'var(--alert-safe-text)' },
    info:     { background: 'var(--alert-info-bg)',     border: '1px solid var(--alert-info-border)',     color: 'var(--alert-info-text)' },
  };

  const dotColorMap = {
    watch: '#EAB308',
    warning: '#F97316',
    critical: '#EF4444',
    safe: '#22C55E',
    info: '#3B82F6',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide badge-${normalized} ${className}`}
      style={{
        fontFamily: 'var(--font-heading)',
        ...styleMap[normalized],
        ...style,
      }}
      {...props}
    >
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ background: dotColorMap[normalized] || 'currentColor' }}
        />
      )}
      {label || labelMap[normalized]}
    </span>
  );
}
