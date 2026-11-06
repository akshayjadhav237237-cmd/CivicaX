import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  Pause,
  RotateCcw,
  Zap,
  Minimize2,
  X,
  Volume2,
  VolumeX,
  Radio,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  Waves,
  Satellite,
  Compass,
  FileSpreadsheet,
  CheckCircle2,
  Flame,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useSimulationStore, SIMULATION_STAGES } from '../../stores/simulationStore';
import { useTranslation } from '../../i18n';

export function CrisisSimulatorModal() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    isOpen,
    isMinimized,
    isRunning,
    isPaused,
    seconds,
    speed,
    currentStageIndex,
    telemetry,
    closeSimulator,
    minimizeSimulator,
    maximizeSimulator,
    startSimulation,
    pauseSimulation,
    resumeSimulation,
    resetSimulation,
    jumpToStage,
    setSpeed,
  } = useSimulationStore();

  const [isAudioEnabled, setIsAudioEnabled] = useState(false);

  if (!isOpen && !isMinimized && !isRunning) return null;

  // Speak bilingual broadcast using browser speech synthesis
  const handlePlayVoiceAlert = (lang = 'en') => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const enText =
      'Emergency Flash Flood Alert. Mandakini River water level has exceeded the danger mark by 3.8 meters. High velocity flood surge incoming. Immediate mandatory evacuation ordered to Upper Helipad Ridge Safe Zone.';
    const hiText =
      'आपदा चेतावनी। मंदाकिनी नदी का जलस्तर खतरे के निशान से 3.8 मीटर ऊपर पहुंच गया है। सभी श्रद्धालु और नागरिक तुरंत ऊपरी हेलीपैड सुरक्षित शिविर की ओर प्रस्थान करें।';

    const utterance = new SpeechSynthesisUtterance(lang === 'hi' ? hiText : enText);
    utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-US';
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const progressPct = Math.min(100, (seconds / 60) * 100);
  const currentStage = SIMULATION_STAGES[currentStageIndex];

  // -------------------------------------------------------------------------
  // Floating Minimized Bar (Allows Evaluator to explore live pages)
  // -------------------------------------------------------------------------
  if (isMinimized) {
    return (
      <div className="fixed bottom-5 right-5 z-[9999] flex items-center gap-3 p-3 rounded-2xl bg-slate-900/95 text-white border border-red-500/50 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-5">
        <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-red-600/30 border border-red-500 text-red-400">
          <Zap size={18} className="animate-pulse" />
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
          </span>
        </div>

        <div className="flex flex-col min-w-[170px]">
          <div className="flex items-center justify-between text-[11px] font-bold">
            <span className="text-red-400 uppercase tracking-wider">
              {isRunning ? `Stage ${currentStageIndex + 1}/5` : 'Simulation Ready'}
            </span>
            <span className="text-slate-300 font-mono">
              {Math.floor(seconds)}s / 60s
            </span>
          </div>
          <div className="text-xs font-semibold text-slate-100 truncate max-w-[190px]">
            {currentStage?.title}
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
            <div
              className="bg-red-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 ml-2 border-l border-slate-700/80 pl-2.5">
          {isRunning ? (
            isPaused ? (
              <button
                onClick={resumeSimulation}
                className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                title="Resume"
              >
                <Play size={14} />
              </button>
            ) : (
              <button
                onClick={pauseSimulation}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                title="Pause"
              >
                <Pause size={14} />
              </button>
            )
          ) : (
            <button
              onClick={startSimulation}
              className="p-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors"
              title="Start"
            >
              <Play size={14} />
            </button>
          )}

          <button
            onClick={maximizeSimulator}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            title="Expand Console"
          >
            <Sparkles size={14} />
          </button>

          <button
            onClick={resetSimulation}
            className="p-1.5 rounded-lg hover:bg-red-950/60 text-slate-400 hover:text-red-400 transition-colors"
            title="Stop & Reset"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Full Evaluator HUD Console Modal
  // -------------------------------------------------------------------------
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl bg-slate-900 border border-slate-800 text-white shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Glow backdrop header */}
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-red-600/20 via-blue-600/10 to-transparent pointer-events-none" />

        {/* Modal Header */}
        <div className="relative z-10 flex items-start sm:items-center justify-between p-5 border-b border-slate-800/90 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center flex-shrink-0">
              <Zap size={22} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-red-400">
                  Evaluator Autonomous Demo Mode
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-500/20 text-red-300 border border-red-500/30">
                  2013 Kedarnath Benchmark
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                60-Second Closed-Loop Crisis Simulation
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={minimizeSimulator}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Minimize to floating pill and navigate app"
            >
              <Minimize2 size={16} />
            </button>
            <button
              onClick={closeSimulator}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Close modal"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Progress Bar & Big Timing Header */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="text-3xl font-extrabold tracking-tight font-mono text-white">
                {String(Math.floor(seconds)).padStart(2, '0')}:
                {String(Math.floor((seconds % 1) * 10)).padStart(2, '0')}s
              </div>
              <div className="text-xs text-slate-400">
                <div>Duration: 60 Seconds</div>
                <div className="text-slate-300 font-medium">
                  {isRunning ? (isPaused ? 'Paused' : 'Surge Wave Active') : 'Standby / Ready'}
                </div>
              </div>
            </div>

            {/* Play/Pause/Reset Controls */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {/* Speed Buttons */}
              <div className="inline-flex rounded-lg bg-slate-900 border border-slate-800 p-0.5 text-xs">
                {[1, 2, 4].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    className={`px-2 py-1 rounded-md font-semibold transition-colors ${
                      speed === s
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {s}x ({60 / s}s)
                  </button>
                ))}
              </div>

              {!isRunning ? (
                <button
                  onClick={startSimulation}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-lg shadow-red-600/30 flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95"
                >
                  <Play size={14} fill="currentColor" />
                  <span>Start 60s Simulation</span>
                </button>
              ) : isPaused ? (
                <button
                  onClick={resumeSimulation}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Play size={14} fill="currentColor" />
                  <span>Resume</span>
                </button>
              ) : (
                <button
                  onClick={pauseSimulation}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Pause size={14} fill="currentColor" />
                  <span>Pause</span>
                </button>
              )}

              <button
                onClick={resetSimulation}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Reset simulation"
              >
                <RotateCcw size={15} />
              </button>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium text-slate-400">
              <span>Simulation Progress ({Math.round(progressPct)}%)</span>
              <span className="text-red-400 font-semibold">{currentStage?.title}</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 via-amber-500 to-red-500 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Real-time Dynamic Telemetry Dials */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                NASA GPM Rain
              </div>
              <div className="text-lg sm:text-xl font-bold font-mono text-blue-400 mt-1">
                {telemetry.rainfall.toFixed(1)} <span className="text-xs text-slate-400 font-sans">mm/h</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Catchment Cloudburst</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                SMAP Soil Saturation
              </div>
              <div className="text-lg sm:text-xl font-bold font-mono text-amber-400 mt-1">
                {telemetry.soilSaturation.toFixed(1)}%
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">AMC III Runoff Bound</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Manning Velocity
              </div>
              <div className="text-lg sm:text-xl font-bold font-mono text-red-400 mt-1">
                {telemetry.velocity.toFixed(2)} <span className="text-xs text-slate-400 font-sans">m/s</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Supercritical Flow</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                River Capacity
              </div>
              <div className="text-lg sm:text-xl font-bold font-mono text-purple-400 mt-1">
                {telemetry.riverCap}%
              </div>
              <div className="text-[10px] text-red-400 font-semibold mt-0.5">
                {telemetry.riverCap > 100 ? `BREACH (+${telemetry.gaugeRiseM}m)` : 'Channel Normal'}
              </div>
            </div>
          </div>

          {/* 5-Stage Stepper of Autonomous Loop */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                5-Step Autonomous Loop Walkthrough
              </h3>
              <span className="text-[11px] text-slate-500">
                Click any stage below to jump immediately
              </span>
            </div>

            <div className="space-y-2">
              {SIMULATION_STAGES.map((stg, idx) => {
                const isCurrent = currentStageIndex === idx;
                const isPassed = currentStageIndex > idx;

                return (
                  <div
                    key={stg.id}
                    onClick={() => jumpToStage(idx)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-slate-800/90 border-blue-500/80 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/40'
                        : isPassed
                        ? 'bg-slate-950/50 border-slate-800 hover:border-slate-700 opacity-80'
                        : 'bg-slate-950/30 border-slate-800/50 hover:border-slate-700 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
                            isCurrent
                              ? 'bg-blue-600 text-white animate-pulse'
                              : isPassed
                              ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/40'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {isPassed ? <CheckCircle2 size={15} /> : idx + 1}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-white">
                              {stg.title}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-400">
                              ({stg.timeRange})
                            </span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${stg.badgeColor}`}>
                              {stg.tier}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                            {stg.description}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5 font-normal">
                            {stg.descriptionHi}
                          </p>
                        </div>
                      </div>

                      <div className="text-slate-500 flex-shrink-0">
                        <ChevronRight size={16} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bilingual Alert Audio / Text Simulation Box */}
          <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
                <Radio size={14} className="text-purple-400 animate-pulse" />
                <span>Bilingual Public Broadcast Preview (CAP Standard)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePlayVoiceAlert('en')}
                  className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Volume2 size={13} />
                  <span>Audio (EN)</span>
                </button>
                <button
                  onClick={() => handlePlayVoiceAlert('hi')}
                  className="px-2.5 py-1 rounded-lg bg-purple-700 hover:bg-purple-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Volume2 size={13} />
                  <span>Audio (हिन्दी)</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 space-y-1">
                <div className="text-[10px] font-bold text-purple-400 uppercase">
                  English Alert Feed
                </div>
                <p className="text-slate-200 leading-relaxed font-medium">
                  🚨 <span className="font-bold">CRITICAL WARNING:</span> Mandakini River water level +3.8m above Danger Mark. Breaches confirmed at Riverfront Ghat. Immediate evacuation ordered to Upper Helipad Ridge Safe Haven.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 space-y-1">
                <div className="text-[10px] font-bold text-purple-400 uppercase">
                  हिंदी आपातकालीन सूचना
                </div>
                <p className="text-slate-200 leading-relaxed font-medium">
                  🚨 <span className="font-bold">अत्यंत गंभीर चेतावनी:</span> मंदाकिनी नदी का जलस्तर खतरे के निशान से 3.8 मीटर ऊपर पहुंचा। रिवरफ्रंट घाट जलमग्न। सभी नागरिक तुरंत ऊपरी हेलीपैड सुरक्षित शिविर की ओर जाएं।
                </p>
              </div>
            </div>
          </div>

          {/* Quick Evaluator Action Links to Live Pages */}
          <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-slate-400 font-medium">
              Inspect live system modules during simulation:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  minimizeSimulator();
                  navigate('/evacuation');
                }}
                className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Compass size={13} />
                <span>Open Evacuation Router</span>
              </button>

              <button
                onClick={() => {
                  minimizeSimulator();
                  navigate('/damage-assessment');
                }}
                className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <FileSpreadsheet size={13} />
                <span>Open NDMA Dossier</span>
              </button>

              <button
                onClick={() => {
                  minimizeSimulator();
                  navigate('/satellite');
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Satellite size={13} />
                <span>View MODIS Satellite</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
