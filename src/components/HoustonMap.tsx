'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import type { BillboardListItem } from '@/types/billboard';

const HOUSTON_CENTER = { lat: 29.7604, lng: -95.3698 };

type Props = {
  billboards: BillboardListItem[];
  onSelectBillboard: (billboard: BillboardListItem) => void;
  focusBillboard?: BillboardListItem | null;
};

export default function HoustonMap({ billboards, onSelectBillboard, focusBillboard }: Props) {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const onSelectRef = useRef(onSelectBillboard);
  onSelectRef.current = onSelectBillboard;

  // Initialize map once when script is ready and container has dimensions (avoids grey map)
  useEffect(() => {
    if (!mapDivRef.current || !process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) return;

    const isContainerReady = (): boolean => {
      const el = mapDivRef.current;
      if (!el) return false;
      const rect = el.getBoundingClientRect();
      return rect.width >= 100 && rect.height >= 100;
    };

    const initMap = (): google.maps.Map | null => {
      if (
        typeof window === 'undefined' ||
        !window.google?.maps?.Map ||
        !mapDivRef.current
      ) {
        return null;
      }
      if (!isContainerReady()) return null;
      if (mapInstanceRef.current) return mapInstanceRef.current;
      const map = new google.maps.Map(mapDivRef.current, {
        center: HOUSTON_CENTER,
        zoom: 11,
        styles: [
          { featureType: 'poi', stylers: [{ visibility: 'off' }] },
        ],
      });
      mapInstanceRef.current = map;
      setMapReady(true);
      return map;
    };

    if (initMap()) return;

    const handleReady = () => {
      initMap();
    };

    window.addEventListener('google-maps-ready', handleReady);
    const pollId = setInterval(() => {
      if (initMap()) clearInterval(pollId);
    }, 150);

    // Init when container gets dimensions (e.g. after layout)
    const el = mapDivRef.current;
    if (el && typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(() => {
        if (initMap()) ro.disconnect();
      });
      ro.observe(el);
      return () => {
        window.removeEventListener('google-maps-ready', handleReady);
        clearInterval(pollId);
        ro.disconnect();
      };
    }

    return () => {
      window.removeEventListener('google-maps-ready', handleReady);
      clearInterval(pollId);
    };
  }, []);

  // Add markers and clustering when map is ready and billboards are available
  // Use stable dependency (billboard IDs) to avoid recreation on sort changes
  const billboardIds = useMemo(() => {
    return billboards.map(b => b.id).sort().join(',');
  }, [billboards]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapReady || !billboards.length) return;

    // Clean up existing markers and clusterer
    if (clustererRef.current) {
      clustererRef.current.clearMarkers();
      clustererRef.current = null;
    }
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    // Chunked marker creation to prevent main thread blocking
    const CHUNK_SIZE = 120;
    let currentIndex = 0;
    const allMarkers: google.maps.Marker[] = [];
    let clusterer: MarkerClusterer | null = null;
    let cancelled = false;

    const createChunk = () => {
      if (cancelled) return;

      const endIndex = Math.min(currentIndex + CHUNK_SIZE, billboards.length);
      const chunk = billboards.slice(currentIndex, endIndex);

      // Create markers for this chunk
      const chunkMarkers: google.maps.Marker[] = chunk.map((b) => {
        const marker = new google.maps.Marker({
          position: { lat: b.lat, lng: b.lng },
          map,
          title: b.name ?? b.address ?? b.id,
        });
        marker.addListener('click', () => {
          onSelectRef.current(b);
        });
        return marker;
      });

      allMarkers.push(...chunkMarkers);
      markersRef.current = allMarkers;

      // Initialize or update clusterer with all markers so far
      if (!clusterer) {
        clusterer = new MarkerClusterer({ map, markers: allMarkers });
        clustererRef.current = clusterer;
      } else {
        clusterer.addMarkers(chunkMarkers);
      }

      currentIndex = endIndex;

      // Continue with next chunk if there are more billboards
      if (currentIndex < billboards.length) {
        // Use requestIdleCallback with setTimeout fallback for yielding to main thread
        if (typeof requestIdleCallback !== 'undefined') {
          requestIdleCallback(createChunk, { timeout: 50 });
        } else {
          setTimeout(createChunk, 0);
        }
      }
    };

    // Start creating chunks
    createChunk();

    return () => {
      cancelled = true;
      if (clusterer) {
        clusterer.clearMarkers();
      }
      allMarkers.forEach((m) => m.setMap(null));
      clustererRef.current = null;
      markersRef.current = [];
    };
  }, [billboardIds, mapReady, billboards]);

  // Pan to billboard when "View on map" is used
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapReady || !focusBillboard) return;
    map.panTo({ lat: focusBillboard.lat, lng: focusBillboard.lng });
  }, [focusBillboard, mapReady]);

  const hasMapsKey = typeof process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY === 'string' && process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.length > 0;

  if (!hasMapsKey) {
    return (
      <div
        className="w-full h-full min-h-[500px] rounded-lg flex items-center justify-center bg-neutral-100 text-neutral-600 text-sm"
        role="application"
        aria-label="Houston billboard map"
      >
        <p>Set <code className="bg-neutral-200 px-1 rounded">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> in .env.local and restart the dev server.</p>
      </div>
    );
  }

  return (
    <div
      ref={mapDivRef}
      className="w-full h-full min-h-[500px] rounded-lg"
      role="application"
      aria-label="Houston billboard map"
    />
  );
}
