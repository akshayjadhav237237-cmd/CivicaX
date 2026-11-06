import { useTranslation } from '../../../i18n';

/**
 * AlertBadge — Never color alone: color + shape symbol + text prefix
 * Clean minimalist typography with full bilingual (EN / हिं) support.
 */
export function AlertBadge({ tier = 'GREEN', className = '' }) {
  const norm = (tier || 'GREEN').toUpperCase();
  const { t } = useTranslation();

  const labels = {
    GREEN: t('alerts.levels.normal', null, 'NORMAL // MONITOR'),
    YELLOW: t('alerts.levels.watch', null, 'WATCH // BE AWARE'),
    ORANGE: t('alerts.levels.warning', null, 'WARNING // PREPARE'),
    RED: t('alerts.levels.critical', null, 'CRITICAL // EVACUATE'),
  };

  const configs = {
    GREEN: {
      shape: '●',
      label: labels.GREEN,
      style: {
        color: 'var(--alert-green-text)',
        backgroundColor: 'var(--alert-green-fill)',
        borderColor: 'var(--alert-green-border)',
      },
    },
    YELLOW: {
      shape: '◆',
      label: labels.YELLOW,
      style: {
        color: 'var(--alert-yellow-text)',
        backgroundColor: 'var(--alert-yellow-fill)',
        borderColor: 'var(--alert-yellow-border)',
      },
    },
    ORANGE: {
      shape: '▲',
      label: labels.ORANGE,
      style: {
        color: 'var(--alert-orange-text)',
        backgroundColor: 'var(--alert-orange-fill)',
        borderColor: 'var(--alert-orange-border)',
      },
    },
    RED: {
      shape: '⬢',
      label: labels.RED,
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
      <span className="whitespace-nowrap">{config.label}</span>
    </div>
  );
}
