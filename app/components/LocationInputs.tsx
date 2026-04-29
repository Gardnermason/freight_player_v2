'use client';

import { useState, useEffect } from 'react';
import PlacesInput from './PlacesInput';

interface Props {
  onMilesCalculated: (deadhead: number | null, loaded: number | null) => void;
  onLocationsChange: (truck: string, pickup: string, drop: string) => void;
  onRouteReady: (truck: string, pickup: string, drop: string) => void;
}

function LocationIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 17h1m7 0h1M3 11l1-6h12l3 4h2a1 1 0 011 1v5a1 1 0 01-1 1h-1m-14 0H4a1 1 0 01-1-1v-4zm6 4a2 2 0 100-4 2 2 0 000 4zm9 0a2 2 0 100-4 2 2 0 000 4z" />
    </svg>
  );
}

async function fetchDistance(origin: string, destination: string): Promise<number> {
  const resp = await fetch('/api/distance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ origin, destination }),
  });
  const data = await resp.json();
  if (!data.ok) throw new Error(data.error || 'Failed to get distance');
  return data.miles as number;
}

export default function LocationInputs({ onMilesCalculated, onLocationsChange, onRouteReady }: Props) {
  const [truckLocation, setTruckLocation] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropLocation, setDropLocation] = useState('');
  const [deadheadMiles, setDeadheadMiles] = useState<number | null>(null);
  const [loadedMiles, setLoadedMiles] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const hasTruck = truckLocation.trim() !== '';
  const hasPickup = pickupLocation.trim() !== '';
  const hasDrop = dropLocation.trim() !== '';
  const filledCount = [hasTruck, hasPickup, hasDrop].filter(Boolean).length;
  const canCalculate = filledCount >= 1;

  // Sync up to parent from state, not from an inline callback — the autocomplete
  // place_changed listener is bound once and captures a stale onChange closure.
  useEffect(() => {
    onLocationsChange(truckLocation, pickupLocation, dropLocation);
  }, [truckLocation, pickupLocation, dropLocation, onLocationsChange]);

  const handleCalculate = async () => {
    if (!canCalculate) return;
    setLoading(true);
    setDeadheadMiles(null);
    setLoadedMiles(null);

    try {
      const needDeadhead = hasTruck && hasPickup;
      const needLoaded = hasPickup && hasDrop;

      const [dh, ld] = await Promise.all([
        needDeadhead ? fetchDistance(truckLocation, pickupLocation) : Promise.resolve(null),
        needLoaded ? fetchDistance(pickupLocation, dropLocation) : Promise.resolve(null),
      ]);

      setDeadheadMiles(dh);
      setLoadedMiles(ld);
      onMilesCalculated(dh, ld);
      onRouteReady(truckLocation, pickupLocation, dropLocation);
    } catch {
      // Silent — just show whatever we can
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'form-input editable-field flex-1 py-2.5 px-3 text-sm border rounded-lg';
  const hasResults = deadheadMiles !== null || loadedMiles !== null;

  return (
    <div className="space-y-1 flex-1 flex flex-col justify-evenly">
      {/* Truck Location */}
      <div className="flex items-center space-x-2">
        <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-[#F59E0B] text-[#121212]">
          <TruckIcon />
        </span>
        <PlacesInput
          value={truckLocation}
          onChange={setTruckLocation}
          placeholder="Truck location (city, state or zip)"
          className={inputClass}
        />
      </div>

      {/* Connector */}
      <div className="ml-[16px]"><div className="w-[2px] h-3 bg-[#535353]" /></div>

      {/* Pickup Location */}
      <div className="flex items-center space-x-2">
        <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-[#1DB954] text-[#121212]">
          <LocationIcon />
        </span>
        <PlacesInput
          value={pickupLocation}
          onChange={setPickupLocation}
          placeholder="Pickup location (city, state or zip)"
          className={inputClass}
        />
      </div>

      {/* Connector */}
      <div className="ml-[16px]"><div className="w-[2px] h-3 bg-[#535353]" /></div>

      {/* Drop Location */}
      <div className="flex items-center space-x-2">
        <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-[#E5173F] text-white">
          <LocationIcon />
        </span>
        <PlacesInput
          value={dropLocation}
          onChange={setDropLocation}
          placeholder="Drop location (city, state or zip)"
          className={inputClass}
        />
      </div>

      {/* Calculate Button */}
      <button
        type="button"
        onClick={handleCalculate}
        disabled={!canCalculate || loading}
        className="w-full mt-2 py-2.5 rounded-full font-bold text-white text-sm bg-[#0EA5E9] hover:bg-[#0284C7] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Calculating Route...
          </span>
        ) : (
          'Calculate Route Miles'
        )}
      </button>

      {/* Results — Deadhead / Loaded / Total */}
      {hasResults && (
        <div className="grid grid-cols-3 gap-2 text-center mt-2">
          <div className="bg-[#F59E0B] rounded-lg p-2">
            <p className="text-[10px] font-bold text-[#121212] uppercase">Deadhead</p>
            <p className="text-base font-bold text-[#121212]">{deadheadMiles !== null ? deadheadMiles.toFixed(1) : '—'}</p>
            <p className="text-[10px] text-[#121212]/70">miles</p>
          </div>
          <div className="bg-[#1DB954] rounded-lg p-2">
            <p className="text-[10px] font-bold text-[#121212] uppercase">Loaded</p>
            <p className="text-base font-bold text-[#121212]">{loadedMiles !== null ? loadedMiles.toFixed(1) : '—'}</p>
            <p className="text-[10px] text-[#121212]/70">miles</p>
          </div>
          <div className="bg-[#0EA5E9] rounded-lg p-2">
            <p className="text-[10px] font-bold text-[#121212] uppercase">Total</p>
            <p className="text-base font-bold text-[#121212]">
              {deadheadMiles !== null && loadedMiles !== null
                ? (deadheadMiles + loadedMiles).toFixed(1)
                : '—'}
            </p>
            <p className="text-[10px] text-[#121212]/70">miles</p>
          </div>
        </div>
      )}
    </div>
  );
}
