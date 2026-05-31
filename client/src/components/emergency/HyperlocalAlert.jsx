import { useState, useEffect } from 'react';
import { MapPin, Navigation, AlertTriangle, ShieldCheck, Loader2 } from 'lucide-react';
import api from '../../services/api';
import { GlassCard } from '../ui/GlassCard';
import { GlassButton } from '../ui/GlassButton';

// Haversine distance formula
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}

// Ray-casting point-in-polygon check
function isPointInPolygon(lat, lng, polygonCoordinates) {
  if (!polygonCoordinates || polygonCoordinates.length === 0) return false;
  const coords = polygonCoordinates[0]; // first ring
  let inside = false;
  for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
    const xi = coords[i][1], yi = coords[i][0];
    const xj = coords[j][1], yj = coords[j][0];
    const intersect = ((yi > lng) !== (yj > lng))
        && (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export default function HyperlocalAlert({ onEvacuate, safeZones }) {
  const [coords, setCoords] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState('prompt'); // prompt, granted, denied
  const [nearestZone, setNearestZone] = useState(null);
  const [isInside, setIsInside] = useState(false);
  const [distance, setDistance] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const requestLocation = () => {
    setIsLoading(true);
    if (!navigator.geolocation) {
      setPermissionStatus('denied');
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setPermissionStatus('granted');
        setIsLoading(false);
      },
      () => {
        setPermissionStatus('denied');
        setIsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const checkStatus = async () => {
    if (!coords) return;
    try {
      const response = await api.get('/emergency/zones');
      const data = response.data?.data || response.data || {};
      const features = data?.features || [];

      let minDistance = Infinity;
      let closestZone = null;
      let userIsInside = false;

      features.forEach((zone) => {
        const polygon = zone.geometry?.coordinates;
        if (!polygon) return;

        // Calculate center/centroid of polygon
        const ring = polygon[0];
        let sumLat = 0, sumLng = 0;
        ring.forEach(([lng, lat]) => {
          sumLat += lat;
          sumLng += lng;
        });
        const centerLat = sumLat / ring.length;
        const centerLng = sumLng / ring.length;

        const dist = getDistance(coords.lat, coords.lng, centerLat, centerLng);
        if (dist < minDistance) {
          minDistance = dist;
          closestZone = zone;
        }

        // Run point-in-polygon check
        if (isPointInPolygon(coords.lat, coords.lng, polygon)) {
          userIsInside = true;
        }
      });

      setNearestZone(closestZone);
      setIsInside(userIsInside);
      setDistance(minDistance);
    } catch (err) {
      console.error('[HyperlocalAlert] status check failed:', err);
    }
  };

  useEffect(() => {
    requestLocation();
  }, []);

  useEffect(() => {
    if (coords) {
      checkStatus();
      const interval = setInterval(checkStatus, 120000); // update every 2 minutes
      return () => clearInterval(interval);
    }
  }, [coords]);

  if (isLoading) {
    return (
      <GlassCard padding="p-5" className="flex items-center justify-center py-8">
        <Loader2 className="animate-spin text-blue-500 mr-2" size={18} />
        <span className="text-xs font-semibold text-slate-500">Checking safety status...</span>
      </GlassCard>
    );
  }

  if (permissionStatus === 'denied') {
    return (
      <GlassCard padding="p-5" className="flex flex-col gap-3">
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <MapPin size={18} className="text-red-500" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Your Location Status</h3>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Enable location access to see your personal safety status and nearest safe zones.
        </p>
        <GlassButton size="sm" onClick={requestLocation} className="w-full flex items-center justify-center gap-2">
          <Navigation size={14} /> Enable Location
        </GlassButton>
      </GlassCard>
    );
  }

  const zoneName = nearestZone?.properties?.name || 'Unknown Zone';
  const zoneLevel = nearestZone?.properties?.level || 'green';
  const isDangerZone = zoneLevel === 'red' || zoneLevel === 'orange';

  // Inside danger zone
  if (isInside && isDangerZone) {
    return (
      <GlassCard padding="p-5" className="flex flex-col gap-4 border-red-500/50 bg-red-500/5">
        <div className="flex items-center gap-2 border-b border-red-500/25 pb-3">
          <AlertTriangle size={18} className="text-red-500 animate-pulse" />
          <h3 className="text-sm font-black text-red-700 dark:text-red-400 uppercase tracking-wide">
            🚨 YOU ARE IN A DANGER ZONE
          </h3>
        </div>
        
        <div className="text-xs text-slate-600 dark:text-slate-300 flex flex-col gap-1">
          <div>Zone: <span className="font-bold text-red-600 dark:text-red-400">{zoneName}</span></div>
          <div>Distance to flood center: <span className="font-bold">{(distance ?? 0).toFixed(2)} km</span></div>
          <div className="mt-2 text-red-700 dark:text-red-400 font-extrabold uppercase text-[11px] bg-red-100 dark:bg-red-950/40 p-2 rounded-lg border border-red-200/50">
            ⚠️ Recommended action: EVACUATE IMMEDIATELY
          </div>
        </div>

        {safeZones && safeZones.length > 0 && onEvacuate && (
          <GlassButton 
            variant="danger" 
            size="sm" 
            onClick={() => {
              // Find closest safe zone to user coords
              let closestSafe = safeZones[0];
              let minSafeDist = Infinity;
              safeZones.forEach(sz => {
                const d = getDistance(coords.lat, coords.lng, sz.latitude, sz.longitude);
                if (d < minSafeDist) {
                  minSafeDist = d;
                  closestSafe = sz;
                }
              });
              onEvacuate(coords.lat, coords.lng, closestSafe);
            }} 
            className="w-full justify-center"
          >
            Show Evacuation Route
          </GlassButton>
        )}
      </GlassCard>
    );
  }

  // Near danger zone (within 5km)
  if (distance !== null && distance <= 5 && isDangerZone) {
    return (
      <GlassCard padding="p-5" className="flex flex-col gap-4 border-amber-500/40 bg-amber-500/5">
        <div className="flex items-center gap-2 border-b border-amber-500/25 pb-3">
          <AlertTriangle size={18} className="text-amber-500 animate-bounce" />
          <h3 className="text-sm font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
            ⚠️ YOU ARE NEAR A DANGER ZONE
          </h3>
        </div>

        <div className="text-xs text-slate-600 dark:text-slate-300 flex flex-col gap-1">
          <div>Nearest danger zone: <span className="font-bold text-amber-600 dark:text-amber-400">{zoneName}</span></div>
          <div>Distance: <span className="font-bold">{(distance ?? 0).toFixed(2)} km away</span></div>
          <div className="mt-2 text-amber-700 dark:text-amber-400 font-bold text-[11px] bg-amber-100 dark:bg-amber-950/40 p-2 rounded-lg border border-amber-200/50">
            Recommended action: Stay alert and prepare to evacuate
          </div>
        </div>
      </GlassCard>
    );
  }

  // Safe status
  return (
    <GlassCard padding="p-5" className="flex flex-col gap-3 border-green-500/30">
      <div className="flex items-center gap-2 border-b border-green-500/10 pb-3">
        <ShieldCheck size={18} className="text-green-500" />
        <h3 className="text-sm font-bold text-green-700 dark:text-green-400 uppercase tracking-wide">
          ✅ YOUR LOCATION IS SAFE
        </h3>
      </div>
      
      <div className="text-xs text-slate-600 dark:text-slate-300">
        {nearestZone ? (
          <div>Nearest alert zone: <span className="font-semibold text-slate-700 dark:text-slate-200">{zoneName}</span> ({(distance ?? 0).toFixed(2)} km away)</div>
        ) : (
          <div>No nearby active danger zones detected.</div>
        )}
        <div className="mt-2 text-slate-500 italic text-[10px]">Continue monitoring live updates.</div>
      </div>
    </GlassCard>
  );
}
