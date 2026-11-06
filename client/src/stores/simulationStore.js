import { create } from 'zustand';
import { useAlertStore } from './alertStore';
import toast from 'react-hot-toast';

export const SIMULATION_STAGES = [
  {
    id: 0,
    key: 'nasa_gpm_surge',
    title: 'NASA GPM Satellite Surge',
    titleHi: 'नासा जीपीएम उपग्रह से अतिवृष्टि का पता',
    timeRange: '0s – 12s',
    description: 'Orbital microwave radar detects localized 142 mm/h cloudburst over Chorabari catchment. Soil saturation escalates to 94.8%.',
    descriptionHi: 'चोराबाड़ी जलग्रहण क्षेत्र में 142 मिमी/घंटा का तीव्र बादल फटना दर्ज। मिट्टी की संतृप्ति 94.8% तक बढ़ी।',
    tier: 'CRITICAL',
    badgeColor: 'bg-red-500 text-white',
    telemetry: {
      rainfall: 142.0,
      soilSaturation: 94.8,
      velocity: 4.2,
      discharge: 1240,
      riverCap: 112,
      gaugeRiseM: 1.8,
    },
  },
  {
    id: 1,
    key: 'manning_hydraulic_spike',
    title: "Manning's Velocity Spike & Channel Breach",
    titleHi: 'मैनिंग हाइड्रोलिक वेग वृद्धि एवं जलप्रपात उल्लंघन',
    timeRange: '12s – 24s',
    description: "Manning's open-channel formula confirms supercritical torrent: velocity spikes to 9.56 m/s with 2,840 m³/s discharge, breaching Mandakini Ghat.",
    descriptionHi: 'मैनिंग समीकरण के अनुसार प्रवाह वेग 9.56 मी/से और जल निकासी 2,840 घन मी/से तक पहुंची। मंदाकिनी घाट पर जल स्तर खतरे से ऊपर।',
    tier: 'EMERGENCY',
    badgeColor: 'bg-red-600 text-white animate-pulse',
    telemetry: {
      rainfall: 142.0,
      soilSaturation: 96.2,
      velocity: 9.56,
      discharge: 2840,
      riverCap: 142,
      gaugeRiseM: 3.8,
    },
  },
  {
    id: 2,
    key: 'evacuation_detour_routing',
    title: 'Interactive Evacuation Router Engaged',
    titleHi: 'सुरक्षित बचाव मार्ग स्वचालित गणना (डायवर्जन)',
    timeRange: '24s – 36s',
    description: 'Mandakini Riverfront & Rambara bridge flagged impassable. Autonomous routing calculates high-elevation ridge contour corridor to Upper Helipad.',
    descriptionHi: 'मंदाकिनी रिवरफ्रंट और रामबाड़ा पुल जलमग्न। सुरक्षित बचाव एल्गोरिदम ने ऊपरी हेलीपैड रिज की ओर वैकल्पिक सुरक्षित मार्ग बनाया।',
    tier: 'EVACUATION',
    badgeColor: 'bg-emerald-600 text-white',
    telemetry: {
      rainfall: 135.0,
      soilSaturation: 95.0,
      velocity: 8.8,
      discharge: 2600,
      riverCap: 135,
      gaugeRiseM: 3.5,
    },
  },
  {
    id: 3,
    key: 'ndma_dossier_compilation',
    title: 'NDMA Situation Report & Damage Dossier',
    titleHi: 'एनडीएमए आपदा स्थिति रिपोर्ट एवं क्षति दस्तावेज',
    timeRange: '36s – 48s',
    description: 'Real-time casualty & damage dossier compiled: 6 inundated wards, 9,480 citizens evacuated, 16 dewatering pumps and 4 NDRF battalions mobilized.',
    descriptionHi: 'वास्तविक समय क्षति आकलन: 6 वार्ड जलमग्न, 9,480 नागरिक सुरक्षित निकाले गए, 16 उच्च क्षमता पंप व 4 एनडीआरएफ टीमें तैनात।',
    tier: 'SITREP READY',
    badgeColor: 'bg-blue-600 text-white',
    telemetry: {
      rainfall: 110.0,
      soilSaturation: 92.5,
      velocity: 7.2,
      discharge: 2100,
      riverCap: 122,
      gaugeRiseM: 2.9,
    },
  },
  {
    id: 4,
    key: 'bilingual_alerts_broadcast',
    title: 'Bilingual CAP Broadcast (English & हिन्दी)',
    titleHi: 'द्विभाषी नागरिक चेतावनी प्रसारण (अंग्रेजी व हिन्दी)',
    timeRange: '48s – 60s',
    description: 'Dual-language mobile push, SMS, and acoustic sirens broadcast across Kedarnath Basin with immediate life-safety evacuation directions.',
    descriptionHi: 'केदारनाथ घाटी में मोबाइल एसएमएस, पुश नोटिफिकेशन व सायरन द्वारा अंग्रेजी और हिंदी में आपातकालीन चेतावनी प्रसारित।',
    tier: 'BROADCASTING',
    badgeColor: 'bg-purple-600 text-white',
    telemetry: {
      rainfall: 85.0,
      soilSaturation: 89.0,
      velocity: 5.5,
      discharge: 1650,
      riverCap: 108,
      gaugeRiseM: 2.1,
    },
  },
];

export const useSimulationStore = create((set, get) => ({
  isOpen: false,
  isMinimized: false,
  isRunning: false,
  isPaused: false,
  seconds: 0,
  speed: 1, // 1 = 60s, 2 = 30s, 4 = 15s
  currentStageIndex: 0,
  timerRef: null,

  // Live Simulated Telemetry
  telemetry: {
    rainfall: 18.4,
    soilSaturation: 42.0,
    velocity: 2.1,
    discharge: 85,
    riverCap: 48,
    gaugeRiseM: 0.2,
    alertLevel: 'green',
  },

  openSimulator: () => set({ isOpen: true, isMinimized: false }),
  closeSimulator: () => set({ isOpen: false }),
  minimizeSimulator: () => set({ isMinimized: true }),
  maximizeSimulator: () => set({ isMinimized: false, isOpen: true }),

  setSpeed: (speed) => set({ speed }),

  startSimulation: () => {
    const { timerRef } = get();
    if (timerRef) clearInterval(timerRef);

    set({
      isRunning: true,
      isPaused: false,
      seconds: 0,
      currentStageIndex: 0,
      isOpen: true,
      isMinimized: false,
      telemetry: {
        rainfall: 45.0,
        soilSaturation: 65.0,
        velocity: 3.5,
        discharge: 350,
        riverCap: 68,
        gaugeRiseM: 0.8,
        alertLevel: 'yellow',
      },
    });

    toast('⚡ Evaluator Crisis Simulation Started: 2013 Kedarnath Benchmark', {
      icon: '🌩️',
      duration: 4000,
      style: { background: '#1E293B', color: '#F8FAFC', border: '1px solid #3B82F6' },
    });

    get().runTimer();
  },

  pauseSimulation: () => {
    const { timerRef } = get();
    if (timerRef) clearInterval(timerRef);
    set({ isPaused: true, timerRef: null });
  },

  resumeSimulation: () => {
    set({ isPaused: false });
    get().runTimer();
  },

  resetSimulation: () => {
    const { timerRef } = get();
    if (timerRef) clearInterval(timerRef);

    // Reset alertStore if modified
    try {
      const alertStore = useAlertStore.getState();
      alertStore.fetchActiveAlerts?.();
    } catch (_) {}

    set({
      isRunning: false,
      isPaused: false,
      seconds: 0,
      currentStageIndex: 0,
      timerRef: null,
      telemetry: {
        rainfall: 18.4,
        soilSaturation: 42.0,
        velocity: 2.1,
        discharge: 85,
        riverCap: 48,
        gaugeRiseM: 0.2,
        alertLevel: 'green',
      },
    });

    toast.success('Simulation reset to live baseline telemetry.');
  },

  jumpToStage: (stageIndex) => {
    const targetSeconds = stageIndex * 12;
    set({
      currentStageIndex: stageIndex,
      seconds: targetSeconds,
    });
    get().applyStageEffects(stageIndex);
  },

  runTimer: () => {
    const intervalMs = 250; // update 4 times a second for silky smooth telemetry
    const timer = setInterval(() => {
      const { seconds, speed, isPaused, isRunning } = get();
      if (isPaused || !isRunning) return;

      const increment = (intervalMs / 1000) * speed;
      const nextSeconds = seconds + increment;

      if (nextSeconds >= 60) {
        clearInterval(timer);
        set({
          seconds: 60,
          currentStageIndex: 4,
          isRunning: false,
          timerRef: null,
        });
        toast.success('🎉 60-Second Autonomous Crisis Simulation Loop Completed!', {
          duration: 6000,
          icon: '✅',
        });
        return;
      }

      const stageIdx = Math.min(4, Math.floor(nextSeconds / 12));
      const prevStage = get().currentStageIndex;

      // Stage transition detection
      if (stageIdx !== prevStage) {
        set({ currentStageIndex: stageIdx });
        get().applyStageEffects(stageIdx);
      }

      // Smoothly interpolate telemetry within the stage
      const currentStageObj = SIMULATION_STAGES[stageIdx];
      const targetTelemetry = currentStageObj.telemetry;
      const prevTelemetry = stageIdx > 0 ? SIMULATION_STAGES[stageIdx - 1].telemetry : {
        rainfall: 25.0,
        soilSaturation: 45.0,
        velocity: 2.5,
        discharge: 120,
        riverCap: 50,
        gaugeRiseM: 0.3,
      };

      const stageProgress = (nextSeconds % 12) / 12;
      const lerp = (start, end, t) => Number((start + (end - start) * t).toFixed(1));

      set({
        seconds: Number(nextSeconds.toFixed(1)),
        telemetry: {
          rainfall: lerp(prevTelemetry.rainfall, targetTelemetry.rainfall, stageProgress),
          soilSaturation: lerp(prevTelemetry.soilSaturation, targetTelemetry.soilSaturation, stageProgress),
          velocity: lerp(prevTelemetry.velocity, targetTelemetry.velocity, stageProgress),
          discharge: Math.round(lerp(prevTelemetry.discharge, targetTelemetry.discharge, stageProgress)),
          riverCap: Math.round(lerp(prevTelemetry.riverCap, targetTelemetry.riverCap, stageProgress)),
          gaugeRiseM: lerp(prevTelemetry.gaugeRiseM, targetTelemetry.gaugeRiseM, stageProgress),
          alertLevel: stageIdx >= 1 ? 'red' : stageIdx === 0 ? 'orange' : 'green',
        },
      });
    }, intervalMs);

    set({ timerRef: timer });
  },

  applyStageEffects: (stageIdx) => {
    const stage = SIMULATION_STAGES[stageIdx];
    if (!stage) return;

    if (stageIdx === 0) {
      toast.error('🛰️ [STAGE 1] NASA GPM: 142 mm/h Cloudburst Detected! Alert: CRITICAL', {
        duration: 4000,
      });
      // Inject alert into alert store
      try {
        useAlertStore.getState().addAlert?.({
          id: 'sim-gpm-001',
          level: 'red',
          title: 'SIMULATED CRISIS: Extreme 142 mm/h Cloudburst in Chorabari Catchment',
          description: 'Orbital microwave radar confirms sudden precipitation surge. Soil moisture 94.8% saturated. High kinetic momentum runoff imminent.',
          location: 'Mandakini Basin, Kedarnath',
          isActive: true,
          createdAt: new Date().toISOString(),
        });
      } catch (_) {}
    } else if (stageIdx === 1) {
      toast.error("🌊 [STAGE 2] Manning Spike: Velocity 9.56 m/s! Discharge 2,840 m³/s — Breach!", {
        duration: 4000,
      });
      try {
        useAlertStore.getState().updateZoneLevel?.('zone-mandakini-ghat-001', 'red');
      } catch (_) {}
    } else if (stageIdx === 2) {
      toast.success('🧭 [STAGE 3] Evacuation Router: Mandakini Breach Avoided. Ridge Detour Generated!', {
        duration: 4500,
        icon: '🛡️',
      });
    } else if (stageIdx === 3) {
      toast('📋 [STAGE 4] NDMA SITREP Compiled: 6 Wards Impacted, 9,480 Evacuated', {
        duration: 4000,
        icon: '📑',
        style: { background: '#1E3A8A', color: '#fff' },
      });
    } else if (stageIdx === 4) {
      toast('📢 [STAGE 5] Dual-Language CAP Emergency Alert Broadcasted (EN + हिन्दी)', {
        duration: 5000,
        icon: '🚨',
        style: { background: '#581C87', color: '#fff' },
      });
    }
  },
}));
