/**
 * FloodRiskGauge.jsx — Circular SVG Flood Risk Gauge
 *
 * Shows a 0–100 composite flood risk score as an animated circular gauge.
 * Color transitions: green (0-24) → yellow (25-49) → orange (50-74) → red (75-100).
 * Fully CSS-animatable with no dependencies.
 */

export function FloodRiskGauge({ score = 0, level = 'green', size = 140 }) {
  const radius = (size / 2) - 12;
  const circumference = 2 * Math.PI * radius;
  const filled = (score / 100) * circumference;
  const strokeDashoffset = circumference - filled;

  const levelColors = {
    green:  { stroke: '#22c55e', glow: 'rgba(34,197,94,0.35)',  label: 'LOW RISK',      bg: '#f0fdf4' },
    yellow: { stroke: '#eab308', glow: 'rgba(234,179,8,0.35)',  label: 'WATCH',         bg: '#fefce8' },
    orange: { stroke: '#f97316', glow: 'rgba(249,115,22,0.35)', label: 'HIGH RISK',     bg: '#fff7ed' },
    red:    { stroke: '#ef4444', glow: 'rgba(239,68,68,0.45)',  label: 'CRITICAL',      bg: '#fef2f2' },
  };

  const colors = levelColors[level] || levelColors.green;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ filter: `drop-shadow(0 0 10px ${colors.glow})`, overflow: 'visible' }}
        aria-label={`Flood risk score: ${score} out of 100 — ${colors.label}`}
        role="img"
      >
        {/* Background track */}
        <circle
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={10}
        />

        {/* Score arc — rotated to start from top (−90°) */}
        <circle
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke={colors.stroke}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.34, 1.56, 0.64, 1), stroke 0.8s ease' }}
        />

        {/* Center score text */}
        <text
          x={cx} y={cy - 8}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={size * 0.22}
          fontWeight="800"
          fontFamily="'Outfit', 'Inter', sans-serif"
          fill={colors.stroke}
          style={{ transition: 'fill 0.8s ease' }}
        >
          {Math.round(score)}
        </text>
        <text
          x={cx} y={cy + 14}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={size * 0.085}
          fontWeight="600"
          fontFamily="'Outfit', 'Inter', sans-serif"
          fill="#94a3b8"
          letterSpacing="1"
        >
          /100
        </text>
      </svg>

      {/* Level badge below gauge */}
      <div style={{
        background: colors.stroke,
        color: '#fff',
        fontFamily: "'Outfit', 'Inter', sans-serif",
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: '0.12em',
        padding: '3px 12px',
        borderRadius: 999,
        textTransform: 'uppercase',
        transition: 'background 0.8s ease',
        boxShadow: `0 2px 8px ${colors.glow}`,
      }}>
        {colors.label}
      </div>
    </div>
  );
}
