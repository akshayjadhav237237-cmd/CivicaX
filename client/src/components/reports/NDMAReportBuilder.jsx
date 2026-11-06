import { useState, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Printer,
  Download,
  FileText,
  FileSpreadsheet,
  Share2,
  ShieldAlert,
  AlertTriangle,
  Droplets,
  Waves,
  MapPin,
  Users,
  Building2,
  Zap,
  HeartPulse,
  Truck,
  Tent,
  Sparkles,
  Edit3,
  Eye,
  Check,
  Copy,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  SlidersHorizontal,
  Compass,
  ArrowUpRight
} from 'lucide-react';

// Preset Incident Templates for NDMA Command Centers
const INCIDENT_PRESETS = [
  {
    id: 'NDMA-UK-RUD-2026-FL08',
    name: 'Mandakini Basin Cloudburst & Flash Surge (Rudraprayag)',
    state: 'Uttarakhand',
    district: 'Rudraprayag',
    division: 'Garhwal Division',
    alertLevel: 'RED',
    securityClassification: 'RESTRICTED // OPERATIONAL',
    sitrepNo: 'SITREP-04 / 2026',
    disasterLevel: 'Level 3 (L-3) Major Hydrological Crisis',
    eventTitle: 'Catchment Cloudburst & Glacial Outburst Surge',
    triggerDescription: 'Localized cloudburst in the upper catchment of Chorabari Glacial Lake (~118 mm recorded in 90 min at AWS Kedarnath) triggering high-momentum hyper-concentrated flash surge into Mandakini River.',
    sectorLocation: 'Mandakini River Corridor (Kedarnath - Gaurikund - Sonprayag - Guptkashi - Tilwara - Rudraprayag)',
    coordinates: '30.7346° N, 79.0669° E',
    riverName: 'Mandakini River',
    warningLevelMeters: 624.50,
    dangerLevelMeters: 626.00,
    gaugeLevelMeters: 629.40,
    overflowRatio: 1.34, // (gauge - warning) / (danger - warning) or gauge/danger
    hflExceededMeters: 3.40,
    rainfallRateMmH: 68.4,
    rainfallAccumulated3h: 142.6,
    soilSaturationPct: 92.8,
    streamVelocityMs: 4.82,
    dischargeM3s: 1420,
    peakSurgeETA: 'T+42 min (ETA 07:27 IST at Sonprayag Choke Point)',
    downstreamETAs: [
      { point: 'Sonprayag Bridge Choke Point', eta: 'T+42 min (07:27 IST)', status: 'Imminent Threat' },
      { point: 'Kund Road Confluence', eta: 'T+95 min (08:20 IST)', status: 'Pre-Evacuation Alert' },
      { point: 'Rudraprayag Alaknanda Confluence', eta: 'T+180 min (09:45 IST)', status: 'Sluice Gates Opened' }
    ],
    inundatedWardsCount: 6,
    totalWardsCount: 9,
    inundatedWardsList: 'Ward 1 (Temple Bazar), Ward 2 (Helipad Colony), Ward 4 (Riverfront Market), Ward 5 (Gaurikund Base), Ward 7 (Sonprayag Lowland), Ward 8 (Banswara Sector)',
    submergedCulvertsCount: 4,
    roadCutoffsSummary: '4 submerged culverts, 3 major highway breach points on NH-107 (km 38 Banswara & km 52 Kund approach). Rambara pedestrian suspension bridge washed away.',
    populationAtRisk: 14200,
    evacuatedHeadcount: 9480,
    strandedHeadcount: 3120,
    unaccountedHeadcount: 1600,
    criticalInfrastructure: [
      { name: 'Kedarnath Helipad', type: 'Aviation', status: 'Submerged / Non-Operational', impact: '0.6m debris siltation on apron; civil flights suspended, air-ops shifted to Guptkashi & Gauchar' },
      { name: 'Primary Health Center (PHC Sonprayag)', type: 'Healthcare', status: 'Partially Flooded', impact: 'Ground floor submerged; emergency triage and casualty clearing operational on 1st floor' },
      { name: '33kV Electrical Substation (Guptkashi)', type: 'Power Grid', status: 'Tripped / Offline', impact: 'Controlled isolation to avert mass electrocution; 12 diesel generator backup deployed for comms' },
      { name: 'Municipal Water Filtration Works', type: 'Sanitation', status: 'Silted / Offline', impact: 'Turbidity exceeds 4,200 NTU; emergency mobile RO tankers and chlorine packets distributed' },
      { name: 'Emergency Comms / BSNL Tower Kund', type: 'Telecom', status: 'Degraded / Battery Power', impact: 'Grid feed lost; operating on 6-hr battery bank; SDRF satellite SAT-COM terminals active' }
    ],
    ndrfBattalions: 'NDRF 8th Battalion (4 Teams / 160 Rescuers, 12 Inflatable Rescue Boats)',
    sdrfBattalions: 'SDRF Uttarakhand (3 Mountain Rescue Companies / 95 Personnel)',
    armySupport: 'Garhwal Rifles - 1 Standby Column at Joshimath staging base',
    dewateringPumpsCount: 16,
    dewateringPumpsSpec: '10x 500-GPM High-Discharge Submersibles, 6x Trailer-mounted Trash Mud Pumps',
    mobileMedicalUnits: 4,
    icuBedsTotal: 40,
    icuBedsOccupied: 28,
    icuBedsAvailable: 12,
    oxygenCylindersActive: 185,
    reliefCampsCount: 6,
    reliefCampsCapacity: 6000,
    reliefCampsOccupancy: 4650,
    foodPacketsDistributed: 12500,
    officerName: 'Dr. Saurabh Joshi, IAS',
    officerDesignation: 'District Magistrate & Chairman DDMA, Rudraprayag',
    incidentCommander: 'Col. R. K. Rawat, Commandant 8th Bn NDRF',
    officerBadge: 'UK-DDMA-0914-DM',
    officerDirectives: '1. Enforce complete vehicular freeze on NH-107 downstream of Kund.\n2. Prioritize rotary airlift from Guptkashi for 42 high-acuity patients.\n3. Mobilize additional 8 high-volume dewatering pumps to clear PHC ground floor by 09:00 IST.\n4. Maintain 33kV substation electrical lockout until gauge drops below 627.0m.\n5. Issue warning sirens at Tilwara and Rudraprayag confluence.'
  },
  {
    id: 'NDMA-UK-CHA-2026-FL03',
    name: 'Alaknanda Tributary Inundation (Chamoli Sector)',
    state: 'Uttarakhand',
    district: 'Chamoli',
    division: 'Garhwal Division',
    alertLevel: 'ORANGE',
    securityClassification: 'RESTRICTED // OPERATIONAL',
    sitrepNo: 'SITREP-02 / 2026',
    disasterLevel: 'Level 2 (L-2) Regional Hazard Alert',
    eventTitle: 'Glacial Splay & High-Discharge Snowmelt Surge',
    triggerDescription: 'Combined snowmelt and intense thunderstorm cell over Nanda Devi sanctuary leading to sudden high-velocity swell in Rishiganga and Dhauliganga tributaries.',
    sectorLocation: 'Alaknanda Basin (Joshimath - Tapovan - Pipalkoti - Karnaprayag)',
    coordinates: '30.5564° N, 79.5647° E',
    riverName: 'Alaknanda River',
    warningLevelMeters: 460.00,
    dangerLevelMeters: 462.50,
    gaugeLevelMeters: 464.10,
    overflowRatio: 1.18,
    hflExceededMeters: 1.60,
    rainfallRateMmH: 42.0,
    rainfallAccumulated3h: 88.5,
    soilSaturationPct: 81.4,
    streamVelocityMs: 3.65,
    dischargeM3s: 980,
    peakSurgeETA: 'T+75 min (ETA 10:15 IST at Pipalkoti Gorge)',
    downstreamETAs: [
      { point: 'Pipalkoti Low Bank', eta: 'T+75 min (10:15 IST)', status: 'Active Watch' },
      { point: 'Chamoli Bazar Embankment', eta: 'T+130 min (11:10 IST)', status: 'Safe Margin' }
    ],
    inundatedWardsCount: 3,
    totalWardsCount: 7,
    inundatedWardsList: 'Ward 2 (Ghat Lowland), Ward 3 (Old Market), Ward 6 (Barrage Colony)',
    submergedCulvertsCount: 2,
    roadCutoffsSummary: '2 culverts inundated near Tapovan tunnel access; Badrinath National Highway operating with single-lane restriction.',
    populationAtRisk: 6800,
    evacuatedHeadcount: 5100,
    strandedHeadcount: 1400,
    unaccountedHeadcount: 300,
    criticalInfrastructure: [
      { name: 'Tapovan Tunnel Approach Road', type: 'Transport', status: 'Partially Submerged', impact: 'Single lane opened for emergency traffic only; heavy earthmovers on standby' },
      { name: 'District Hospital Gopeshwar', type: 'Healthcare', status: 'Fully Operational', impact: '30 surge trauma beds prepared; 2 standby triage ambulances at Joshimath' },
      { name: 'Vishnugad-Pipalkoti Hydel Switchyard', type: 'Power Grid', status: 'Monitoring Alert', impact: 'Water intake restricted; sluice gates 80% raised for silt clearance' }
    ],
    ndrfBattalions: 'NDRF 8th Battalion (2 Teams / 80 Rescuers)',
    sdrfBattalions: 'SDRF Joshimath Company (45 Personnel)',
    armySupport: 'Brigade HQ Joshimath - 2 Light Recovery Teams',
    dewateringPumpsCount: 8,
    dewateringPumpsSpec: '8x 350-GPM portable dewatering engines',
    mobileMedicalUnits: 2,
    icuBedsTotal: 25,
    icuBedsOccupied: 14,
    icuBedsAvailable: 11,
    oxygenCylindersActive: 90,
    reliefCampsCount: 4,
    reliefCampsCapacity: 3500,
    reliefCampsOccupancy: 2450,
    foodPacketsDistributed: 6000,
    officerName: 'Himanshu Khurana, IAS',
    officerDesignation: 'District Magistrate & Chairman DDMA, Chamoli',
    incidentCommander: 'Dy. Commandant V. S. Negi, SDRF',
    officerBadge: 'UK-DDMA-0412-DM',
    officerDirectives: 'Maintain vigil on barrage water levels. Issue siren alerts if discharge exceeds 1,100 m3/s.'
  }
];

export function NDMAReportBuilder({ initialPresetId = 'NDMA-UK-RUD-2026-FL08' }) {
  // Active Preset Selection
  const [selectedPresetId, setSelectedPresetId] = useState(initialPresetId);
  const activePreset = useMemo(
    () => INCIDENT_PRESETS.find(p => p.id === selectedPresetId) || INCIDENT_PRESETS[0],
    [selectedPresetId]
  );

  // Editable Incident Form State
  const [incidentData, setIncidentData] = useState(activePreset);
  const [activeTab, setActiveTab] = useState('sitrep'); // 'sitrep' | 'edit' | 'export'
  const [isGeneratingBriefing, setIsGeneratingBriefing] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  // Sync state when preset changes
  const handlePresetChange = (presetId) => {
    setSelectedPresetId(presetId);
    const found = INCIDENT_PRESETS.find(p => p.id === presetId);
    if (found) {
      setIncidentData(found);
      toast.success(`Loaded: ${found.name}`);
    }
  };

  // Field change helper
  const updateField = (field, value) => {
    setIncidentData(prev => ({ ...prev, [field]: value }));
  };

  // Nested infrastructure updater
  const updateInfraStatus = (index, status) => {
    setIncidentData(prev => {
      const updated = [...prev.criticalInfrastructure];
      updated[index] = { ...updated[index], status };
      return { ...prev, criticalInfrastructure: updated };
    });
  };

  // Dynamic calculations
  const evacuationRate = useMemo(() => {
    if (!incidentData.populationAtRisk || incidentData.populationAtRisk <= 0) return 0;
    return Math.min(100, Math.round((incidentData.evacuatedHeadcount / incidentData.populationAtRisk) * 100));
  }, [incidentData.populationAtRisk, incidentData.evacuatedHeadcount]);

  const campUtilizationRate = useMemo(() => {
    if (!incidentData.reliefCampsCapacity || incidentData.reliefCampsCapacity <= 0) return 0;
    return Math.min(100, Math.round((incidentData.reliefCampsOccupancy / incidentData.reliefCampsCapacity) * 100));
  }, [incidentData.reliefCampsCapacity, incidentData.reliefCampsOccupancy]);

  // AI-synthesized briefing generator simulation (GPT-4o style)
  const handleRegenerateAIBriefing = () => {
    setIsGeneratingBriefing(true);
    setTimeout(() => {
      const newBriefing = `EXECUTIVE SITUATION BRIEFING FOR DISTRICT MAGISTRATE (${incidentData.district.toUpperCase()}): Telemetric sensors indicate an intensified ${incidentData.eventTitle} affecting the ${incidentData.riverName} corridor. Current gauge reading of ${incidentData.gaugeLevelMeters}m represents ${incidentData.overflowRatio}x surge above high flood datum. Extreme rainfall (${incidentData.rainfallRateMmH} mm/h via NASA GPM constellation) combined with critically saturated soil (${incidentData.soilSaturationPct}% SMAP index) produces high-velocity streamflow (${incidentData.streamVelocityMs} m/s) with peak wave arrival at ${incidentData.peakSurgeETA}. ${incidentData.inundatedWardsCount} of ${incidentData.totalWardsCount} municipal wards are flooded with ${incidentData.evacuatedHeadcount.toLocaleString()} civilians safely evacuated (${evacuationRate}% completion). PRIORITY OPERATIONAL DIRECTIVES: (1) Sustain deployment of ${incidentData.ndrfBattalions} to vulnerable sectors; (2) Run ${incidentData.dewateringPumpsCount} dewatering pump units continuously at PHC and road choke points; (3) Enforce total electrical lockout of flooded sub-stations; (4) Retain ${incidentData.icuBedsAvailable} ICU beds and ${incidentData.oxygenCylindersActive} oxygen cylinders for critical triage.`;
      updateField('officerDirectives', newBriefing);
      setIsGeneratingBriefing(false);
      toast.success('AI Situation Briefing successfully regenerated via GPT-4o synthesis!');
    }, 900);
  };

  // Print function
  const handlePrint = () => {
    window.print();
  };

  // JSON Export
  const handleExportJSON = () => {
    const exportPayload = {
      standard: 'National Disaster Management Authority (NDMA) SITREP Protocol v2.4',
      agency: 'Government of India - Ministry of Home Affairs / NDMA',
      stateDisasterManagementAuthority: `USDMA (${incidentData.state})`,
      districtDisasterManagementAuthority: `DDMA (${incidentData.district})`,
      incidentId: incidentData.id,
      sitrepNumber: incidentData.sitrepNo,
      classification: incidentData.securityClassification,
      disasterLevel: incidentData.disasterLevel,
      generatedAt: new Date().toISOString(),
      reportData: {
        eventSummary: {
          title: incidentData.eventTitle,
          trigger: incidentData.triggerDescription,
          alertLevel: incidentData.alertLevel,
          sector: incidentData.sectorLocation,
          coordinates: incidentData.coordinates,
          river: incidentData.riverName,
          gaugeLevelMeters: incidentData.gaugeLevelMeters,
          dangerLevelMeters: incidentData.dangerLevelMeters,
          overflowRatio: incidentData.overflowRatio,
          hflExceededMeters: incidentData.hflExceededMeters
        },
        hydrologicalGroundTruth: {
          nasaGpmRainfallMmH: incidentData.rainfallRateMmH,
          rainfallAccumulated3hMm: incidentData.rainfallAccumulated3h,
          smapSoilSaturationPct: incidentData.soilSaturationPct,
          manningVelocityMs: incidentData.streamVelocityMs,
          dischargeM3s: incidentData.dischargeM3s,
          peakSurgeWaveArrival: incidentData.peakSurgeETA,
          downstreamSectors: incidentData.downstreamETAs
        },
        damageAndThreatAssessment: {
          inundatedWards: `${incidentData.inundatedWardsCount} / ${incidentData.totalWardsCount}`,
          inundatedWardsList: incidentData.inundatedWardsList,
          submergedCulverts: incidentData.submergedCulvertsCount,
          roadCutoffs: incidentData.roadCutoffsSummary,
          populationAtRisk: incidentData.populationAtRisk,
          evacuatedHeadcount: incidentData.evacuatedHeadcount,
          evacuationRatePct: evacuationRate,
          strandedHeadcount: incidentData.strandedHeadcount,
          unaccountedHeadcount: incidentData.unaccountedHeadcount,
          criticalInfrastructureStatus: incidentData.criticalInfrastructure
        },
        resourceMobilization: {
          ndrfBattalions: incidentData.ndrfBattalions,
          sdrfBattalions: incidentData.sdrfBattalions,
          armySupport: incidentData.armySupport,
          dewateringPumps: {
            count: incidentData.dewateringPumpsCount,
            spec: incidentData.dewateringPumpsSpec
          },
          medicalTriage: {
            mobileUnits: incidentData.mobileMedicalUnits,
            icuTotal: incidentData.icuBedsTotal,
            icuOccupied: incidentData.icuBedsOccupied,
            icuAvailable: incidentData.icuBedsAvailable,
            o2Cylinders: incidentData.oxygenCylindersActive
          },
          shelterAndCamps: {
            campsCount: incidentData.reliefCampsCount,
            totalCapacity: incidentData.reliefCampsCapacity,
            currentOccupancy: incidentData.reliefCampsOccupancy,
            utilizationRatePct: campUtilizationRate,
            foodRationsDistributed: incidentData.foodPacketsDistributed
          }
        },
        executiveDirectives: {
          officerName: incidentData.officerName,
          officerDesignation: incidentData.officerDesignation,
          incidentCommander: incidentData.incidentCommander,
          badgeId: incidentData.officerBadge,
          signOffDate: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
          directivesText: incidentData.officerDirectives
        }
      }
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${incidentData.id}_NDMA_SITREP_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Downloaded official NDMA SITREP JSON');
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['Category', 'Field', 'Value', 'Unit / Metric', 'Status / Directives'];
    const rows = [
      ['Metadata', 'Incident ID', incidentData.id, '-', incidentData.securityClassification],
      ['Metadata', 'SITREP Number', incidentData.sitrepNo, '-', incidentData.disasterLevel],
      ['Metadata', 'District Authority', `${incidentData.district}, ${incidentData.state}`, '-', 'DDMA Control'],
      ['Event Summary', 'Event Title', incidentData.eventTitle, '-', incidentData.alertLevel],
      ['Event Summary', 'Trigger Mechanism', incidentData.triggerDescription.replace(/,/g, ';'), '-', 'Active Warning'],
      ['Event Summary', 'River Monitored', incidentData.riverName, '-', 'Gauge Over Threshold'],
      ['Event Summary', 'Current Gauge Level', incidentData.gaugeLevelMeters, 'meters', `Danger DL: ${incidentData.dangerLevelMeters}m`],
      ['Event Summary', 'Overflow Ratio', incidentData.overflowRatio, 'x DL', `+${incidentData.hflExceededMeters}m above Danger`],
      ['Hydrology', 'NASA GPM Rainfall Rate', incidentData.rainfallRateMmH, 'mm/hour', 'Flash Precipitation'],
      ['Hydrology', 'SMAP Soil Saturation', incidentData.soilSaturationPct, '%', 'Critical Debris Runoff'],
      ['Hydrology', 'Manning Stream Velocity', incidentData.streamVelocityMs, 'm/s', 'Turbulent Discharge'],
      ['Hydrology', 'Estimated Stream Discharge', incidentData.dischargeM3s, 'm3/s', 'Hydrometric Buoy'],
      ['Hydrology', 'Peak Surge Arrival', incidentData.peakSurgeETA.replace(/,/g, ';'), '-', 'Downstream Alert'],
      ['Damage Assessment', 'Inundated Wards', `${incidentData.inundatedWardsCount} of ${incidentData.totalWardsCount}`, 'wards', 'Submerged'],
      ['Damage Assessment', 'Submerged Culverts', incidentData.submergedCulvertsCount, 'culverts', 'Traffic Severed'],
      ['Damage Assessment', 'Population at Risk', incidentData.populationAtRisk, 'headcount', 'Target Demographic'],
      ['Damage Assessment', 'Evacuated Headcount', incidentData.evacuatedHeadcount, 'headcount', `${evacuationRate}% Evacuated`],
      ['Damage Assessment', 'Stranded Civilians', incidentData.strandedHeadcount, 'headcount', 'Priority Rescue'],
      ...incidentData.criticalInfrastructure.map(item => [
        'Critical Infrastructure',
        item.name,
        item.status,
        item.type,
        item.impact.replace(/,/g, ';')
      ]),
      ['Resource Mobilization', 'NDRF Deployment', incidentData.ndrfBattalions.replace(/,/g, ';'), 'battalion', 'Active'],
      ['Resource Mobilization', 'SDRF Deployment', incidentData.sdrfBattalions.replace(/,/g, ';'), 'teams', 'Active'],
      ['Resource Mobilization', 'Dewatering Pumps', incidentData.dewateringPumpsCount, 'units', incidentData.dewateringPumpsSpec.replace(/,/g, ';')],
      ['Resource Mobilization', 'Medical Triage Units', incidentData.mobileMedicalUnits, 'units', 'In Field'],
      ['Resource Mobilization', 'ICU Beds Available', `${incidentData.icuBedsAvailable} / ${incidentData.icuBedsTotal}`, 'beds', `${incidentData.icuBedsOccupied} Occupied`],
      ['Resource Mobilization', 'Emergency O2 Cylinders', incidentData.oxygenCylindersActive, 'cylinders', 'Depot Staged'],
      ['Resource Mobilization', 'Relief Camps Active', incidentData.reliefCampsCount, 'camps', `${campUtilizationRate}% Utilized`],
      ['Command Sign-off', 'Commanding Officer', incidentData.officerName, '-', incidentData.officerDesignation.replace(/,/g, ';')],
      ['Command Sign-off', 'Badge ID', incidentData.officerBadge, '-', 'Digitally Verified']
    ];

    const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${incidentData.id}_DAMAGE_ASSESSMENT_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Downloaded NDMA Damage Assessment CSV');
  };

  const handleCopyJson = () => {
    const rawData = JSON.stringify(incidentData, null, 2);
    navigator.clipboard.writeText(rawData);
    setCopiedJson(true);
    toast.success('Raw JSON copied to clipboard');
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <div className="w-full space-y-6">
      {/* Component-embedded @media print CSS for authentic high-contrast government documentation */}
      <style>{`
        @media print {
          /* Hide app navigation, buttons, tab bars and screen chrome */
          nav, aside, .glass-nav, header, footer, .no-print, .action-bar, button {
            display: none !important;
          }

          /* Force high contrast white background and crisp dark typography */
          body, html {
            background: #ffffff !important;
            color: #0f172a !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Root container resets */
          main {
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
          }

          .ndma-document-container {
            width: 100% !important;
            max-width: 100% !important;
            box-shadow: none !important;
            border: 2px solid #0f172a !important;
            border-radius: 0 !important;
            background: #ffffff !important;
            color: #0f172a !important;
            padding: 12mm 15mm !important;
            margin: 0 auto !important;
          }

          .ndma-section-box {
            border: 1px solid #cbd5e1 !important;
            background: #f8fafc !important;
            border-radius: 4px !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            margin-bottom: 12px !important;
          }

          .ndma-table {
            border-collapse: collapse !important;
            width: 100% !important;
          }

          .ndma-table th, .ndma-table td {
            border: 1px solid #cbd5e1 !important;
            padding: 6px 8px !important;
            font-size: 9pt !important;
          }

          .ndma-badge-print {
            border: 1px solid #000 !important;
            padding: 2px 6px !important;
            font-weight: bold !important;
            text-transform: uppercase !important;
          }

          .page-break-always {
            page-break-before: always !important;
            break-before: page !important;
          }

          .avoid-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>

      {/* Top Controller & Preset Toolbar (Screen Only) */}
      <div className="no-print glass-card p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-600 animate-ping" />
            <span className="text-xs font-bold tracking-wider uppercase text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950/60 px-2.5 py-1 rounded-md border border-red-300 dark:border-red-800">
              NDMA Operational Protocol
            </span>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="preset-select" className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Scenario:
            </label>
            <select
              id="preset-select"
              value={selectedPresetId}
              onChange={(e) => handlePresetChange(e.target.value)}
              className="text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm"
            >
              {INCIDENT_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.alertLevel})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons: Print / PDF, JSON, CSV */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* View Mode Switcher */}
          <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1 border border-slate-200 dark:border-slate-700/60">
            <button
              onClick={() => setActiveTab('sitrep')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'sitrep'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Eye size={13} /> Official SITREP
            </button>
            <button
              onClick={() => setActiveTab('edit')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'edit'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Edit3 size={13} /> Command Edit
            </button>
            <button
              onClick={() => setActiveTab('export')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'export'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <FileSpreadsheet size={13} /> Inter-Agency Data
            </button>
          </div>

          <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-700 hidden sm:block" />

          {/* Quick Action Export Buttons */}
          <button
            onClick={handlePrint}
            title="Print Report or Save as PDF"
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-blue-600 dark:hover:bg-blue-500 shadow-sm transition-all cursor-pointer"
          >
            <Printer size={13} /> Print / Export PDF
          </button>

          <button
            onClick={handleExportJSON}
            title="Download NDMA CAP JSON Package"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition-all cursor-pointer"
          >
            <Download size={13} /> JSON
          </button>

          <button
            onClick={handleExportCSV}
            title="Download Tabular CSV for GIS and Spreadsheets"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition-all cursor-pointer"
          >
            <FileSpreadsheet size={13} /> CSV
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OFFICIAL SITUATION REPORT PREVIEW (NDMA WYSIWYG DOCUMENT)          */}
      {/* ========================================================================= */}
      {(activeTab === 'sitrep' || activeTab === 'export') && (
        <div className="ndma-document-container bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-2xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-xl transition-all">
          {/* Government Tri-Color Emblem Strip */}
          <div className="w-full h-1.5 rounded-full mb-6 flex overflow-hidden">
            <div className="h-full w-1/3 bg-[#FF9933]" />
            <div className="h-full w-1/3 bg-[#FFFFFF]" />
            <div className="h-full w-1/3 bg-[#138808]" />
          </div>

          {/* OFFICIAL HEADER */}
          <div className="border-b-2 border-slate-900 dark:border-slate-300 pb-5 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-red-600 text-white font-mono">
                    {incidentData.securityClassification}
                  </span>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 font-mono">
                    {incidentData.sitrepNo}
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
                  NATIONAL DISASTER MANAGEMENT AUTHORITY (NDMA)
                </h1>
                <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase">
                  STATE DISASTER MANAGEMENT AUTHORITY ({incidentData.state.toUpperCase()}) // DDMA {incidentData.district.toUpperCase()}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Central Emergency Operations Center (CEOC) & District Disaster Management Center
                </p>
              </div>

              {/* Incident Identification Box */}
              <div className="border-2 border-slate-900 dark:border-slate-300 rounded-lg p-3 text-right bg-slate-50 dark:bg-slate-900 min-w-[220px]">
                <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                  INCIDENT IDENTIFIER
                </div>
                <div className="text-sm font-mono font-black text-blue-600 dark:text-blue-400">
                  {incidentData.id}
                </div>
                <div className="text-[11px] font-mono font-medium text-slate-600 dark:text-slate-300 mt-1">
                  {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} | 07:00 IST
                </div>
                <div className="mt-1">
                  <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-200 border border-red-300 dark:border-red-700">
                    {incidentData.disasterLevel}
                  </span>
                </div>
              </div>
            </div>

            {/* Target Directives Distribution List */}
            <div className="mt-4 pt-3 border-t border-dashed border-slate-300 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 flex flex-wrap gap-x-6 gap-y-1">
              <span><strong>TO:</strong> District Magistrate, Rudraprayag</span>
              <span><strong>INFO:</strong> Relief Commissioner, Dehradun</span>
              <span><strong>OPS:</strong> NDRF 8th Bn HQ / SDRF Ops Room</span>
              <span><strong>SECTOR:</strong> Garhwal Division Hydrological Sector</span>
            </div>
          </div>

          {/* SECTION 1: EVENT SUMMARY */}
          <div className="ndma-section-box mb-6 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 avoid-break">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-xs sm:text-sm font-black tracking-wider uppercase text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-blue-600 text-white flex items-center justify-center text-[10px] font-mono">1</span>
                SECTION 1: EVENT SUMMARY & HYDRO-METEOROLOGICAL TRIGGER
              </h3>
              <span className={`text-xs font-black uppercase px-2.5 py-0.5 rounded-full border ${
                incidentData.alertLevel === 'RED'
                  ? 'bg-red-600 text-white border-red-700'
                  : 'bg-amber-500 text-white border-amber-600'
              }`}>
                CODE {incidentData.alertLevel} ALERT // ACTIVE SURGE
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="md:col-span-2 space-y-2">
                <div>
                  <span className="font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px]">Event Classification:</span>
                  <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{incidentData.eventTitle}</p>
                </div>
                <div>
                  <span className="font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px]">Catchment / Glacial Trigger Dynamics:</span>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{incidentData.triggerDescription}</p>
                </div>
                <div className="flex flex-wrap gap-4 pt-1">
                  <div>
                    <span className="font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px]">River Basin:</span>
                    <p className="font-semibold text-blue-600 dark:text-blue-400">{incidentData.riverName}</p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px]">Geo Coordinates:</span>
                    <p className="font-mono text-slate-700 dark:text-slate-300">{incidentData.coordinates}</p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px]">Monitored Corridor:</span>
                    <p className="font-medium text-slate-700 dark:text-slate-300">{incidentData.sectorLocation}</p>
                  </div>
                </div>
              </div>

              {/* Water Level & Overflow Metric Pill */}
              <div className="bg-white dark:bg-slate-800 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                    Mandakini Overflow Ratio
                  </div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-black text-red-600 dark:text-red-400 font-mono">
                      {incidentData.overflowRatio}x
                    </span>
                    <span className="text-xs font-bold text-red-700 dark:text-red-300">
                      (+{incidentData.hflExceededMeters}m above Danger)
                    </span>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700 space-y-1 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Gauge Level:</span>
                    <span className="font-bold text-red-600">{incidentData.gaugeLevelMeters} m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Danger Mark (DL):</span>
                    <span className="font-medium">{incidentData.dangerLevelMeters} m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Warning Mark (WL):</span>
                    <span className="font-medium">{incidentData.warningLevelMeters} m</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: HYDROLOGICAL GROUND TRUTH */}
          <div className="ndma-section-box mb-6 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 avoid-break">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-xs sm:text-sm font-black tracking-wider uppercase text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-blue-600 text-white flex items-center justify-center text-[10px] font-mono">2</span>
                SECTION 2: HYDROLOGICAL GROUND TRUTH & KINETIC SENSOR TELEMETRY
              </h3>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                NASA GPM + SMAP + CWC TELEMETRIC ARRAY
              </span>
            </div>

            {/* Metric Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 mb-1">
                  <Droplets size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    NASA GPM Rainfall
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white">
                  {incidentData.rainfallRateMmH} <span className="text-xs font-normal text-slate-500">mm/h</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5 font-medium">3h Acc: {incidentData.rainfallAccumulated3h} mm</p>
              </div>

              <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 mb-1">
                  <Compass size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    SMAP Soil Saturation
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-black font-mono text-amber-600 dark:text-amber-400">
                  {incidentData.soilSaturationPct}%
                </div>
                <p className="text-[10px] text-red-600 dark:text-red-400 mt-0.5 font-semibold">Critical Runoff Risk</p>
              </div>

              <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 mb-1">
                  <Waves size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Manning Stream Velocity
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white">
                  {incidentData.streamVelocityMs} <span className="text-xs font-normal text-slate-500">m/s</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Q: ~{incidentData.dischargeM3s} m³/s</p>
              </div>

              <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 mb-1">
                  <Clock size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Peak Wave Arrival
                  </span>
                </div>
                <div className="text-base sm:text-lg font-black font-mono text-red-600 dark:text-red-400">
                  T+42 min
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Sonprayag ETA: 07:27 IST</p>
              </div>
            </div>

            {/* Kinetic Surge Wave Downstream Propagation Schedule */}
            <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700 text-xs">
              <span className="font-bold text-[10px] uppercase text-slate-500 dark:text-slate-400 tracking-wider block mb-2">
                Downstream Wave Arrival Vectors & Warning Horizons:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {incidentData.downstreamETAs.map((item, idx) => (
                  <div key={idx} className="p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                    <span className="font-semibold text-slate-900 dark:text-slate-200 text-[11px]">{item.point}</span>
                    <div className="flex items-center justify-between mt-1 text-[10px]">
                      <span className="font-mono text-blue-600 dark:text-blue-400">{item.eta}</span>
                      <span className="font-bold text-red-600 dark:text-red-400 uppercase">{item.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 3: RAPID DAMAGE & THREAT ASSESSMENT */}
          <div className="ndma-section-box mb-6 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 avoid-break">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-xs sm:text-sm font-black tracking-wider uppercase text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-blue-600 text-white flex items-center justify-center text-[10px] font-mono">3</span>
                SECTION 3: RAPID DAMAGE & THREAT ASSESSMENT
              </h3>
              <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300">
                FIELD VERIFIED: REVISED 06:45 IST
              </span>
            </div>

            {/* Key Damage Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 text-xs">
              <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Inundated Wards</span>
                <div className="text-2xl font-black text-red-600 font-mono mt-0.5">
                  {incidentData.inundatedWardsCount} <span className="text-xs font-normal text-slate-500">/ {incidentData.totalWardsCount}</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1 truncate" title={incidentData.inundatedWardsList}>
                  {incidentData.inundatedWardsList}
                </p>
              </div>

              <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Road & Culvert Breaches</span>
                <div className="text-2xl font-black text-amber-600 font-mono mt-0.5">
                  {incidentData.submergedCulvertsCount} <span className="text-xs font-normal text-slate-500">Culverts</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">NH-107 cut at km 38 & 52</p>
              </div>

              <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Population at Risk</span>
                <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-0.5">
                  {incidentData.populationAtRisk.toLocaleString()}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Demographic Census 2026</p>
              </div>

              <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Evacuated Headcount</span>
                <div className="text-2xl font-black text-emerald-600 font-mono mt-0.5">
                  {incidentData.evacuatedHeadcount.toLocaleString()}
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="flex-1 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${evacuationRate}%` }} />
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600">{evacuationRate}%</span>
                </div>
              </div>
            </div>

            {/* Critical Infrastructure Status Table */}
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <table className="ndma-table w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px]">
                  <tr>
                    <th className="py-2 px-3">Infrastructure Facility</th>
                    <th className="py-2 px-3">Sector</th>
                    <th className="py-2 px-3">Operational Status</th>
                    <th className="py-2 px-3">Tactical Impact & Directives</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {incidentData.criticalInfrastructure.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        {item.type === 'Aviation' && <Compass size={13} className="text-blue-500" />}
                        {item.type === 'Healthcare' && <HeartPulse size={13} className="text-red-500" />}
                        {item.type === 'Power Grid' && <Zap size={13} className="text-amber-500" />}
                        {item.type === 'Sanitation' && <Droplets size={13} className="text-cyan-500" />}
                        {item.type === 'Telecom' && <AlertCircle size={13} className="text-purple-500" />}
                        {item.name}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 font-mono text-[11px]">{item.type}</td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${
                          item.status.includes('Submerged') || item.status.includes('Tripped')
                            ? 'bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300 border-red-300 dark:border-red-800'
                            : item.status.includes('Partially') || item.status.includes('Degraded') || item.status.includes('Silted')
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                        {item.impact}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* PAGE BREAK HINT FOR PDF (clean 2-page print layout) */}
          <div className="page-break-always hidden print:block" />

          {/* SECTION 4: RESOURCE MOBILIZATION DIRECTIVE */}
          <div className="ndma-section-box mb-6 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 avoid-break">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-xs sm:text-sm font-black tracking-wider uppercase text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-blue-600 text-white flex items-center justify-center text-[10px] font-mono">4</span>
                SECTION 4: RESOURCE MOBILIZATION DIRECTIVE & ASSET READINESS
              </h3>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                ACTIVE DEPLOYMENT
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs mb-4">
              {/* NDRF / SDRF Force Matrix */}
              <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 mb-1">
                  <ShieldAlert size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Rescue Battalions
                  </span>
                </div>
                <p className="font-bold text-slate-900 dark:text-slate-100 text-[11px]">{incidentData.ndrfBattalions}</p>
                <p className="text-slate-600 dark:text-slate-400 text-[10px] mt-1">{incidentData.sdrfBattalions}</p>
                <p className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold mt-1">{incidentData.armySupport}</p>
              </div>

              {/* Dewatering Pumps */}
              <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400 mb-1">
                  <Truck size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Dewatering Fleet
                  </span>
                </div>
                <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                  {incidentData.dewateringPumpsCount} <span className="text-xs font-normal text-slate-500">Pumps</span>
                </div>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-1 leading-tight">
                  {incidentData.dewateringPumpsSpec}
                </p>
              </div>

              {/* Medical Triage & Beds */}
              <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 mb-1">
                  <HeartPulse size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Medical & ICU Triage
                  </span>
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {incidentData.mobileMedicalUnits} Mobile Trauma Units
                </div>
                <p className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                  {incidentData.icuBedsAvailable} ICU Beds Available <span className="text-slate-400 text-[10px]">({incidentData.icuBedsOccupied}/{incidentData.icuBedsTotal} Occupied)</span>
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
                  {incidentData.oxygenCylindersActive} Reserve O2 Cylinders
                </p>
              </div>

              {/* Relief Camps & Rations */}
              <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 mb-1">
                  <Tent size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Relief Camps & Food
                  </span>
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {incidentData.reliefCampsCount} Camps ({campUtilizationRate}% Utilized)
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  {incidentData.reliefCampsOccupancy.toLocaleString()} / {incidentData.reliefCampsCapacity.toLocaleString()} Sheltered
                </p>
                <p className="text-[10px] font-mono text-slate-700 dark:text-slate-300 font-semibold mt-0.5">
                  {incidentData.foodPacketsDistributed.toLocaleString()} Survival Ration Packets
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 5: AI-SYNTHESIZED INCIDENT BRIEFING (GPT-4o) */}
          <div className="ndma-section-box mb-6 p-4 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20 avoid-break">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-blue-200 dark:border-blue-900">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-blue-600 text-white flex items-center justify-center text-[10px] font-mono">5</span>
                <h3 className="text-xs sm:text-sm font-black tracking-wider uppercase text-slate-900 dark:text-white flex items-center gap-2">
                  SECTION 5: AI-SYNTHESIZED INCIDENT BRIEFING (GPT-4o INTELLIGENCE CORE)
                </h3>
              </div>
              <div className="no-print">
                <button
                  onClick={handleRegenerateAIBriefing}
                  disabled={isGeneratingBriefing}
                  className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-blue-700 dark:text-blue-300 bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-800 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-sm"
                >
                  <RefreshCw size={11} className={isGeneratingBriefing ? 'animate-spin' : ''} />
                  {isGeneratingBriefing ? 'Synthesizing...' : 'Regenerate Briefing'}
                </button>
              </div>
            </div>

            <div className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-sans p-3 bg-white dark:bg-slate-900/80 rounded-lg border border-blue-100 dark:border-blue-900/60 shadow-sm whitespace-pre-line">
              {incidentData.officerDirectives}
            </div>
          </div>

          {/* OFFICIAL COMMAND SIGN-OFF & VERIFICATION BLOCK */}
          <div className="border-t-2 border-slate-900 dark:border-slate-300 pt-5 mt-6 avoid-break">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
              {/* Authenticated Officer Details */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                  AUTHORIZING COMMANDING OFFICER:
                </span>
                <p className="text-base font-bold text-slate-900 dark:text-white">
                  {incidentData.officerName}
                </p>
                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                  {incidentData.officerDesignation}
                </p>
                <p className="text-[11px] text-slate-500 font-mono">
                  Official Security Badge ID: <strong>{incidentData.officerBadge}</strong>
                </p>
                <p className="text-[11px] text-slate-500">
                  Co-Signatory / Tactical Commander: <strong>{incidentData.incidentCommander}</strong>
                </p>
              </div>

              {/* Digital Seal & Timestamp Stamp */}
              <div className="sm:text-right flex flex-col justify-end space-y-1.5">
                <div className="inline-block sm:self-end border-2 border-slate-900 dark:border-slate-300 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 max-w-xs text-left sm:text-right">
                  <div className="text-[9px] uppercase font-bold text-slate-500 dark:text-slate-400">
                    DIGITALLY SIGNED & VERIFIED
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white uppercase">
                    DDMA RUDRAPRAYAG CONTROL
                  </div>
                  <div className="text-[10px] font-mono text-slate-600 dark:text-slate-400">
                    HASH: SHA256:7D49F91A...0E281BF
                  </div>
                  <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                    STATUS: RESTRICTED TRANSMISSION COMPLETE
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500">
                  Certified under Section 30 of Disaster Management Act, 2005 (Act No. 53 of 2005)
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: COMMAND INPUT & FIELD TELEMETRY EDITING FORM                       */}
      {/* ========================================================================= */}
      {activeTab === 'edit' && (
        <div className="no-print glass-card p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-8 bg-white/80 dark:bg-slate-900/80 shadow-lg">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <SlidersHorizontal className="text-blue-600" size={20} />
              Commanding Officer Input & Telemetry Adjustments
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Field commanders and district magistrates can update real-time telemetry, headcounts, damage observations, and directives. Changes immediately synchronize to the Official SITREP and export packages.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
            {/* Field: Event Details */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
              <h4 className="font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 text-[11px] flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-amber-500" /> Event & Classification
              </h4>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Incident ID</label>
                <input
                  type="text"
                  value={incidentData.id}
                  onChange={(e) => updateField('id', e.target.value)}
                  className="w-full text-xs font-mono px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Alert Level</label>
                <select
                  value={incidentData.alertLevel}
                  onChange={(e) => updateField('alertLevel', e.target.value)}
                  className="w-full text-xs font-bold px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  <option value="RED">RED // Critical Emergency</option>
                  <option value="ORANGE">ORANGE // Warning</option>
                  <option value="YELLOW">YELLOW // Watch</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Disaster Level</label>
                <input
                  type="text"
                  value={incidentData.disasterLevel}
                  onChange={(e) => updateField('disasterLevel', e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Catchment Trigger Description</label>
                <textarea
                  rows={3}
                  value={incidentData.triggerDescription}
                  onChange={(e) => updateField('triggerDescription', e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            {/* Field: Hydrological Sensors */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
              <h4 className="font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 text-[11px] flex items-center gap-1.5">
                <Droplets size={14} className="text-blue-500" /> Hydrological Telemetry
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Gauge Level (m)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={incidentData.gaugeLevelMeters}
                    onChange={(e) => updateField('gaugeLevelMeters', parseFloat(e.target.value) || 0)}
                    className="w-full text-xs font-mono px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Danger Mark (m)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={incidentData.dangerLevelMeters}
                    onChange={(e) => updateField('dangerLevelMeters', parseFloat(e.target.value) || 0)}
                    className="w-full text-xs font-mono px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">NASA GPM Rainfall (mm/h)</label>
                <input
                  type="number"
                  step="0.1"
                  value={incidentData.rainfallRateMmH}
                  onChange={(e) => updateField('rainfallRateMmH', parseFloat(e.target.value) || 0)}
                  className="w-full text-xs font-mono px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">SMAP Soil Saturation (%)</label>
                <input
                  type="number"
                  step="0.5"
                  value={incidentData.soilSaturationPct}
                  onChange={(e) => updateField('soilSaturationPct', parseFloat(e.target.value) || 0)}
                  className="w-full text-xs font-mono px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Manning Stream Velocity (m/s)</label>
                <input
                  type="number"
                  step="0.05"
                  value={incidentData.streamVelocityMs}
                  onChange={(e) => updateField('streamVelocityMs', parseFloat(e.target.value) || 0)}
                  className="w-full text-xs font-mono px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            {/* Field: Population & Damage Figures */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
              <h4 className="font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 text-[11px] flex items-center gap-1.5">
                <Users size={14} className="text-emerald-500" /> Demographics & Evacuation
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Population at Risk</label>
                  <input
                    type="number"
                    value={incidentData.populationAtRisk}
                    onChange={(e) => updateField('populationAtRisk', parseInt(e.target.value) || 0)}
                    className="w-full text-xs font-mono px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Evacuated Headcount</label>
                  <input
                    type="number"
                    value={incidentData.evacuatedHeadcount}
                    onChange={(e) => updateField('evacuatedHeadcount', parseInt(e.target.value) || 0)}
                    className="w-full text-xs font-mono px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Stranded Count</label>
                  <input
                    type="number"
                    value={incidentData.strandedHeadcount}
                    onChange={(e) => updateField('strandedHeadcount', parseInt(e.target.value) || 0)}
                    className="w-full text-xs font-mono px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Inundated Wards</label>
                  <input
                    type="number"
                    value={incidentData.inundatedWardsCount}
                    onChange={(e) => updateField('inundatedWardsCount', parseInt(e.target.value) || 0)}
                    className="w-full text-xs font-mono px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Submerged Culverts Count</label>
                <input
                  type="number"
                  value={incidentData.submergedCulvertsCount}
                  onChange={(e) => updateField('submergedCulvertsCount', parseInt(e.target.value) || 0)}
                  className="w-full text-xs font-mono px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Road Severance Summary</label>
                <input
                  type="text"
                  value={incidentData.roadCutoffsSummary}
                  onChange={(e) => updateField('roadCutoffsSummary', e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            {/* Field: Critical Infrastructure Status */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3 md:col-span-2">
              <h4 className="font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 text-[11px] flex items-center gap-1.5">
                <Building2 size={14} className="text-purple-500" /> Critical Infrastructure Status Control
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {incidentData.criticalInfrastructure.map((infra, idx) => (
                  <div key={idx} className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1.5">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-slate-900 dark:text-slate-100">{infra.name}</span>
                      <span className="text-[10px] font-mono text-slate-400">{infra.type}</span>
                    </div>
                    <select
                      value={infra.status}
                      onChange={(e) => updateInfraStatus(idx, e.target.value)}
                      className="w-full text-xs font-semibold px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200 cursor-pointer"
                    >
                      <option value="Submerged / Non-Operational">Submerged / Non-Operational</option>
                      <option value="Partially Flooded">Partially Flooded</option>
                      <option value="Tripped / Offline">Tripped / Offline</option>
                      <option value="Degraded / Battery Power">Degraded / Battery Power</option>
                      <option value="Fully Operational">Fully Operational</option>
                      <option value="Monitoring Alert">Monitoring Alert</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Field: Officer Sign-Off & Remarks */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
              <h4 className="font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 text-[11px] flex items-center gap-1.5">
                <ShieldAlert size={14} className="text-blue-600" /> Officer Sign-Off Block
              </h4>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Commanding Officer Name</label>
                <input
                  type="text"
                  value={incidentData.officerName}
                  onChange={(e) => updateField('officerName', e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Designation & Jurisdiction</label>
                <input
                  type="text"
                  value={incidentData.officerDesignation}
                  onChange={(e) => updateField('officerDesignation', e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Security Badge ID</label>
                <input
                  type="text"
                  value={incidentData.officerBadge}
                  onChange={(e) => updateField('officerBadge', e.target.value)}
                  className="w-full text-xs font-mono px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tactical Directives / DM Remarks</label>
                <textarea
                  rows={4}
                  value={incidentData.officerDirectives}
                  onChange={(e) => updateField('officerDirectives', e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={() => {
                setActiveTab('sitrep');
                toast.success('Form changes saved to SITREP view');
              }}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check size={14} /> Save & Preview Official SITREP
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: INTER-AGENCY RAW DATA PACKAGE (JSON / CSV VIEW)                    */}
      {/* ========================================================================= */}
      {activeTab === 'export' && (
        <div className="no-print glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 bg-white/80 dark:bg-slate-900/80">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileSpreadsheet className="text-emerald-600" size={18} />
                Inter-Agency Data Package (NDMA / CAP / CWC Standard)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Machine-readable JSON and CSV format for integration with Ministry of Home Affairs (MHA), National Emergency Response Centre (NERC), and Armed Forces Command.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCopyJson}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 cursor-pointer"
              >
                {copiedJson ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                {copiedJson ? 'Copied' : 'Copy JSON'}
              </button>
              <button
                onClick={handleExportJSON}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm cursor-pointer"
              >
                <Download size={13} /> Download .JSON
              </button>
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm cursor-pointer"
              >
                <Download size={13} /> Download .CSV
              </button>
            </div>
          </div>

          <div className="bg-slate-950 text-slate-200 font-mono text-[11px] p-4 rounded-xl max-h-96 overflow-y-auto border border-slate-800">
            <pre className="whitespace-pre-wrap">{JSON.stringify(incidentData, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
export default NDMAReportBuilder;
