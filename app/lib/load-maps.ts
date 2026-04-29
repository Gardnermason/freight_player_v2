// Singleton: load the Google Maps JS API once for the whole app
let mapsPromise: Promise<void> | null = null;

export function loadMapsApi(): Promise<void> {
  if (mapsPromise) return mapsPromise;

  mapsPromise = (async () => {
    if (typeof google !== 'undefined' && google.maps?.places) return;

    const resp = await fetch('/api/public-config');
    const { mapsKey } = await resp.json();
    if (!mapsKey) throw new Error('No Maps key available');

    return new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${mapsKey}&libraries=places,geocoding`;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Maps'));
      document.head.appendChild(script);
    });
  })();

  return mapsPromise;
}
