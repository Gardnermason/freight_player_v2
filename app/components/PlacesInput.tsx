'use client';

import { useRef, useEffect, useCallback } from 'react';
import { loadMapsApi } from '../lib/load-maps';

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}

export default function PlacesInput({ value, onChange, placeholder, className }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const isSettingRef = useRef(false);

  const handlePlaceSelect = useCallback(() => {
    const ac = autocompleteRef.current;
    if (!ac) return;
    const place = ac.getPlace();
    if (place?.formatted_address) {
      isSettingRef.current = true;
      onChange(place.formatted_address);
    } else if (place?.name) {
      isSettingRef.current = true;
      onChange(place.name);
    }
  }, [onChange]);

  useEffect(() => {
    let cancelled = false;

    loadMapsApi()
      .then(() => {
        if (cancelled || !inputRef.current) return;
        if (autocompleteRef.current) return; // already attached

        const ac = new google.maps.places.Autocomplete(inputRef.current, {
          types: ['geocode', 'establishment'],
          componentRestrictions: { country: 'us' },
          fields: ['formatted_address', 'name', 'geometry'],
        });

        ac.addListener('place_changed', handlePlaceSelect);
        autocompleteRef.current = ac;
      })
      .catch(() => {
        // Silently fail — input still works as plain text
      });

    return () => { cancelled = true; };
  }, [handlePlaceSelect]);

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => {
        if (!isSettingRef.current) {
          onChange(e.target.value);
        }
        isSettingRef.current = false;
      }}
      placeholder={placeholder}
      className={className}
      autoComplete="off"
    />
  );
}
