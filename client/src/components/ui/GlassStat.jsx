import { TrendingUp, TrendingDown } from 'lucide-react';

/**
 * GlassStat — Single metric card. Uses CSS variables for dark mode.
 */
export function GlassStat({ label, value, icon: Icon, trend, trendLabel, color = 'blue', className = '' }) {
  const colorMap = {
    blue:   { iconBg: 'rgba(59,130,246,0.15)',  iconColor: '#60A5FA' },
    red:    { iconBg: 'rgba(239,68,68,0.15)',   iconColor: '#F87171' },
    orange: { iconBg: 'rgba(249,115,22,0.15)',  iconColor: '#FB923C' },
    green:  { iconBg: 'rgba(34,197,94,0.15)',   iconColor: '#4ADE80' },
  };
  const { iconBg, iconColor } = colorMap[color] || colorMap.blue;

  return (
    <div
      className={`p-5 ${className}`}
      style={{
        background: 'var(--bg-card)',
        backdropFilter: 'blur(20px) saturate(160%)',
        WebkitBackdropFilter: 'blur(20px) saturate(160%)',
        border: '1px solid var(--bg-card-border)',
        borderRadius: '20px',
        boxShadow: 'var(--shadow)',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
          <p className="text-3xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>{value}</p>
          {trend && trendLabel && (
            <div className="flex items-center gap-1 mt-1.5">
              {trend === 'up' ? <TrendingUp size={12} color="#F87171" /> : <TrendingDown size={12} color="#4ADE80" />}
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{trendLabel}</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: iconBg }}>
            <Icon size={20} color={iconColor} />
          </div>
        )}
      </div>
    </div>
  );
}
