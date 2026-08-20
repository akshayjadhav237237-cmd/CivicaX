import { TrendingUp, TrendingDown } from 'lucide-react';
import { useThemeStore } from '../../stores/themeStore';

/**
 * GlassStat — Single metric card. Uses CSS variables and theme store for crisp contrast in both modes.
 */
export function GlassStat({
  label,
  value,
  icon: Icon,
  trend,
  trendLabel,
  color = 'blue',
  className = '',
  style = {},
  ...props
}) {
  const { isDark } = useThemeStore();

  const colorMap = {
    blue: {
      iconBg: isDark ? 'rgba(59, 130, 246, 0.20)' : 'rgba(59, 130, 246, 0.12)',
      iconColor: isDark ? '#60A5FA' : '#2563EB',
    },
    red: {
      iconBg: isDark ? 'rgba(239, 68, 68, 0.20)' : 'rgba(239, 68, 68, 0.12)',
      iconColor: isDark ? '#F87171' : '#DC2626',
    },
    orange: {
      iconBg: isDark ? 'rgba(249, 115, 22, 0.20)' : 'rgba(249, 115, 22, 0.12)',
      iconColor: isDark ? '#FB923C' : '#EA580C',
    },
    green: {
      iconBg: isDark ? 'rgba(34, 197, 94, 0.20)' : 'rgba(34, 197, 94, 0.12)',
      iconColor: isDark ? '#4ADE80' : '#16A34A',
    },
    purple: {
      iconBg: isDark ? 'rgba(168, 85, 247, 0.20)' : 'rgba(168, 85, 247, 0.12)',
      iconColor: isDark ? '#C084FC' : '#9333EA',
    },
  };

  const { iconBg, iconColor } = colorMap[color] || colorMap.blue;

  const isPositive = trend === 'up';
  const trendColor = isPositive
    ? (isDark ? '#4ADE80' : '#16A34A')
    : (isDark ? '#F87171' : '#DC2626');

  return (
    <div
      className={`glass-card p-5 transition-all duration-200 ${className}`}
      style={{
        background: 'var(--bg-card)',
        backdropFilter: 'blur(20px) saturate(160%)',
        WebkitBackdropFilter: 'blur(20px) saturate(160%)',
        border: '1px solid var(--bg-card-border)',
        borderRadius: '20px',
        boxShadow: 'var(--shadow)',
        ...style,
      }}
      {...props}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p
            className="text-xs font-semibold uppercase tracking-wider mb-1 truncate"
            style={{ color: 'var(--text-secondary)' }}
          >
            {label}
          </p>
          <p
            className="text-3xl font-bold stat-value truncate"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}
          >
            {value}
          </p>
          {trend && trendLabel && (
            <div className="flex items-center gap-1.5 mt-2">
              {isPositive ? (
                <TrendingUp size={14} style={{ color: trendColor }} />
              ) : (
                <TrendingDown size={14} style={{ color: trendColor }} />
              )}
              <span
                className="text-xs font-semibold"
                style={{ color: trendColor }}
              >
                {trendLabel}
              </span>
            </div>
          )}
        </div>
        {Icon && (
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm"
            style={{
              background: iconBg,
              border: `1px solid ${iconColor}33`,
            }}
          >
            <Icon size={22} style={{ color: iconColor }} />
          </div>
        )}
      </div>
    </div>
  );
}
