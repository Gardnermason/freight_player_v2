'use client';

import { useRef, useEffect } from 'react';
import { CalculationMode, MODE_CONFIG } from '../lib/types';

const MODES: CalculationMode[] = ['generateQuote', 'calculateFromTon', 'calculateFromFlat'];

interface Props {
  current: CalculationMode;
  onChange: (mode: CalculationMode) => void;
}

export default function ModeSelector({ current, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const slider = sliderRef.current;
    if (!container || !slider) return;

    const activeBtn = container.querySelector(`[data-mode="${current}"]`) as HTMLElement;
    if (activeBtn) {
      slider.style.width = `${activeBtn.offsetWidth}px`;
      slider.style.transform = `translateX(${activeBtn.offsetLeft - 4}px)`;
    }
  }, [current]);

  return (
    <div
      ref={containerRef}
      className="mode-container relative grid grid-cols-3 gap-1 mb-4 p-1 rounded-lg"
    >
      <div
        ref={sliderRef}
        className="mode-slider-bg absolute top-1 bottom-1 left-1 w-1/3 rounded-md transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] z-[5]"
      />
      {MODES.map(m => (
        <button
          key={m}
          type="button"
          data-mode={m}
          onClick={() => onChange(m)}
          className={`relative z-10 py-2.5 px-1 rounded-lg text-sm font-semibold transition-colors duration-200 ${
            current === m ? 'mode-btn-active' : 'mode-btn-inactive'
          }`}
        >
          {MODE_CONFIG[m].label}
        </button>
      ))}
    </div>
  );
}
