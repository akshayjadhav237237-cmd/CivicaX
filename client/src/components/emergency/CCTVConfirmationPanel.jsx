import { Eye, ShieldAlert } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';

export default function CCTVConfirmationPanel({ alertLevel }) {
  const isDanger = alertLevel === 'orange' || alertLevel === 'red';
  
  const cameras = [
    { id: 'CAM-01', label: 'CAM-01 — Market Bridge', status: 'normal', text: 'No anomaly detected' },
    { id: 'CAM-02', label: 'CAM-02 — River Bank', status: 'warning', text: 'Water level rising' },
    { id: 'CAM-03', label: 'CAM-03 — Main Highway', status: 'normal', text: 'No anomaly detected' },
    { id: 'CAM-04', label: 'CAM-04 — Valley Entry', status: isDanger ? 'critical' : 'normal', text: isDanger ? 'Flood detected' : 'No anomaly detected' }
  ];

  return (
    <GlassCard padding="p-5" className="flex flex-col gap-4">
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        <Eye size={18} className="text-indigo-500" />
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100" style={{ fontFamily: 'var(--font-heading)' }}>
          Visual Sentry — CCTV Intelligence
        </h3>
      </div>

      {/* 2x2 Camera Grid */}
      <div className="grid grid-cols-2 gap-4">
        {cameras.map(cam => {
          let dotColor = 'bg-green-500';
          if (cam.status === 'warning') dotColor = 'bg-amber-500';
          if (cam.status === 'critical') dotColor = 'bg-red-500 animate-pulse';

          return (
            <div key={cam.id} className="relative aspect-video rounded-xl bg-slate-950/70 border border-white/5 flex flex-col justify-between p-3 overflow-hidden shadow-inner group">
              {/* Pulsing Live badge */}
              <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-md text-[10px] font-bold text-white uppercase tracking-wider">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                Live
              </div>

              <div className="flex-1 flex items-center justify-center">
                <Eye size={32} className="text-white/20 group-hover:text-white/40 transition-colors" />
              </div>

              <div className="w-full flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-300 truncate">{cam.label}</span>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                  <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
                  {cam.text}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Connection Info Banner */}
      <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 p-3.5 rounded-xl flex items-start gap-2.5">
        <ShieldAlert size={18} className="text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800 dark:text-amber-400 leading-relaxed">
          This module requires connection to government CCTV infrastructure. Connect real RTSP camera stream URLs in the backend config to activate live feeds. The YOLO11 computer vision model processes feeds server-side.
        </p>
      </div>

      {/* Summary Analytics */}
      <div className="flex justify-between items-center text-xs border-t border-white/5 pt-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-slate-400">Last 30 min crowd danger:</span>
          <span className="font-bold text-slate-700 dark:text-slate-200">{isDanger ? '14 people' : '0 people'}</span>
        </div>
        <span className="text-[10px] text-slate-400 italic">CCTV Person Detection (Demo Mode)</span>
      </div>

      {/* Visual Confirmation Status */}
      <div className="flex items-center justify-between border-t border-white/5 pt-3 text-xs">
        <span className="text-slate-400">Flood Status:</span>
        <div className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${isDanger ? 'bg-red-500 animate-pulse' : 'bg-amber-500'}`} />
          <span className={`font-bold uppercase tracking-wider ${isDanger ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
            {isDanger ? 'Flood Visually Confirmed' : 'Awaiting Visual Confirmation'}
          </span>
        </div>
      </div>
    </GlassCard>
  );
}
