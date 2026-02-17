'use client';

import { useEffect } from 'react';

export default function GoogleMapsScriptLoader() {
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return;

    if (typeof window !== 'undefined' && window.google?.maps) {
      window.dispatchEvent(new Event('google-maps-ready'));
      return;
    }

    const callbackName = '__onGoogleMapsReady';
    (window as unknown as Record<string, () => void>)[callbackName] = () => {
      window.dispatchEvent(new Event('google-maps-ready'));
    };

    const script1 = document.createElement('script');
    script1.innerHTML = `window.${callbackName} = function() { window.dispatchEvent(new Event('google-maps-ready')); };`;
    document.head.appendChild(script1);

    const script2 = document.createElement('script');
    script2.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=${callbackName}`;
    script2.async = true;
    document.head.appendChild(script2);
  }, []);

  return null;
}
