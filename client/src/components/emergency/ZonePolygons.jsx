import { useEffect, useState } from 'react';
import { GeoJSON, Popup, Tooltip, useMap } from 'react-leaflet';

// ---------------------------------------------------------------------------
// Flood-prediction fill & border colors keyed by alertLevel
// ---------------------------------------------------------------------------
const FLOOD_COLORS = {
  green:  { fillColor: '#22C55E', fillOpacity: 0.25, color: '#16A34A', weight: 2.5 },
  yellow: { fillColor: '#FBBF24', fillOpacity: 0.35, color: '#CA8A04', weight: 3 },
  orange: { fillColor: '#F97316', fillOpacity: 0.45, color: '#EA580C', weight: 3.5 },
  red:    { fillColor: '#EF4444', fillOpacity: 0.55, color: '#DC2626', weight: 4, dashArray: '4' },
};

// ---------------------------------------------------------------------------
// Calibrated Kedarnath Valley Street-Level Micro-Zones (GeoJSON format)
// ---------------------------------------------------------------------------
export const KEDARNATH_MICRO_ZONES = [
  {
    type: 'Feature',
    properties: {
      id: 'zone-mandakini-ghat-001',
      name: 'Mandakini Riverfront Ghat Road • Ward 1',
      streetName: 'Mandakini Riverfront Ghat Road • Ward 1',
      level: 'red',
      inundationDepth: '1.85 m',
      flowVelocity: '3.8 m/s',
      fillTime: 'Fills in 12 min',
      flowAndFill: '3.8 m/s • Fills in 12 min',
      hazardReason: 'Direct overtopping of Mandakini retaining wall; 420 m³/s glacial surge channel.',
      evacuationAction: 'Evacuate immediately uphill towards Eastern Ridge Platform (Zone 4 Safe Haven).',
      rainfall: '94.5 mm/hr',
      floodRisk: 92.4,
      riverDischarge: '420 m³/s',
      evacuationOrder: true,
      populationAtRisk: 1450,
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [79.0658, 30.7338],
        [79.0678, 30.7338],
        [79.0678, 30.7356],
        [79.0658, 30.7356],
        [79.0658, 30.7338],
      ]],
    },
  },
  {
    type: 'Feature',
    properties: {
      id: 'zone-temple-bazaar-002',
      name: 'Temple Bazaar Marg • Central Precinct',
      streetName: 'Temple Bazaar Marg • Central Precinct',
      level: 'orange',
      inundationDepth: '0.75 m',
      flowVelocity: '2.4 m/s',
      fillTime: 'Fills in 25 min',
      flowAndFill: '2.4 m/s • Fills in 25 min',
      hazardReason: 'Backwater flooding from Mandakini drainage choke; narrow corridor bottleneck.',
      evacuationAction: 'Move north towards Upper Temple Square and Helipad Ridge staircase.',
      rainfall: '76.0 mm/hr',
      floodRisk: 71.8,
      riverDischarge: '310 m³/s',
      evacuationOrder: false,
      populationAtRisk: 820,
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [79.0648, 30.7346],
        [79.0664, 30.7346],
        [79.0664, 30.7362],
        [79.0648, 30.7362],
        [79.0648, 30.7346],
      ]],
    },
  },
  {
    type: 'Feature',
    properties: {
      id: 'zone-saraswati-bridge-003',
      name: 'Saraswati Sangam Bridge • Sector 2',
      streetName: 'Saraswati Sangam Bridge • Sector 2',
      level: 'yellow',
      inundationDepth: '0.30 m',
      flowVelocity: '1.6 m/s',
      fillTime: 'Fills in 45 min',
      flowAndFill: '1.6 m/s • Fills in 45 min',
      hazardReason: 'Saraswati stream swell; swirling currents under pedestrian abutments.',
      evacuationAction: 'Avoid crossing bridge abutment; divert to Upper Concrete Bypass.',
      rainfall: '48.2 mm/hr',
      floodRisk: 44.5,
      riverDischarge: '185 m³/s',
      evacuationOrder: false,
      populationAtRisk: 340,
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [79.0668, 30.7324],
        [79.0688, 30.7324],
        [79.0688, 30.7342],
        [79.0668, 30.7342],
        [79.0668, 30.7324],
      ]],
    },
  },
  {
    type: 'Feature',
    properties: {
      id: 'zone-upper-helipad-004',
      name: 'Upper Helipad Ridge • Safe Haven Base',
      streetName: 'Upper Helipad Ridge • Safe Haven Base',
      level: 'green',
      inundationDepth: '0.00 m (Safe High Ground)',
      flowVelocity: '0.0 m/s',
      fillTime: 'No Flood Risk',
      flowAndFill: '0.0 m/s • Safe Haven',
      hazardReason: 'Elevated natural bedrock plateau; immune to direct channel overtopping.',
      evacuationAction: 'Designated assembly point for medical triage, hot food, and helicopter airlift.',
      rainfall: '14.0 mm/hr',
      floodRisk: 12.0,
      riverDischarge: '45 m³/s',
      evacuationOrder: false,
      populationAtRisk: 0,
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [79.0630, 30.7364],
        [79.0656, 30.7364],
        [79.0656, 30.7390],
        [79.0630, 30.7390],
        [79.0630, 30.7364],
      ]],
    },
  },
  {
    type: 'Feature',
    properties: {
      id: 'zone-rambara-bridge-005',
      name: 'Rambara Bridge & Gorge Crossing',
      streetName: 'Rambara Bridge & Gorge Crossing',
      level: 'red',
      inundationDepth: '1.20 m',
      flowVelocity: '4.1 m/s',
      fillTime: 'Fills in 18 min',
      flowAndFill: '4.1 m/s • Fills in 18 min',
      hazardReason: 'Severe canyon choke point; rapid debris slurry and bank scouring.',
      evacuationAction: 'Halt trek progression immediately; seek refuge in high-bank reinforced shelters.',
      rainfall: '82.5 mm/hr',
      floodRisk: 88.0,
      riverDischarge: '380 m³/s',
      evacuationOrder: true,
      populationAtRisk: 1120,
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [79.0475, 30.6958],
        [79.0515, 30.6958],
        [79.0515, 30.6992],
        [79.0475, 30.6992],
        [79.0475, 30.6958],
      ]],
    },
  },
  {
    type: 'Feature',
    properties: {
      id: 'zone-lincholi-track-006',
      name: 'Lincholi Track • Mid-Valley Route',
      streetName: 'Lincholi Track • Mid-Valley Route',
      level: 'orange',
      inundationDepth: '0.60 m',
      flowVelocity: '2.2 m/s',
      fillTime: 'Fills in 35 min',
      flowAndFill: '2.2 m/s • Fills in 35 min',
      hazardReason: 'Mountain runoff cascading across paved mule trail; rockfall risk.',
      evacuationAction: 'Use safety rope corridors; move towards Lincholi SDRF base camp.',
      rainfall: '64.0 mm/hr',
      floodRisk: 62.5,
      riverDischarge: '260 m³/s',
      evacuationOrder: false,
      populationAtRisk: 650,
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [79.0540, 30.7100],
        [79.0580, 30.7100],
        [79.0580, 30.7140],
        [79.0540, 30.7140],
        [79.0540, 30.7100],
      ]],
    },
  },
  {
    type: 'Feature',
    properties: {
      id: 'zone-gaurikund-kund-007',
      name: 'Gaurikund Kund Lane • Thermal Springs',
      streetName: 'Gaurikund Kund Lane • Thermal Springs',
      level: 'orange',
      inundationDepth: '0.50 m',
      flowVelocity: '2.0 m/s',
      fillTime: 'Fills in 30 min',
      flowAndFill: '2.0 m/s • Fills in 30 min',
      hazardReason: 'Mandakini embankment seepage flooding lower thermal bathing pools.',
      evacuationAction: 'Clear lower ghat steps; ascend to Upper Bazaar NH-107 roadway.',
      rainfall: '52.0 mm/hr',
      floodRisk: 58.0,
      riverDischarge: '210 m³/s',
      evacuationOrder: false,
      populationAtRisk: 480,
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [79.0260, 30.6505],
        [79.0292, 30.6505],
        [79.0292, 30.6530],
        [79.0260, 30.6530],
        [79.0260, 30.6505],
      ]],
    },
  },
  {
    type: 'Feature',
    properties: {
      id: 'zone-gaurikund-bus-008',
      name: 'Gaurikund Bus Terminal & Taxi Stand',
      streetName: 'Gaurikund Bus Terminal & Taxi Stand',
      level: 'yellow',
      inundationDepth: '0.25 m',
      flowVelocity: '1.2 m/s',
      fillTime: 'Fills in 60 min',
      flowAndFill: '1.2 m/s • Fills in 60 min',
      hazardReason: 'Culvert backflow onto vehicle staging tarmac during high intensity downpour.',
      evacuationAction: 'Park vehicles on upper tiers; maintain clear lane for emergency ambulances.',
      rainfall: '42.0 mm/hr',
      floodRisk: 38.0,
      riverDischarge: '160 m³/s',
      evacuationOrder: false,
      populationAtRisk: 310,
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [79.0240, 30.6485],
        [79.0275, 30.6485],
        [79.0275, 30.6510],
        [79.0240, 30.6510],
        [79.0240, 30.6485],
      ]],
    },
  },
  {
    type: 'Feature',
    properties: {
      id: 'zone-sonprayag-bay-009',
      name: 'Sonprayag Shuttle Bay • NH-107 Junction',
      streetName: 'Sonprayag Shuttle Bay • NH-107 Junction',
      level: 'green',
      inundationDepth: '0.05 m (Minimal)',
      flowVelocity: '0.5 m/s',
      fillTime: 'No Immediate Inundation',
      flowAndFill: '0.5 m/s • Safe Staging',
      hazardReason: 'Confluence monitoring active; water level well below road deck.',
      evacuationAction: 'Normal shuttle dispatch operations; stay tuned for emergency radio bulletins.',
      rainfall: '18.5 mm/hr',
      floodRisk: 15.0,
      riverDischarge: '65 m³/s',
      evacuationOrder: false,
      populationAtRisk: 0,
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [79.0300, 30.6295],
        [79.0345, 30.6295],
        [79.0345, 30.6335],
        [79.0300, 30.6335],
        [79.0300, 30.6295],
      ]],
    },
  },
];

// Fallback alias for backward compatibility
export const KEDARNATH_FALLBACK_ZONES = KEDARNATH_MICRO_ZONES;

// ---------------------------------------------------------------------------
// ZonePolygons Component
// ---------------------------------------------------------------------------
export function ZonePolygons({ zones, geojson, alertLevel: singleAlertLevel, socket, onSelectZone }) {
  const map = useMap();
  const [floodLevels, setFloodLevels] = useState(() => new Map());

  // Subscribe to WebSocket flood-prediction updates
  useEffect(() => {
    if (!socket) return;

    function handleFloodPrediction(prediction) {
      if (!prediction?.zoneId) return;
      setFloodLevels(prev =>
        new Map(prev).set(prediction.zoneId, {
          alertLevel: prediction.alertLevel,
          summary: prediction.summary,
          waterDepthM: prediction.waterDepthM,
          streamVelocityMs: prediction.streamVelocityMs,
        })
      );
    }

    socket.on('zone:flood-prediction', handleFloodPrediction);

    return () => {
      socket.off('zone:flood-prediction', handleFloodPrediction);
    };
  }, [socket]);

  // Style function per zone
  function styleZone(feature) {
    const zoneId = feature?.properties?.id;
    const level = feature?.properties?.level || singleAlertLevel || 'green';
    const flood = floodLevels.get(zoneId);
    const activeLevel = flood?.alertLevel || level;
    return FLOOD_COLORS[activeLevel] || FLOOD_COLORS.green;
  }

  // If a single geojson feature is passed (e.g. from GovernmentSituationMap)
  if (geojson) {
    const featureData = geojson.type === 'Feature' ? geojson : { type: 'Feature', geometry: geojson, properties: { level: singleAlertLevel || 'red' } };
    const activeLevel = singleAlertLevel || featureData.properties?.level || 'red';
    const colorMeta = FLOOD_COLORS[activeLevel] || FLOOD_COLORS.green;

    return (
      <GeoJSON
        data={featureData}
        style={() => colorMeta}
      />
    );
  }

  // Use provided zones if present, else fallback to Kedarnath valley micro-zones
  const displayZones = (zones && zones.length > 0) ? zones : KEDARNATH_MICRO_ZONES;

  return (
    <>
      {displayZones.map((zone, i) => {
        const zoneId = zone?.properties?.id || `zone-micro-${i}`;
        const props = zone?.properties || {};
        const level = props.level || 'green';
        const flood = floodLevels.get(zoneId);
        const activeLevel = flood?.alertLevel || level;
        const colorMeta = FLOOD_COLORS[activeLevel] || FLOOD_COLORS.green;

        const streetName = props.streetName || props.name || 'Kedarnath Sector';
        const waterDepth = props.inundationDepth || (flood?.waterDepthM ? `${flood.waterDepthM} m` : activeLevel === 'red' ? '1.85 m' : activeLevel === 'orange' ? '0.75 m' : activeLevel === 'yellow' ? '0.30 m' : '0.00 m');
        const flowAndFill = props.flowAndFill || (flood?.streamVelocityMs ? `${flood.streamVelocityMs} m/s` : activeLevel === 'red' ? '3.8 m/s • Fills in 12 min' : activeLevel === 'orange' ? '2.4 m/s • Fills in 25 min' : activeLevel === 'yellow' ? '1.6 m/s • Fills in 45 min' : '0.0 m/s • Safe');
        const hazardReason = props.hazardReason || props.description || flood?.summary || 'Active micro-corridor under high-resolution hydrological surveillance.';
        const evacuationAction = props.evacuationAction || (activeLevel === 'red' ? 'Immediate mandatory evacuation to safe high ridge.' : 'Stay alert and monitor emergency broadcast.');

        const key = `${zoneId}-${floodLevels.size}-${activeLevel}`;

        // Compute centroid for flyTo centering
        let centerLat = 30.7346, centerLng = 79.0669;
        try {
          const coords = zone.geometry?.coordinates?.[0];
          if (coords && coords.length > 0) {
            const sum = coords.reduce((acc, c) => [acc[0] + c[0], acc[1] + c[1]], [0, 0]);
            centerLng = sum[0] / coords.length;
            centerLat = sum[1] / coords.length;
          }
        } catch {}

        return (
          <GeoJSON
            key={key}
            data={zone}
            style={styleZone}
            eventHandlers={{
              click: () => {
                if (map) {
                  map.flyTo([centerLat, centerLng], 16.5, { animate: true, duration: 1.0 });
                }
                if (onSelectZone) onSelectZone({ ...props, id: zoneId, centerLat, centerLng });
              },
            }}
          >
            {/* Hover Tooltip / Label */}
            <Tooltip direction="top" offset={[0, -8]} opacity={0.95} sticky>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
                <span style={{ color: '#0F172A' }}>{streetName}</span>
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    padding: '2px 6px',
                    borderRadius: 4,
                    background: colorMeta.fillColor,
                    color: activeLevel === 'yellow' ? '#713F12' : '#FFFFFF',
                  }}
                >
                  {activeLevel.toUpperCase()}
                </span>
              </div>
            </Tooltip>

            {/* Click Detail Popup */}
            <Popup className="custom-zone-popup" maxWidth={320}>
              <div style={{ padding: '6px 4px', minWidth: 260, fontFamily: 'var(--font-body)' }}>
                
                {/* Header with Alert Pill & Rainfall */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      padding: '3px 8px',
                      borderRadius: 6,
                      background: colorMeta.fillColor,
                      color: activeLevel === 'yellow' ? '#713F12' : '#FFFFFF',
                      fontFamily: 'var(--font-heading)',
                    }}
                  >
                    {activeLevel.toUpperCase()} ALERT
                  </span>
                  {props.rainfall && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#0F172A', fontFamily: 'var(--font-mono)' }}>
                      🌧️ {props.rainfall}
                    </span>
                  )}
                </div>

                {/* 🛣️ Street Name */}
                <h4 style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', margin: '0 0 6px 0', lineHeight: 1.3, fontFamily: 'var(--font-heading)' }}>
                  🛣️ {streetName}
                </h4>

                {/* Key Metrics Grid: Inundation Depth & Velocity/Fill */}
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '6px 8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 10, marginBottom: 8 }}>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                      🌊 Street Depth
                    </span>
                    <strong style={{ color: colorMeta.color, fontSize: 13, fontFamily: 'var(--font-mono)' }}>
                      {waterDepth}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                      ⚡ Flow & Fill Time
                    </span>
                    <strong style={{ color: '#0F172A', fontSize: 11, fontFamily: 'var(--font-mono)', lineHeight: 1.2 }}>
                      {flowAndFill}
                    </strong>
                  </div>
                </div>

                {/* 🚨 Street-Specific Hazard Reason */}
                <div style={{ marginBottom: 6 }}>
                  <span style={{ color: '#475569', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, display: 'block', marginBottom: 2 }}>
                    🚨 Hazard Intelligence
                  </span>
                  <p style={{ fontSize: 11, color: '#1E293B', margin: 0, lineHeight: 1.35 }}>
                    {hazardReason}
                  </p>
                </div>

                {/* 🏃 Immediate Action / Evacuation Direction */}
                <div style={{ background: activeLevel === 'red' ? '#FEF2F2' : activeLevel === 'orange' ? '#FFF7ED' : '#F0FDF4', border: `1px solid ${activeLevel === 'red' ? '#FECACA' : activeLevel === 'orange' ? '#FED7AA' : '#BBF7D0'}`, borderRadius: 6, padding: '5px 7px', marginBottom: 6 }}>
                  <span style={{ color: activeLevel === 'red' ? '#991B1B' : activeLevel === 'orange' ? '#9A3412' : '#166534', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800, display: 'block', marginBottom: 1 }}>
                    🏃 Immediate Action
                  </span>
                  <p style={{ fontSize: 10.5, color: activeLevel === 'red' ? '#7F1D1D' : activeLevel === 'orange' ? '#7C2D12' : '#14532D', margin: 0, fontWeight: 600, lineHeight: 1.3 }}>
                    {evacuationAction}
                  </p>
                </div>

                {/* Secondary stats row: Risk Score & River Discharge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 9, color: '#64748B', paddingTop: 4, borderTop: '1px solid #E2E8F0' }}>
                  <span>Risk Score: <b style={{ color: colorMeta.color }}>{props.floodRisk ? `${props.floodRisk}/100` : (activeLevel === 'red' ? '92.4/100' : activeLevel === 'orange' ? '71.8/100' : '44.5/100')}</b></span>
                  <span>Discharge: <b>{props.riverDischarge || '420 m³/s'}</b></span>
                </div>

                {/* Mandatory Evacuation Badge */}
                {(props.evacuationOrder || activeLevel === 'red') && (
                  <div style={{ marginTop: 6, background: '#DC2626', color: '#FFFFFF', padding: '4px 6px', borderRadius: 6, fontSize: 9.5, fontWeight: 800, textAlign: 'center', fontFamily: 'var(--font-heading)', letterSpacing: '0.04em' }}>
                    🚨 MANDATORY EVACUATION IN EFFECT
                  </div>
                )}
              </div>
            </Popup>
          </GeoJSON>
        );
      })}
    </>
  );
}

