import { useState, useEffect } from 'react';

/**
 * useGeolocation — Wrapper around browser navigator.geolocation
 * Default location is Lonavla (18.7557, 73.4091) if rejected or unavailable
 * @returns {Object} { location: { lat, lng }, error, isLoading }
 */
export function useGeolocation() {
  const [location, setLocation] = useState({ lat: 18.7557, lng: 73.4091 }); // Default Lonavla
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setIsLoading(false);
      },
      (err) => {
        console.warn('Geolocation error:', err.message, 'Using default location.');
        setError(err.message);
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  }, []);

  return { location, error, isLoading };
}
