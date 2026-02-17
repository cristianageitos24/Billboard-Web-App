'use client';

import { useEffect, useRef } from 'react';

const HOUSTON_CENTER = { lat: 29.7604, lng: -95.3698 };

export default function HoustonMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const initRef = useRef(false);

  useEffect(() => {
    if (!mapRef.current || !process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) return;

    const initMap = () => {
      if (
        initRef.current ||
        typeof window === 'undefined' ||
        !window.google?.maps?.Map ||
        !mapRef.current
      ) {
        return !!initRef.current;
      }
      initRef.current = true;
      new google.maps.Map(mapRef.current, {
        center: HOUSTON_CENTER,
        zoom: 11,
      });
      return true;
    };

    if (initMap()) return;

    const handleReady = () => {
      initMap();
    };

    window.addEventListener('google-maps-ready', handleReady);

    const pollId = setInterval(() => {
      if (initMap()) {
        clearInterval(pollId);
      }
    }, 100);

    return () => {
      window.removeEventListener('google-maps-ready', handleReady);
      clearInterval(pollId);
    };
  }, []);

  return (
    <div
      ref={mapRef}
      className="w-full h-[600px] rounded-lg"
      role="application"
      aria-label="Houston billboard map"
    />
  );
}
