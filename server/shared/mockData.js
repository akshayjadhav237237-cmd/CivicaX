/**
 * CivicaX Rich Mock Data Provider
 * Guaranteed fallback data for all emergency, civic, safety, and government modules.
 * Calibrated for Mandakini River Basin & Kedarnath Valley, Uttarakhand.
 */

const DEMO_ZONES_GEOJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
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
        updatedAt: new Date().toISOString(),
      },
    },
    {
      type: 'Feature',
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
        updatedAt: new Date().toISOString(),
      },
    },
    {
      type: 'Feature',
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
        updatedAt: new Date().toISOString(),
      },
    },
    {
      type: 'Feature',
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
        updatedAt: new Date().toISOString(),
      },
    },
    {
      type: 'Feature',
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
        updatedAt: new Date().toISOString(),
      },
    },
    {
      type: 'Feature',
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
        updatedAt: new Date().toISOString(),
      },
    },
    {
      type: 'Feature',
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
        updatedAt: new Date().toISOString(),
      },
    },
    {
      type: 'Feature',
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
        updatedAt: new Date().toISOString(),
      },
    },
    {
      type: 'Feature',
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
        updatedAt: new Date().toISOString(),
      },
    },
  ],
};

const DEMO_ACTIVE_ALERTS = [
  {
    id: 'alert-001-red',
    zoneId: 'zone-kedarnath-001',
    level: 'red',
    title: 'RED ALERT: Chorabari Glacial Lake Catchment & Kedarnath Temple Basin Flash Flood',
    description: 'Chorabari glacial lake catchment rainfall at 94.5 mm/hr. Mandakini discharge at 420 m³/s. Immediate mandatory evacuation order for Kedarnath Temple precinct and downstream banks.',
    evacuationOrder: true,
    isActive: true,
    affectedCount: 4200,
    rainfall: '94.5 mm/hr',
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    zone: {
      id: 'zone-kedarnath-001',
      name: 'Zone 1 — Chorabari Glacial Lake Catchment & Kedarnath Temple Basin',
      level: 'red',
      geojson: DEMO_ZONES_GEOJSON.features[0].geometry
    },
    creator: { id: 'demo-gov-id-003', name: 'Collector Singh', role: 'government' }
  },
  {
    id: 'alert-002-orange',
    zoneId: 'zone-rambara-002',
    level: 'orange',
    title: 'ORANGE WARNING: Rambara Gorge Landslide & Mudflow Advisory',
    description: 'Precipitation rate 72.0 mm/hr. High geotechnical slope instability in Rambara gorge sector. Trekking route suspended; SDRF teams deployed.',
    evacuationOrder: false,
    isActive: true,
    affectedCount: 1850,
    rainfall: '72.0 mm/hr',
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    zone: {
      id: 'zone-rambara-002',
      name: 'Zone 2 — Rambara Gorge & Mandakini River Sector',
      level: 'orange',
      geojson: DEMO_ZONES_GEOJSON.features[1].geometry
    },
    creator: { id: 'demo-gov-id-003', name: 'Collector Singh', role: 'government' }
  },
  {
    id: 'alert-003-yellow',
    zoneId: 'zone-gaurikund-003',
    level: 'yellow',
    title: 'YELLOW WATCH: Gaurikund Basecamp River Rise',
    description: 'Mandakini river swelling past warning mark near Gaurikund hot springs. Rainfall 48.2 mm/hr. Riverbank parking evacuated.',
    evacuationOrder: false,
    isActive: true,
    affectedCount: 950,
    rainfall: '48.2 mm/hr',
    createdAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    zone: {
      id: 'zone-gaurikund-003',
      name: 'Zone 3 — Gaurikund Basecamp & Thermal Springs',
      level: 'yellow',
      geojson: DEMO_ZONES_GEOJSON.features[2].geometry
    },
    creator: { id: 'demo-gov-id-003', name: 'Collector Singh', role: 'government' }
  }
];

const DEMO_SAFE_ZONES = [
  {
    id: 'safe-001',
    name: 'Guptkashi Helipad Ground Relief Shelter',
    type: 'government_building',
    latitude: 30.5235,
    longitude: 79.0792,
    capacity: 2500,
    occupancy: 420,
    status: 'activated',
    address: 'Guptkashi Main Helipad, Kedarnath Highway, Rudraprayag, UK 246439',
    contact: '+91 1364 267001',
    amenities: ['Helipad Medical Evac', 'Triage Unit', 'Emergency Rations', 'Satellite Communications', 'Drinking Water']
  },
  {
    id: 'safe-002',
    name: 'Phata Disaster Relief Base',
    type: 'community_hall',
    latitude: 30.5750,
    longitude: 79.0410,
    capacity: 1800,
    occupancy: 310,
    status: 'activated',
    address: 'Phata Aviation Hub, Kedarnath Route, UK 246471',
    contact: '+91 1364 267002',
    amenities: ['Air Evacuation Staging', 'First Aid Station', 'Hot Meals Kitchen', 'Generator Backup']
  },
  {
    id: 'safe-003',
    name: 'Sonprayag Community Hall Shelter',
    type: 'community_hall',
    latitude: 30.6315,
    longitude: 79.0325,
    capacity: 1200,
    occupancy: 180,
    status: 'activated',
    address: 'Sonprayag Sangam Road, Mandakini Valley, UK 246471',
    contact: '+91 1364 267003',
    amenities: ['High-Ground Shelter', 'Blanket Storage', 'Emergency Medic Station', 'Life Jackets']
  },
  {
    id: 'safe-004',
    name: 'Ukhimath Youth Center & Relief Camp',
    type: 'school',
    latitude: 30.5180,
    longitude: 79.0950,
    capacity: 1500,
    occupancy: 0,
    status: 'available',
    address: 'Ukhimath Administrative Block, Rudraprayag, UK 246469',
    contact: '+91 1364 267004',
    amenities: ['Mass Accommodation', 'Food Depot', 'Ambulance Staging Ground']
  },
  {
    id: 'safe-005',
    name: 'Triyuginarayan Temple Complex Safe Ridge',
    type: 'other',
    latitude: 30.6410,
    longitude: 78.9880,
    capacity: 800,
    occupancy: 0,
    status: 'available',
    address: 'Triyuginarayan Temple Ridge, Rudraprayag, UK 246471',
    contact: '+91 1364 267005',
    amenities: ['Natural High Ridge Shelter', 'Fresh Spring Water', 'Emergency Radio']
  }
];

const DEMO_SATELLITE_DATA = {
  status: 'nominal',
  lastSync: new Date().toISOString(),
  constellation: {
    gpm: { name: 'NASA GPM (IMERG)', status: 'online', latency: '12m', resolution: '0.1° (~10km)', precipitationMmHr: 44.2, accumulated24hMm: 148.0 },
    smap: { name: 'NASA SMAP L3', status: 'online', latency: '35m', resolution: '9km', soilMoistureM3M3: 0.380, saturationPct: 82.5 },
    srtm: { name: 'USGS SRTM 30m', status: 'online', latency: '0m', resolution: '30m DEM', meanSlope: 0.0820, peakElevationM: 3583 },
    openMeteo: { name: 'Open-Meteo HighRes', status: 'online', latency: '2m', rainRateMmHr: 44.2, windSpeedKmh: 38.5, temperatureC: 12.4 },
    osm: { name: 'OpenStreetMap Mandakini River Network', status: 'online', activeSegments: 415, flowStatus: 'Critical Inundation Risk' }
  },
  summary: {
    overallRisk: 'RED',
    riskScore: 78.4,
    livePrecipitation: '44.2 mm/hr',
    soilSaturation: '82.5%',
    basinDischarge: '420.0 m³/s',
    evacuationRecommendation: 'Mandatory evacuation for Zone 1 (Chorabari & Kedarnath Temple Basin)'
  }
};

const DEMO_FLOOD_PREDICTION = {
  success: true,
  score: 78.4,
  riskScore: 78.4,
  level: 'red',
  alertLevel: 'red',
  overflowDetected: true,
  dischargeM3S: 420.0,
  streamVelocityMs: 3.12,
  waterDepthM: 2.85,
  runoffDepthMm: 78.4,
  rainfall24hMm: 148.0,
  soilSaturationPct: 82.5,
  soilMoisture: 0.380,
  affectedPopulationEstimate: 4200,
  inundationAreaKm2: 4.85,
  timeToPeakHours: 1.2,
  timestamp: new Date().toISOString(),
  recommendation: '⛔ CRITICAL: Mandakini river overflow imminent. Rainfall 44.2 mm/hr exceeds critical threshold. Soil at 82.5% saturation. Immediate evacuation of riverbank areas required. Kedarnath town and downstream settlements at acute flood risk.',
  factors: {
    rain: {
      label: 'Current Rainfall',
      value: 44.2,
      unit: 'mm/hr',
      normalized: 0.884,
      weight: 0.35,
      contribution: 30.94,
      source: 'GPM_IMERG',
    },
    forecast: {
      label: '24h Precipitation Forecast',
      value: 148.0,
      unit: 'mm',
      normalized: 0.987,
      weight: 0.30,
      contribution: 29.60,
      source: 'open_meteo',
    },
    soil: {
      label: 'Soil Saturation',
      value: 0.380,
      unit: 'm³/m³',
      saturationPct: 82.5,
      normalized: 0.844,
      weight: 0.25,
      contribution: 21.11,
      source: 'SMAP',
    },
    terrain: {
      label: 'Valley Slope',
      value: 0.0820,
      unit: 'm/m',
      normalized: 0.547,
      weight: 0.10,
      contribution: 5.47,
      source: 'open_elevation',
    },
  },
  sources: {
    rain: 'GPM_IMERG',
    gpm: 'GPM_IMERG',
    soil: 'SMAP',
    terrain: 'open_elevation',
  },
  zoneMetrics: [
    { zoneId: 'zone-kedarnath-001', name: 'Chorabari Lake & Kedarnath Basin', level: 'red', riskScore: 89.2, discharge: '420 m³/s', status: 'Flash Flood Imminent' },
    { zoneId: 'zone-rambara-002', name: 'Rambara Gorge Sector', level: 'orange', riskScore: 68.5, discharge: '310 m³/s', status: 'Landslide Warning' },
    { zoneId: 'zone-gaurikund-003', name: 'Gaurikund Basecamp', level: 'yellow', riskScore: 42.0, discharge: '185 m³/s', status: 'River Bank Erosion' },
    { zoneId: 'zone-guptkashi-004', name: 'Guptkashi Safe Plateau', level: 'green', riskScore: 12.5, discharge: '45 m³/s', status: 'Safe Haven' }
  ],
  aiSummary: 'Real-time telemetry from NASA GPM IMERG (44.2 mm/hr) coupled with SMAP 82.5% soil saturation indicates critical hydrological runoff into the Mandakini River basin. Downstream channels are forecasted to exceed flood stage by +1.8m. Emergency operations center recommends immediate activation of relief camps.'
};

const DEMO_CIVIC_REPORTS = [
  {
    id: 'rep-001',
    reportCode: 'CIV-2026-081',
    category: 'pothole',
    title: 'Severe Trail Collapse on Kedarnath Trek',
    description: 'Pedestrian trail damaged spanning 15 meters near Rambara crossing. Highly dangerous for pilgrims and pack mules in rainy conditions.',
    address: 'Kedarnath Pilgrim Trek Route, Near Rambara Bridge',
    latitude: 30.6975,
    longitude: 79.0494,
    urgency: 'high',
    status: 'in_progress',
    upvotes: 48,
    createdAt: new Date(Date.now() - 2 * 86400 * 1000).toISOString(),
    department: { name: 'Public Works Department (PWD Uttarakhand)', email: 'pwd@rudraprayag.gov.in' },
    user: { id: 'demo-citizen-id-001', name: 'Priya Citizen' },
    timeline: [
      { id: 't-1', action: 'Report Submitted', changedAt: new Date(Date.now() - 2 * 86400 * 1000).toISOString(), notes: 'Citizen reported via mobile app' },
      { id: 't-2', action: 'Assigned to SDRF/PWD', changedAt: new Date(Date.now() - 1.5 * 86400 * 1000).toISOString(), notes: 'Work order #UK-PWD-892 generated' },
      { id: 't-3', action: 'Work In Progress', changedAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(), notes: 'Trail reinforcement team deployed with gabion wire' }
    ]
  },
  {
    id: 'rep-002',
    reportCode: 'CIV-2026-082',
    category: 'broken_streetlight',
    title: 'High-Mast Floodlight Outage at Gaurikund Basecamp',
    description: 'Solar high-mast light cluster non-functional creating blackout near Gaurikund bridge boarding counter.',
    address: 'Gaurikund Main Terminal, Kedarnath Trek Start',
    latitude: 30.6508,
    longitude: 79.0272,
    urgency: 'medium',
    status: 'assigned',
    upvotes: 22,
    createdAt: new Date(Date.now() - 3 * 86400 * 1000).toISOString(),
    department: { name: 'Uttarakhand Power Corporation Ltd (UPCL)', email: 'upcl@rudraprayag.gov.in' },
    user: { id: 'demo-citizen-id-001', name: 'Priya Citizen' },
    timeline: [
      { id: 't-4', action: 'Report Submitted', changedAt: new Date(Date.now() - 3 * 86400 * 1000).toISOString(), notes: 'Citizen reported issue' },
      { id: 't-5', action: 'Assigned to UPCL Line Crew', changedAt: new Date(Date.now() - 2 * 86400 * 1000).toISOString(), notes: 'Solar inverter technician dispatched' }
    ]
  },
  {
    id: 'rep-003',
    reportCode: 'CIV-2026-083',
    category: 'drainage',
    title: 'Mandakini Embankment Drainage Blockage',
    description: 'Silt and mountain scree blocking the main culvert outflow near Sonprayag sangam, causing localized water backup.',
    address: 'Sonprayag Sangam Embankment, NH-107',
    latitude: 30.6315,
    longitude: 79.0325,
    urgency: 'high',
    status: 'submitted',
    upvotes: 35,
    createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    department: { name: 'Irrigation & Flood Control Board', email: 'floodcontrol@rudraprayag.gov.in' },
    user: { id: 'demo-citizen-id-001', name: 'Priya Citizen' },
    timeline: [
      { id: 't-6', action: 'Report Submitted', changedAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(), notes: 'High-priority drainage ticket' }
    ]
  }
];

const DEMO_SAFETY_REPORTS = [
  {
    id: 'saf-001',
    category: 'hazard',
    title: 'Debris Flow and Boulder Fall near Rambara Gorge',
    description: 'Active rockfall and mudflow blocking the upper mule path between Jungle Chatti and Rambara. Pilgrim transit halted.',
    latitude: 30.6975,
    longitude: 79.0494,
    address: 'Kedarnath Trek, Mile 8 near Rambara',
    urgency: 'immediate',
    credibilityScore: 98,
    status: 'in_progress',
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
  },
  {
    id: 'saf-002',
    category: 'hazard',
    title: 'Mandakini River Swelling Rapidly at Gaurikund Ghats',
    description: 'Water level risen by 1.6 meters in past hour. Lower thermal bathing pool completely submerged.',
    latitude: 30.6508,
    longitude: 79.0272,
    address: 'Gaurikund Thermal Springs Ghat',
    urgency: 'immediate',
    credibilityScore: 96,
    status: 'assigned',
    createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString()
  },
  {
    id: 'saf-003',
    category: 'blockage',
    title: 'Culvert Overflow on Sonprayag-Gaurikund Road',
    description: 'Mountain stream overflowed onto motorable road with 2 feet of water. Shuttles temporarily grounded.',
    latitude: 30.6410,
    longitude: 79.0300,
    address: 'Sonprayag-Gaurikund Shuttle Corridor',
    urgency: 'immediate',
    credibilityScore: 94,
    status: 'submitted',
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString()
  }
];

const DEMO_CIVIC_STATS = {
  total: 52,
  active: 16,
  inProgress: 10,
  resolved: 26,
  resolutionRate: 88.5,
  avgResolutionHours: 12.4,
  byCategory: [
    { category: 'pothole', count: 19 },
    { category: 'broken_streetlight', count: 12 },
    { category: 'drainage', count: 11 },
    { category: 'water_supply', count: 6 },
    { category: 'waste_management', count: 4 }
  ],
  byStatus: [
    { status: 'submitted', _count: { _all: 6 } },
    { status: 'assigned', _count: { _all: 10 } },
    { status: 'in_progress', _count: { _all: 10 } },
    { status: 'resolved', _count: { _all: 26 } }
  ]
};

const DEMO_PUBLIC_STATS = {
  activeAlerts: 3,
  resolvedGrievances: 1840,
  safeZones: 5,
  activeResponders: 450,
  safeZonesCapacity: 7800,
  safeZonesAvailable: 6890
};

module.exports = {
  DEMO_ZONES_GEOJSON,
  DEMO_ACTIVE_ALERTS,
  DEMO_SAFE_ZONES,
  DEMO_SATELLITE_DATA,
  DEMO_FLOOD_PREDICTION,
  DEMO_CIVIC_REPORTS,
  DEMO_CIVIC_STATS,
  DEMO_SAFETY_REPORTS,
  DEMO_PUBLIC_STATS
};
