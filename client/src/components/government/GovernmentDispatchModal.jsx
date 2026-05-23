import { useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { GlassModal } from '../ui/GlassModal';
import { GlassButton } from '../ui/GlassButton';
import { GlassInput } from '../ui/GlassInput';
import { Ambulance, Shield, Flame, Wrench, HeartPulse, Waves, Loader2, MapPin } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';

const SERVICE_TYPES = [
  { id: 'ambulance',    label: 'Ambulance',     icon: Ambulance,    color: 'bg-red-100 text-red-700 border-red-300' },
  { id: 'police',       label: 'Police',        icon: Shield,       color: 'bg-blue-100 text-blue-700 border-blue-300' },
  { id: 'fire',         label: 'Fire Brigade',  icon: Flame,        color: 'bg-orange-100 text-orange-700 border-orange-300' },
  { id: 'rescue',       label: 'Rescue Team',   icon: Wrench,       color: 'bg-green-100 text-green-700 border-green-300' },
  { id: 'medical',      label: 'Medical Unit',  icon: HeartPulse,   color: 'bg-purple-100 text-purple-700 border-purple-300' },
  { id: 'flood_rescue', label: 'Flood Rescue',  icon: Waves,        color: 'bg-cyan-100 text-cyan-700 border-cyan-300' },
];

function MapPinSelector({ onPin }) {
  useMapEvents({
    click(e) { onPin(e.latlng); }
  });
  return null;
}

export function GovernmentDispatchModal({ isOpen, onClose, sourceEvent = null, onSuccess }) {
  const [form, setForm] = useState({
    serviceType: '',
    quantity: 1,
    priority: 'standard',
    notes: '',
    destinationLat: sourceEvent?.latitude || 18.7557,
    destinationLng: sourceEvent?.longitude || 73.4091,
    destinationLabel: sourceEvent?.title || '',
  });
  const [pinPosition, setPinPosition] = useState(
    sourceEvent?.latitude
      ? [sourceEvent.latitude, sourceEvent.longitude]
      : [18.7557, 73.4091]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const mapRef = useRef(null);

  const handlePin = (latlng) => {
    setPinPosition([latlng.lat, latlng.lng]);
    setForm(f => ({ ...f, destinationLat: latlng.lat, destinationLng: latlng.lng }));
  };

  const handleSubmit = async () => {
    if (!form.serviceType) {
      toast.error('Please select a service type');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        serviceType: form.serviceType,
        quantity: Number(form.quantity),
        destinationLat: form.destinationLat,
        destinationLng: form.destinationLng,
        destinationLabel: form.destinationLabel || undefined,
        priority: form.priority,
        notes: form.notes || undefined,
        satelliteEventId: sourceEvent?.id || undefined,
      };
      const res = await api.post('/government/dispatch', payload);
      if (res.data?.success) {
        toast.success(res.data.message || 'Dispatch confirmed');
        if (onSuccess) onSuccess(res.data.data);
      }
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Dispatch failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <GlassModal isOpen={isOpen} onClose={onClose} title="🚨 Emergency Service Dispatch">
      <div className="space-y-5 max-h-[80vh] overflow-y-auto pr-1">
        {sourceEvent && (
          <div className="glass-card p-3 bg-orange-50/60 border-orange-200 text-xs text-orange-700">
            <strong>Linked to:</strong> {sourceEvent.title}
          </div>
        )}

        {/* Service Type Grid */}
        <div>
          <p className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Service Type</p>
          <div className="grid grid-cols-3 gap-2">
            {SERVICE_TYPES.map(s => {
              const Ic = s.icon;
              return (
                <button
                  key={s.id}
                  onClick={() => setForm(f => ({ ...f, serviceType: s.id }))}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center ${
                    form.serviceType === s.id
                      ? `${s.color} border-current shadow-sm scale-105`
                      : 'bg-white/40 border-transparent text-slate-500 hover:bg-white/60'
                  }`}
                >
                  <Ic size={20}/>
                  <span className="text-xs font-medium">{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quantity + Priority */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Units to Deploy</label>
            <input
              type="number" min="1" max="500"
              value={form.quantity}
              onChange={e => setForm(f => ({ ...f, quantity: Math.max(1, Number(e.target.value)) }))}
              className="glass-input w-full text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Priority</label>
            <select
              value={form.priority}
              onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
              className="glass-input w-full text-sm"
            >
              <option value="immediate">🔴 Immediate</option>
              <option value="high">🟠 High</option>
              <option value="standard">🟢 Standard</option>
            </select>
          </div>
        </div>

        {/* Destination Label */}
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">Destination</label>
          <input
            type="text"
            placeholder="e.g. Zone Gamma — Bushi Dam area"
            value={form.destinationLabel}
            onChange={e => setForm(f => ({ ...f, destinationLabel: e.target.value }))}
            className="glass-input w-full text-sm"
          />
        </div>

        {/* Map Pin Selector */}
        <div>
          <p className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1">
            <MapPin size={12}/> Click map to set destination
          </p>
          <div className="h-44 rounded-xl overflow-hidden border border-white/30">
            <MapContainer
              center={pinPosition}
              zoom={12}
              style={{ height: '100%', width: '100%' }}
              ref={mapRef}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
              <MapPinSelector onPin={handlePin}/>
              {pinPosition && <Marker position={pinPosition}/>}
            </MapContainer>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            📍 {form.destinationLat.toFixed(4)}°N, {form.destinationLng.toFixed(4)}°E
          </p>
        </div>

        {/* Notes */}
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">Operational Notes (optional)</label>
          <textarea
            rows={2}
            className="glass-input w-full text-sm resize-none"
            placeholder="Any additional instructions for deployed units..."
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <GlassButton variant="ghost" onClick={onClose} className="flex-1">Cancel</GlassButton>
          <GlassButton
            variant="danger"
            onClick={handleSubmit}
            disabled={isSubmitting || !form.serviceType}
            className="flex-1 flex items-center justify-center gap-2"
          >
            {isSubmitting ? <><Loader2 size={14} className="animate-spin"/> Dispatching...</> : '🚨 Confirm Dispatch'}
          </GlassButton>
        </div>
      </div>
    </GlassModal>
  );
}
