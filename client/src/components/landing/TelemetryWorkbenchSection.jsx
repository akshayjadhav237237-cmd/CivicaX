import { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Cell,
} from 'recharts';
import { useThemeStore } from '../../stores/themeStore';
import { useTranslation } from '../../i18n';
import { SectionHeader } from './ui/SectionHeader';
import { Card } from './ui/Card';
import { ProvenanceFooter } from './ui/ProvenanceFooter';
import { CornerCrosshairs } from './ui/CornerCrosshairs';
import { Skeleton } from './ui/Skeleton';
import { Activity, Database, Table as TableIcon } from 'lucide-react';

/**
 * Custom Tooltip with surface tokens
 */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="p-2.5 rounded-[6px] border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-md text-xs">
      <div className="text-[var(--text-muted)] mb-1 font-semibold">{label}</div>
      {payload.map((entry, index) => (
        <div key={`tooltip-${index}`} className="flex items-center justify-between gap-3">
          <span style={{ color: entry.color || 'var(--text-secondary)' }}>
            {entry.name}:
          </span>
          <span className="font-bold tabular-nums">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export function TelemetryWorkbenchSection({ prediction }) {
  const { isDark } = useThemeStore();
  const { t } = useTranslation();
  const { history = [], loading, error, data, lastUpdated } = prediction || {};

  const [leftTab, setLeftTab] = useState('chart'); // 'chart' | 'table' | 'sources'
  const [rightTab, setRightTab] = useState('chart');

  const gridStroke = isDark ? '#1E293B' : '#E2E8F0';
  const tickFill = isDark ? '#94A3B8' : '#64748B';
  const formattedTime = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'LIVE';

  const hasSufficientHistory = Array.isArray(history) && history.length >= 2;

  const TabControls = ({ activeTab, onChange }) => (
    <div className="inline-flex items-center p-1 rounded-[6px] bg-[var(--bg-subtle)] border border-[var(--border-grid)] text-xs font-medium">
      <button
        type="button"
        onClick={() => onChange('chart')}
        className={`px-2.5 py-1 rounded-[4px] transition-colors ${
          activeTab === 'chart'
            ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm font-semibold'
            : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
        }`}
      >
        Chart
      </button>
      <button
        type="button"
        onClick={() => onChange('table')}
        className={`px-2.5 py-1 rounded-[4px] transition-colors ${
          activeTab === 'table'
            ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm font-semibold'
            : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
        }`}
      >
        Table
      </button>
      <button
        type="button"
        onClick={() => onChange('sources')}
        className={`px-2.5 py-1 rounded-[4px] transition-colors ${
          activeTab === 'sources'
            ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm font-semibold'
            : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
        }`}
      >
        Sources
      </button>
    </div>
  );

  return (
    <section id="telemetry" className="landing-section">
      <div className="landing-container px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <SectionHeader
          eyebrow="03 // LIVE BASIN TELEMETRY"
          title="Rainfall, soil, and river response."
          lead="Direct observation feeds from orbiting constellations and channel physics models. Values reflect real-time basin telemetry."
        />

        {/* 2-Column Grid (6 cols each) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
          
          {/* Left Card: Rainfall & River Overflow */}
          <Card className="flex flex-col justify-between min-h-[500px]">
            <CornerCrosshairs />
            <div>
              {/* Card Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-[var(--border-grid)]">
                <div>
                  <h3 className="font-heading font-semibold text-base sm:text-lg text-[var(--text-primary)]">
                    Precipitation & Overflow Response
                  </h3>
                  <p className="micro text-[var(--text-muted)] mt-0.5">
                    GPM IMERG (mm/h) & Manning Channel Capacity Ratio
                  </p>
                </div>
                <TabControls activeTab={leftTab} onChange={setLeftTab} />
              </div>

              {/* Card Content Area */}
              {loading ? (
                <div className="space-y-4 py-8">
                  <Skeleton height="110px" />
                  <Skeleton height="210px" />
                </div>
              ) : leftTab === 'chart' ? (
                !hasSufficientHistory ? (
                  <div className="h-[340px] flex flex-col items-center justify-center p-6 text-center rounded-[6px] border border-dashed border-[var(--border-strong)] bg-[var(--bg-subtle)]">
                    <Activity size={28} className="text-[var(--text-muted)] mb-3 animate-pulse" />
                    <div className="text-sm font-semibold text-[var(--text-primary)] mb-1">
                      Collecting readings…
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] max-w-sm">
                      Telemetry workbench requires at least two sequential satellite observations for hydrological delta.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Top 110px BarChart: Rainfall */}
                    <div>
                      <div className="flex items-center justify-between micro text-[var(--text-muted)] mb-1">
                        <span>PRECIPITATION RATE (mm/h)</span>
                        <span className="font-medium tabular-nums">
                          LATEST: {data?.rainfall?.current ?? history[history.length - 1]?.rainfall ?? 0} mm/h
                        </span>
                      </div>
                      <div className="h-[110px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={history}
                            syncId="basinHydrology"
                            margin={{ top: 5, right: 10, left: -25, bottom: 0 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                            <YAxis
                              tick={{ fill: tickFill, fontSize: 10, fontFamily: 'Inter, sans-serif' }}
                              stroke={gridStroke}
                              domain={[0, 'auto']}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="rainfall" name="Rainfall (mm/h)" radius={[2, 2, 0, 0]}>
                              {history.map((entry, index) => {
                                const val = Number(entry.rainfall || 0);
                                let fill = '#64748B'; // <10 slate
                                if (val >= 10 && val < 30) fill = '#0284C7';
                                else if (val >= 30 && val < 50) fill = '#F59E0B';
                                else if (val >= 50) fill = '#EF4444';
                                return <Cell key={`rain-cell-${index}`} fill={fill} fillOpacity={val < 10 ? 0.4 : 0.9} />;
                              })}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Bottom 210px AreaChart: Overflow Ratio */}
                    <div>
                      <div className="flex items-center justify-between micro text-[var(--text-muted)] mb-1">
                        <span>{t("metrics.river_capacity_ratio", null, "RIVER CAPACITY OVERFLOW RATIO")}</span>
                        <span className="font-medium tabular-nums">
                          RATIO: {data?.riverStatus?.overflowRatio ?? history[history.length - 1]?.overflowRatio ?? 0}
                        </span>
                      </div>
                      <div className="h-[210px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={history}
                            syncId="basinHydrology"
                            margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                            <XAxis
                              dataKey="time"
                              tick={{ fill: tickFill, fontSize: 11, fontFamily: 'monospace' }}
                              stroke={gridStroke}
                            />
                            <YAxis
                              tick={{ fill: tickFill, fontSize: 10, fontFamily: 'monospace' }}
                              stroke={gridStroke}
                              domain={[0, (dataMax) => Math.max(1.2, Number((dataMax * 1.15).toFixed(1)))]}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <ReferenceLine
                              y={1.0}
                              stroke="#EF4444"
                              strokeDasharray="4 4"
                              label={{
                                value: 'BANKFULL (100% CAPACITY)',
                                position: 'top',
                                fill: '#EF4444',
                                fontSize: 10,
                                fontFamily: 'monospace',
                              }}
                            />
                            <Area
                              type="monotone"
                              dataKey="overflowRatio"
                              name="River Capacity Ratio"
                              stroke="#0284C7"
                              strokeWidth={2}
                              fill="#0284C7"
                              fillOpacity={0.18}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )
              ) : leftTab === 'table' ? (
                <div className="overflow-x-auto min-h-[320px]">
                  <table className="w-full text-left text-xs tabular-nums">
                    <caption className="sr-only">Rainfall and River Overflow History</caption>
                    <thead>
                      <tr className="border-b border-[var(--border-strong)] text-[var(--text-muted)]">
                        <th scope="col" className="py-2.5 px-3">Time</th>
                        <th scope="col" className="py-2.5 px-3">Rainfall (mm/h)</th>
                        <th scope="col" className="py-2.5 px-3">Capacity Ratio</th>
                        <th scope="col" className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-grid)]">
                      {history.length > 0 ? (
                        history.map((row, idx) => (
                          <tr key={`left-table-row-${idx}`} className="hover:bg-[var(--bg-subtle)]">
                            <td className="py-2.5 px-3 text-[var(--text-secondary)]">{row.time}</td>
                            <td className="py-2.5 px-3 font-semibold text-[var(--text-primary)]">{row.rainfall}</td>
                            <td className="py-2.5 px-3 text-[var(--text-secondary)]">{row.overflowRatio}</td>
                            <td className="py-2.5 px-3">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                Number(row.overflowRatio) >= 1.0
                                  ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              }`}>
                                {Number(row.overflowRatio) >= 1.0 ? 'OVERFLOW' : 'CONTAINED'}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-[var(--text-muted)]">
                            Collecting readings…
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-4 rounded-[6px] bg-[var(--bg-subtle)] text-xs space-y-3 leading-relaxed text-[var(--text-secondary)] min-h-[320px]">
                  <div className="font-semibold text-[var(--text-primary)] text-xs uppercase tracking-wider">
                    Data Sources & Scientific Formulations
                  </div>
                  <div>
                    <strong className="text-[var(--text-primary)] block">NASA GPM IMERG:</strong>
                    Global Precipitation Measurement Integrated Multi-satellitE Retrievals for GPM. Spatial resolution 0.1° × 0.1°, half-hourly precipitation estimation.
                  </div>
                  <div>
                    <strong className="text-[var(--text-primary)] block">Manning&apos;s Open-Channel Equation:</strong>
                    Used to compute volumetric discharge and cross-sectional capacity overflow:
                    <div className="my-1.5 p-2 bg-[var(--bg-surface)] rounded text-[11px] border border-[var(--border-grid)]">
                      v = (1 / n) * R^(2/3) * S^(1/2)
                    </div>
                  </div>
                  <div>
                    <strong className="text-[var(--text-primary)] block">SRTM Digital Elevation Model:</strong>
                    NASA Shuttle Radar Topography Mission 30m resolution for channel slope (S) and watershed catchment bounds.
                  </div>
                </div>
              )}
            </div>

            {/* Provenance Footer */}
            <ProvenanceFooter
              sources="NASA GPM IMERG, Manning's Equation, SRTM 30m"
              updated={formattedTime}
              className="mt-6"
            />
          </Card>

          {/* Right Card: Soil Moisture & Stream Velocity */}
          <Card className="flex flex-col justify-between min-h-[500px]">
            <CornerCrosshairs />
            <div>
              {/* Card Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-[var(--border-grid)]">
                <div>
                  <h3 className="font-heading font-semibold text-base sm:text-lg text-[var(--text-primary)]">
                    Soil Saturation & Stream Dynamics
                  </h3>
                  <p className="micro text-[var(--text-muted)] mt-0.5">
                    NASA SMAP Volumetric Soil Water & Channel Velocity
                  </p>
                </div>
                <TabControls activeTab={rightTab} onChange={setRightTab} />
              </div>

              {/* Card Content Area */}
              {loading ? (
                <div className="space-y-4 py-8">
                  <Skeleton height="70px" />
                  <Skeleton height="250px" />
                </div>
              ) : rightTab === 'chart' ? (
                !hasSufficientHistory ? (
                  <div className="h-[340px] flex flex-col items-center justify-center p-6 text-center rounded-[6px] border border-dashed border-[var(--border-strong)] bg-[var(--bg-subtle)]">
                    <Database size={28} className="text-[var(--text-muted)] mb-3 animate-pulse" />
                    <div className="text-sm font-semibold text-[var(--text-primary)] mb-1">
                      Collecting readings…
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] max-w-sm">
                      Telemetry workbench requires at least two sequential satellite observations for hydrological delta.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Velocity Stat Card */}
                    <div className="p-3.5 rounded-[6px] border border-[var(--border-grid)] bg-[var(--bg-subtle)] flex items-center justify-between">
                      <div>
                        <span className="micro text-[var(--text-muted)] block uppercase">
                          Current Channel Stream Velocity
                        </span>
                        <div className="font-bold text-xl sm:text-2xl text-[var(--text-primary)] mt-0.5 tabular-nums">
                          {data?.riverStatus?.velocityMs ?? '—'} <span className="text-sm font-normal text-[var(--text-muted)]">m/s</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="micro text-[var(--text-muted)] block uppercase">
                          Estimated Wave Arrival
                        </span>
                        <span className="font-semibold text-sm text-[var(--accent-primary)]">
                          {data?.riverStatus?.etaMinutes ? `+${data.riverStatus.etaMinutes} min ETA` : 'Baseline'}
                        </span>
                      </div>
                    </div>

                    {/* LineChart: Soil Saturation */}
                    <div>
                      <div className="flex items-center justify-between micro text-[var(--text-muted)] mb-1">
                        <span>{t("metrics.soil_saturation", null, "SOIL SATURATION")} (%)</span>
                        <span className="font-medium tabular-nums">
                          LATEST: {data?.soilMoisture?.saturationPercent ?? history[history.length - 1]?.soilSaturation ?? 0}%
                        </span>
                      </div>
                      <div className="h-[220px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={history}
                            margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                            <XAxis
                              dataKey="time"
                              tick={{ fill: tickFill, fontSize: 11, fontFamily: 'Inter, sans-serif' }}
                              stroke={gridStroke}
                            />
                            <YAxis
                              tick={{ fill: tickFill, fontSize: 10, fontFamily: 'Inter, sans-serif' }}
                              stroke={gridStroke}
                              domain={[0, 100]}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <ReferenceLine
                              y={80}
                              stroke="#F59E0B"
                              strokeDasharray="3 3"
                              label={{
                                value: 'SATURATION THRESHOLD (80%)',
                                position: 'insideTopLeft',
                                fill: '#F59E0B',
                                fontSize: 10,
                                fontFamily: 'Inter, sans-serif',
                              }}
                            />
                            <Line
                              type="monotone"
                              dataKey="soilSaturation"
                              name="Soil Saturation (%)"
                              stroke="#0D9488"
                              strokeWidth={2.5}
                              dot={{ r: 3.5, fill: '#0D9488' }}
                              activeDot={{ r: 5 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )
              ) : rightTab === 'table' ? (
                <div className="overflow-x-auto min-h-[320px]">
                  <table className="w-full text-left text-xs tabular-nums">
                    <caption className="sr-only">Soil Saturation and Velocity Observations</caption>
                    <thead>
                      <tr className="border-b border-[var(--border-strong)] text-[var(--text-muted)]">
                        <th scope="col" className="py-2.5 px-3">Time</th>
                        <th scope="col" className="py-2.5 px-3">Saturation (%)</th>
                        <th scope="col" className="py-2.5 px-3">Runoff Potential</th>
                        <th scope="col" className="py-2.5 px-3">Tier</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-grid)]">
                      {history.length > 0 ? (
                        history.map((row, idx) => {
                          const sat = Number(row.soilSaturation || 0);
                          return (
                            <tr key={`right-table-row-${idx}`} className="hover:bg-[var(--bg-subtle)]">
                              <td className="py-2.5 px-3 text-[var(--text-secondary)]">{row.time}</td>
                              <td className="py-2.5 px-3 font-semibold text-[var(--text-primary)]">{sat}%</td>
                              <td className="py-2.5 px-3 text-[var(--text-secondary)]">
                                {sat >= 80 ? 'Near Zero Infiltration' : sat >= 50 ? 'Moderate Absorption' : 'High Infiltration'}
                              </td>
                              <td className="py-2.5 px-3 font-bold text-[var(--accent-primary)]">
                                {row.alertTier || 'NORMAL'}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-[var(--text-muted)]">
                            Collecting readings…
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-4 rounded-[6px] bg-[var(--bg-subtle)] text-xs space-y-3 leading-relaxed text-[var(--text-secondary)] min-h-[320px]">
                  <div className="font-semibold text-[var(--text-primary)] text-xs uppercase tracking-wider">
                    Soil Physics & Hydrological Modeling
                  </div>
                  <div>
                    <strong className="text-[var(--text-primary)] block">NASA SMAP:</strong>
                    Soil Moisture Active Passive satellite radar and radiometer instrumentation. Measures top 5 cm soil volumetric water content.
                  </div>
                  <div>
                    <strong className="text-[var(--text-primary)] block">SCS Curve Number (CN) Method:</strong>
                    Calculates surface direct runoff volume ($Q$) based on antecedent soil moisture condition (AMC) and soil saturation threshold:
                    <div className="my-1.5 p-2 bg-[var(--bg-surface)] rounded text-[11px] border border-[var(--border-grid)]">
                      Q = (P - 0.2*S)^2 / (P + 0.8*S)
                    </div>
                  </div>
                  <div>
                    <strong className="text-[var(--text-primary)] block">Open-Meteo Land Surface Telemetry:</strong>
                    Integrates 0–7cm and 7–28cm root-zone soil moisture estimates updated every hour.
                  </div>
                </div>
              )}
            </div>

            {/* Provenance Footer */}
            <ProvenanceFooter
              sources="NASA SMAP, Open-Meteo, USDA SCS-CN"
              updated={formattedTime}
              className="mt-6"
            />
          </Card>
        </div>
      </div>
    </section>
  );
}
