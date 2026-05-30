import { useState, useEffect } from 'react';

const LAYER_DEFS = [
  { key: 'floodStreets',  icon: '🌊', label: 'Flood Streets' },
  { key: 'landslideRisk', icon: '⛰️', label: 'Landslide Risk' },
  { key: 'alertZones',   icon: '🔴', label: 'Alert Zones' },
  { key: 'safeZones',    icon: '🏠', label: 'Safe Zones' },
  { key: 'activeAlerts', icon: '🚨', label: 'Active Alerts' },
];

const defaultLayers = {
  floodStreets: true,
  landslideRisk: true,
  alertZones: true,
  safeZones: true,
  activeAlerts: true,
};

export function MapLayerControls({ onChange }) {
  const [layers, setLayers] = useState(() => {
    try {
      const saved = localStorage.getItem('civicax-map-layers');
      return saved ? JSON.parse(saved) : defaultLayers;
    } catch {
      return defaultLayers;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('civicax-map-layers', JSON.stringify(layers));
    } catch {
      // ignore storage errors
    }
    if (onChange) onChange(layers);
  }, [layers]);

  const toggle = (key) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(0,0,0,0.1)',
        borderRadius: 16,
        padding: '12px 14px',
        minWidth: 180,
        boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          fontWeight: 'bold',
          fontSize: 12,
          color: '#64748b',
          marginBottom: 8,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}
      >
        Map Layers
      </div>

      {LAYER_DEFS.map((def) => (
        <div
          key={def.key}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '5px 0',
            borderBottom: '1px solid rgba(0,0,0,0.05)',
          }}
        >
          <span style={{ fontSize: 13 }}>
            {def.icon} {def.label}
          </span>

          <button
            onClick={() => toggle(def.key)}
            aria-label={`Toggle ${def.label}`}
            aria-pressed={layers[def.key]}
            style={{
              width: 36,
              height: 20,
              borderRadius: 10,
              background: layers[def.key] ? '#3B82F6' : '#CBD5E1',
              border: 'none',
              cursor: 'pointer',
              position: 'relative',
              transition: 'background 0.2s',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                background: 'white',
                position: 'absolute',
                top: 2,
                left: layers[def.key] ? 18 : 2,
                transition: 'left 0.2s',
              }}
            />
          </button>
        </div>
      ))}
    </div>
  );
}
