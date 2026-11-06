/**
 * AlertBadge — Never color alone: color + shape symbol + text prefix
 * Clean minimalist typography
 */
export function AlertBadge({ tier = 'GREEN', className = '' }) {
  const norm = (tier || 'GREEN').toUpperCase();

  const configs = {
    GREEN: {
      shape: '●',
      label: 'NORMAL // MONITOR',
      style: {
        color: 'var(--alert-green-text)',
        backgroundColor: 'var(--alert-green-fill)',
        borderColor: 'var(--alert-green-border)',
      },
    },
    YELLOW: {
      shape: '◆',
      label: 'WATCH // BE AWARE',
      style: {
        color: 'var(--alert-yellow-text)',
        backgroundColor: 'var(--alert-yellow-fill)',
        borderColor: 'var(--alert-yellow-border)',
      },
    },
    ORANGE: {
      shape: '▲',
      label: 'WARNING // PREPARE',
      style: {
        color: 'var(--alert-orange-text)',
        backgroundColor: 'var(--alert-orange-fill)',
        borderColor: 'var(--alert-orange-border)',
      },
    },
    RED: {
      shape: '⬢',
      label: 'CRITICAL // EVACUATE',
      style: {
        color: 'var(--alert-red-text)',
        backgroundColor: 'var(--alert-red-fill)',
        borderColor: 'var(--alert-red-border)',
      },
    },
  };

  const config = configs[norm] || configs.GREEN;

  return (
    <div
      style={config.style}
      className={`h-[24px] px-2.5 rounded-[4px] border inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wide select-none shrink-0 ${className}`}
    >
      <span className="text-[9px] leading-none">{config.shape}</span>
      <span>{config.label}</span>
    </div>
  );
}
