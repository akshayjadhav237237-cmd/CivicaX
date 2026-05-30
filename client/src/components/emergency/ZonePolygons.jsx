import { useEffect, useState } from 'react';
import { GeoJSON, Popup } from 'react-leaflet';

// ---------------------------------------------------------------------------
// Flood-prediction fill colors keyed by alertLevel
// ---------------------------------------------------------------------------
const FLOOD_COLORS = {
  green:  { fillColor: '#22C55E', fillOpacity: 0.15, color: '#16A34A', weight: 2 },
  yellow: { fillColor: '#FBBF24', fillOpacity: 0.25, color: '#EAB308', weight: 2 },
  orange: { fillColor: '#F97316', fillOpacity: 0.35, color: '#F97316', weight: 2 },
  red:    { fillColor: '#EF4444', fillOpacity: 0.45, color: '#DC2626', weight: 3, dashArray: '4' },
};

// ---------------------------------------------------------------------------
// Default style (no flood prediction yet) — mirrors existing EmergencyPage logic
// ---------------------------------------------------------------------------
function defaultStyle(feature) {
  const level = feature?.properties?.level;
  const colors = {
    yellow: { color: '#EAB308', fillColor: '#FEF08A', fillOpacity: 0.4 },
    orange: { color: '#F97316', fillColor: '#FED7AA', fillOpacity: 0.5 },
    red:    { color: '#EF4444', fillColor: '#FECACA', fillOpacity: 0.6 },
  };
  return {
    weight: 2,
    opacity: 1,
    dashArray: '4',
    ...(colors[level] || { color: '#3B82F6', fillColor: '#BFDBFE', fillOpacity: 0.2 }),
  };
}

// ---------------------------------------------------------------------------
// ZonePolygons
// ---------------------------------------------------------------------------
export function ZonePolygons({ zones, socket }) {
  // Map<zoneId, { alertLevel, summary }>
  const [floodLevels, setFloodLevels] = useState(() => new Map());

  // Subscribe to WebSocket flood-prediction updates
  useEffect(() => {
    if (!socket) return;

    function handleFloodPrediction(prediction) {
      setFloodLevels(prev =>
        new Map(prev).set(prediction.zoneId, {
          alertLevel: prediction.alertLevel,
          summary: prediction.summary,
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
    const flood = floodLevels.get(zoneId);
    if (flood && FLOOD_COLORS[flood.alertLevel]) {
      return { ...FLOOD_COLORS[flood.alertLevel], opacity: 1 };
    }
    return defaultStyle(feature);
  }

  if (!zones || zones.length === 0) return null;

  return (
    <>
      {zones.map((zone) => {
        const zoneId = zone?.properties?.id;
        const flood = floodLevels.get(zoneId);
        const floodColor = flood ? FLOOD_COLORS[flood.alertLevel] : null;

        // Key on both zoneId AND floodLevels.size so Leaflet GeoJSON re-mounts
        // whenever flood data changes (GeoJSON doesn't update style reactively).
        const key = `${zoneId}-${floodLevels.size}-${flood?.alertLevel ?? 'none'}`;

        return (
          <GeoJSON
            key={key}
            data={zone}
            style={styleZone}
          >
            <Popup>
              <div style={{ padding: 4, minWidth: 160 }}>
                <h3 style={{ fontWeight: 'bold', marginBottom: 4 }}>
                  {zone.properties?.name}
                </h3>
                {flood && (
                  <p style={{ fontSize: 12, color: '#475569', marginBottom: 4 }}>
                    {flood.summary}
                  </p>
                )}
                <span
                  style={{
                    fontSize: 11,
                    padding: '2px 8px',
                    borderRadius: 4,
                    background: floodColor?.fillColor || '#E2E8F0',
                    color: '#1E293B',
                  }}
                >
                  {flood
                    ? flood.alertLevel.toUpperCase()
                    : zone.properties?.level || 'NORMAL'}
                </span>
              </div>
            </Popup>
          </GeoJSON>
        );
      })}
    </>
  );
}
