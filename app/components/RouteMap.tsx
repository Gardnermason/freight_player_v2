'use client';

import { useRef, useEffect, useState } from 'react';
import { loadMapsApi } from '../lib/load-maps';

interface RouteRequest {
  truck: string;
  pickup: string;
  drop: string;
}

interface Props {
  routeRequest: RouteRequest | null;
}

export default function RouteMap({ routeRequest }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const deadheadRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const loadedRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [ready, setReady] = useState(false);

  // Initialize the map once
  useEffect(() => {
    let cancelled = false;

    loadMapsApi().then(() => {
      if (cancelled || !containerRef.current || mapRef.current) return;

      const map = new google.maps.Map(containerRef.current, {
        center: { lat: 39.8283, lng: -98.5795 },
        zoom: 4,
        mapTypeId: 'roadmap',
        disableDefaultUI: true,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      mapRef.current = map;
      setReady(true);
    }).catch((err) => {
      console.error('[RouteMap] Failed to init map:', err);
    });

    return () => { cancelled = true; };
  }, []);

  // Draw routes/pins when routeRequest changes
  useEffect(() => {
    if (!ready || !mapRef.current) return;

    const map = mapRef.current;

    // Clear previous renderers and markers
    if (deadheadRendererRef.current) {
      deadheadRendererRef.current.setMap(null);
      deadheadRendererRef.current = null;
    }
    if (loadedRendererRef.current) {
      loadedRendererRef.current.setMap(null);
      loadedRendererRef.current = null;
    }
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    // If null, reset to default view
    if (!routeRequest) {
      map.setCenter({ lat: 39.8283, lng: -98.5795 });
      map.setZoom(4);
      return;
    }

    const { truck, pickup, drop } = routeRequest;
    const hasTruck = !!truck;
    const hasPickup = !!pickup;
    const hasDrop = !!drop;
    const filledCount = [hasTruck, hasPickup, hasDrop].filter(Boolean).length;

    if (filledCount === 0) return;

    function addMarker(position: google.maps.LatLng, label: string, color: string) {
      const marker = new google.maps.Marker({
        position: { lat: position.lat(), lng: position.lng() },
        map,
        label: {
          text: label,
          color: '#FFFFFF',
          fontWeight: 'bold',
          fontSize: '13px',
        },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
          scale: 14,
          labelOrigin: new google.maps.Point(0, 0),
        } as unknown as google.maps.MarkerIcon,
        zIndex: label === 'P' ? 3 : 2,
      });
      markersRef.current.push(marker);
    }

    function geocodeAndPin(address: string, label: string, color: string): Promise<google.maps.LatLng | null> {
      return new Promise((resolve) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const geocoder = new (google.maps as any).Geocoder();
        geocoder.geocode({ address }, (results: any[], status: string) => {
          if (status === 'OK' && results?.[0]) {
            const pos = results[0].geometry.location as google.maps.LatLng;
            addMarker(pos, label, color);
            resolve(pos);
          } else {
            resolve(null);
          }
        });
      });
    }

    const needDeadhead = hasTruck && hasPickup;
    const needLoaded = hasPickup && hasDrop;

    // Single pin — geocode and center on it
    if (filledCount === 1) {
      const address = truck || pickup || drop;
      const label = hasTruck ? 'T' : hasPickup ? 'P' : 'D';
      const color = hasTruck ? '#F97316' : hasPickup ? '#22C55E' : '#EF4444';
      geocodeAndPin(address, label, color).then((pos) => {
        if (pos) {
          map.setCenter({ lat: pos.lat(), lng: pos.lng() });
          map.setZoom(8);
        }
      });
      return;
    }

    // Two locations without a route pair (truck + drop, no pickup) — just show 2 pins
    if (filledCount === 2 && !needDeadhead && !needLoaded) {
      const pins: { address: string; label: string; color: string }[] = [];
      if (hasTruck) pins.push({ address: truck, label: 'T', color: '#F97316' });
      if (hasDrop) pins.push({ address: drop, label: 'D', color: '#EF4444' });

      Promise.all(pins.map(p => geocodeAndPin(p.address, p.label, p.color))).then((positions) => {
        const valid = positions.filter((p): p is google.maps.LatLng => p !== null);
        if (valid.length >= 2) {
          const bounds = new google.maps.LatLngBounds();
          valid.forEach(pos => bounds.extend({ lat: pos.lat(), lng: pos.lng() }));
          map.fitBounds(bounds, 50);
        } else if (valid.length === 1) {
          map.setCenter({ lat: valid[0].lat(), lng: valid[0].lng() });
          map.setZoom(8);
        }
      });
      return;
    }

    // Route cases — one or both legs
    const directionsService = new google.maps.DirectionsService();
    const bounds = new google.maps.LatLngBounds();
    const totalLegs = (needDeadhead ? 1 : 0) + (needLoaded ? 1 : 0);
    let completedLegs = 0;

    function fitWhenDone() {
      completedLegs++;
      if (completedLegs === totalLegs) {
        map.fitBounds(bounds, 50);
      }
    }

    // Deadhead leg: truck → pickup (orange dashed)
    if (needDeadhead) {
      directionsService.route(
        {
          origin: truck,
          destination: pickup,
          travelMode: google.maps.TravelMode.DRIVING,
          avoidFerries: true,
        } as google.maps.DirectionsRequest,
        (result: google.maps.DirectionsResult | null, status: string) => {
          if (status === 'OK' && result) {
            const renderer = new google.maps.DirectionsRenderer({
              map,
              directions: result,
              suppressMarkers: true,
              preserveViewport: true,
              polylineOptions: {
                strokeColor: '#F97316',
                strokeOpacity: 0,
                strokeWeight: 4,
                icons: [{
                  icon: {
                    path: 'M 0,-1 0,1',
                    strokeOpacity: 0.9,
                    strokeColor: '#F97316',
                    strokeWeight: 4,
                    scale: 3,
                  },
                  offset: '0',
                  repeat: '16px',
                }],
              },
            });
            deadheadRendererRef.current = renderer;

            const route = result.routes[0];
            if (route?.bounds) bounds.union(route.bounds);
            const leg = route?.legs?.[0];
            if (leg) {
              addMarker(leg.start_location, 'T', '#F97316');
              addMarker(leg.end_location, 'P', '#22C55E');
            }
          }
          fitWhenDone();
        }
      );
    }

    // Loaded leg: pickup → drop (solid blue)
    if (needLoaded) {
      directionsService.route(
        {
          origin: pickup,
          destination: drop,
          travelMode: google.maps.TravelMode.DRIVING,
          avoidFerries: true,
        } as google.maps.DirectionsRequest,
        (result: google.maps.DirectionsResult | null, status: string) => {
          if (status === 'OK' && result) {
            const renderer = new google.maps.DirectionsRenderer({
              map,
              directions: result,
              suppressMarkers: true,
              preserveViewport: true,
              polylineOptions: {
                strokeColor: '#4285F4',
                strokeOpacity: 1.0,
                strokeWeight: 5,
              },
            });
            loadedRendererRef.current = renderer;

            const route = result.routes[0];
            if (route?.bounds) bounds.union(route.bounds);
            const leg = route?.legs?.[0];
            if (leg) {
              // Add pickup marker if deadhead leg didn't already add it
              if (!needDeadhead) {
                addMarker(leg.start_location, 'P', '#22C55E');
              }
              addMarker(leg.end_location, 'D', '#EF4444');
            }
          }
          fitWhenDone();
        }
      );
    }
  }, [ready, routeRequest]);

  return (
    <div ref={containerRef} className="w-full h-full" />
  );
}
