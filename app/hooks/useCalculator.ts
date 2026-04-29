'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { CalculationMode, HistoryEntry } from '../lib/types';
import { calculate, getSummaryText } from '../lib/calculations';

const HISTORY_KEY = 'thompsonCalcHistory';
const COUNTER_KEY = 'thompsonPersonalCalcCount';

export function useCalculator() {
  const [mode, setMode] = useState<CalculationMode>('generateQuote');
  const [primaryInput, setPrimaryInput] = useState('');
  const [miles, setMiles] = useState('');
  const [tonnage, setTonnage] = useState('23');
  const [fsc, setFsc] = useState('');
  const [deadheadMiles, setDeadheadMiles] = useState(0);
  const [loadedMiles, setLoadedMiles] = useState(0);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [calcCount, setCalcCount] = useState(0);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Load history and counter from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY);
      if (saved) setHistory(JSON.parse(saved));
      const count = parseInt(localStorage.getItem(COUNTER_KEY) || '0');
      setCalcCount(count);
    } catch {}
  }, []);

  // Calculate outputs
  const outputs = calculate(mode, {
    primaryInput: parseFloat(primaryInput) || 0,
    miles: parseFloat(miles) || 0,
    tonnage: parseFloat(tonnage) || 23,
    fscPercent: parseFloat(fsc) || 0,
  });

  // Save calculation to history (debounced)
  const scheduleSave = useCallback(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      const pInput = parseFloat(primaryInput) || 0;
      const m = parseFloat(miles) || 0;
      if (pInput <= 0 || m <= 0) return;

      setHistory(prev => {
        const entry: HistoryEntry = {
          mode,
          primaryInput,
          miles,
          tonnage,
          fsc,
          timestamp: new Date().toISOString(),
        };
        // Skip duplicate of last entry
        if (prev.length > 0) {
          const last = prev[0];
          if (last.mode === entry.mode && last.primaryInput === entry.primaryInput &&
              last.miles === entry.miles && last.tonnage === entry.tonnage && last.fsc === entry.fsc) {
            return prev;
          }
        }
        const next = [entry, ...prev].slice(0, 5);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
        return next;
      });

      setCalcCount(prev => {
        const next = prev + 1;
        localStorage.setItem(COUNTER_KEY, String(next));
        return next;
      });
    }, 1500);
  }, [mode, primaryInput, miles, tonnage, fsc]);

  // Auto-save on input changes
  useEffect(() => {
    scheduleSave();
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, [scheduleSave]);

  const changeMode = useCallback((newMode: CalculationMode) => {
    setMode(newMode);
    setPrimaryInput('');
    setFsc('');
    setTonnage(newMode === 'calculateFromFlat' ? '' : '23');
  }, []);

  const reset = useCallback(() => {
    setPrimaryInput('');
    setMiles('');
    setFsc('');
    setTonnage(mode === 'calculateFromFlat' ? '' : '23');
    setDeadheadMiles(0);
    setLoadedMiles(0);
  }, [mode]);

  const loadFromHistory = useCallback((entry: HistoryEntry) => {
    setMode(entry.mode);
    setPrimaryInput(entry.primaryInput);
    setMiles(entry.miles);
    setTonnage(entry.tonnage || '23');
    setFsc(entry.fsc);
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  }, []);

  const setRouteMiles = useCallback((deadhead: number | null, loaded: number | null) => {
    setDeadheadMiles(deadhead ?? 0);
    setLoadedMiles(loaded ?? 0);
    const total = (deadhead ?? 0) + (loaded ?? 0);
    setMiles(total > 0 ? String(Math.round(total * 10) / 10) : '');
  }, []);

  const summary = getSummaryText(mode, primaryInput, miles, tonnage, fsc);

  return {
    mode, changeMode,
    primaryInput, setPrimaryInput,
    miles, setMiles,
    tonnage, setTonnage,
    fsc, setFsc,
    outputs, summary,
    deadheadMiles, loadedMiles,
    setRouteMiles,
    reset,
    history, loadFromHistory, clearHistory,
    calcCount,
  };
}
