/**
 * GlassBadge — Alert level badge using CSS variable design system colours.
 * Automatically adapts to dark/light mode via CSS variable tokens.
 * @param {'watch'|'warning'|'critical'|'safe'|'info'} level
 * @param {string} [label] — custom text, otherwise uses level name
 * @param {string} [className]
 */
export function GlassBadge({ level, label, className = '' }) {
  const levelMap = {
    yellow: 'watch', orange: 'warning', red: 'critical',
    green: 'safe', watch: 'watch', warning: 'warning',
    critical: 'critical', safe: 'safe', info: 'info',
  };
  const normalized = levelMap[level] || 'info';

  const labelMap = {
    watch: 'Yellow Watch', warning: 'Orange Warning',
    critical: 'Red Critical', safe: 'All Clear', info: 'Info',
  };

  // Use CSS variables so dark mode tokens from :root/.dark apply automatically
  const styleMap = {
    watch:    { background: 'var(--alert-watch-bg)',    border: '1px solid var(--alert-watch-border)',    color: 'var(--alert-watch-text)' },
    warning:  { background: 'var(--alert-warning-bg)',  border: '1px solid var(--alert-warning-border)',  color: 'var(--alert-warning-text)' },
    critical: { background: 'var(--alert-critical-bg)', border: '1px solid var(--alert-critical-border)', color: 'var(--alert-critical-text)' },
    safe:     { background: 'var(--alert-safe-bg)',     border: '1px solid var(--alert-safe-border)',     color: 'var(--alert-safe-text)' },
    info:     { background: 'rgba(59,130,246,0.15)',    border: '1px solid rgba(59,130,246,0.35)',        color: 'var(--color-primary)' },
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${className}`}
      style={styleMap[normalized]}
    >
      {label || labelMap[normalized]}
    </span>
  );
}
