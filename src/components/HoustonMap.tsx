'use client';

import { useEffect, useRef } from 'react';

const HOUSTON_CENTER = { lat: 29.7604, lng: -95.3698 };

export default function HoustonMap() {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current || !process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) return;

    const map = new google.maps.Map(mapRef.current, {
      center: HOUSTON_CENTER,
      zoom: 11,
    });

    return () => {};
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
