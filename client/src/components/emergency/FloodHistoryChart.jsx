import { AreaChart, Area, XAxis, YAxis, ReferenceLine, ResponsiveContainer, Tooltip } from 'recharts';

const ALERT_RATIO = { green: 0.2, yellow: 0.6, orange: 1.1, red: 1.6 };

export function FloodHistoryChart({ history }) {
  if (!history || history.length === 0) {
    return (
      <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: 12 }}>
        No trend data yet
      </div>
    );
  }

  const chartData = [...history].reverse().map((h, i) => ({
    label: i === history.length - 1 ? 'Now' : `${history.length - 1 - i}h ago`,
    ratio: ALERT_RATIO[h.alertLevel] ?? 0.2,
    alertLevel: h.alertLevel,
  }));

  return (
    <div style={{ width: '100%', height: 80 }}>
      <ResponsiveContainer width="100%" height={80}>
        <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -30, bottom: 0 }}>
          <defs>
            <linearGradient id="floodGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 2]} hide />
          <ReferenceLine
            y={1.0}
            stroke="#EF4444"
            strokeDasharray="3 3"
            label={{ value: 'Overflow', position: 'right', fontSize: 9, fill: '#EF4444' }}
          />
          <Tooltip
            formatter={(v) => [`${(v * 100).toFixed(0)}% capacity`, 'River']}
            contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #E2E8F0' }}
          />
          <Area
            type="monotone"
            dataKey="ratio"
            stroke="#3B82F6"
            fill="url(#floodGradient)"
            strokeWidth={2}
            dot={{ fill: '#3B82F6', r: 3 }}
          />
        </AreaChart>
      </ResponsiveContainer>
      <p style={{ fontSize: 10, color: '#94A3B8', textAlign: 'center', marginTop: 2 }}>
        Last 6 predictions — overflow threshold at 1.0×
      </p>
    </div>
  );
}
