'use client';

import { useState, useCallback, useEffect } from 'react';
import { MODE_CONFIG } from '../lib/types';
import { useCalculator } from '../hooks/useCalculator';
import ModeSelector from './ModeSelector';
import ActionButtons from './ActionButtons';
import SideMenu from './SideMenu';
import LocationInputs from './LocationInputs';
import RouteMap from './RouteMap';

/* ===== Icons ===== */
function DollarIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="#535353" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" />
    </svg>
  );
}
function MilesIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="#535353" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 3v18m8-18v18m-4-6h.01M10 9h.01M14 6h.01M14 15h.01" />
    </svg>
  );
}
function TonnageIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="#535353" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 20V12a6 6 0 1112 0v8m-12 0h12m-9-14V5a3 3 0 016 0v1" />
    </svg>
  );
}
function FscIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="#535353" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
  );
}

/* ===== Calculator Row ===== */
interface InputRowProps {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  disabled?: boolean;
  isOutput?: boolean;
}

function InputRow({ label, icon, value, onChange, placeholder, readOnly, disabled, isOutput }: InputRowProps) {
  return (
    <div className="flex items-center gap-3">
      <label className={`flex-1 ${isOutput ? 'output-label-calc' : 'input-label-calc'}`}>{label}</label>
      <div className="relative w-44">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          {icon}
        </span>
        <input
          type={readOnly ? 'text' : 'number'}
          step="0.01"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
          disabled={disabled}
          style={{ height: '44px', fontSize: '16px' }}
          className={`form-input w-full pl-9 pr-3 text-right font-semibold border rounded-lg ${
            readOnly ? 'output-field cursor-not-allowed' : 'editable-field'
          } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
        />
      </div>
    </div>
  );
}

/* ===== Main Component ===== */
export default function FreightCalculator() {
  const calc = useCalculator();
  const [menuOpen, setMenuOpen] = useState(false);
  const [locations, setLocations] = useState({ truck: '', pickup: '', drop: '' });
  const [routeRequest, setRouteRequest] = useState<{ truck: string; pickup: string; drop: string } | null>(null);
  const [locationResetKey, setLocationResetKey] = useState(0);
  const [printDate, setPrintDate] = useState('');

  // Defer Date until after hydration — locale/timezone differs between SSR and client.
  useEffect(() => {
    setPrintDate(new Date().toLocaleDateString());
  }, []);

  const config = MODE_CONFIG[calc.mode];
  const isFlatMode = calc.mode === 'calculateFromFlat';
  const fmtOutput = (n: number) => (n > 0.005 ? n.toFixed(2) : '');

  const handleLocationsChange = useCallback((truck: string, pickup: string, drop: string) => {
    setLocations({ truck, pickup, drop });
  }, []);

  const handleRouteReady = useCallback((truck: string, pickup: string, drop: string) => {
    setRouteRequest({ truck, pickup, drop });
  }, []);

  const handleReset = useCallback(() => {
    calc.reset();
    setRouteRequest(null);
    setLocations({ truck: '', pickup: '', drop: '' });
    setLocationResetKey(k => k + 1);
  }, [calc]);

  return (
    <>
      <SideMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        history={calc.history}
        onLoadHistory={(entry) => calc.loadFromHistory(entry)}
        onClearHistory={calc.clearHistory}
        calcCount={calc.calcCount}
      />

      {/* ===== App Shell ===== */}
      <div className="app-shell h-screen w-screen flex items-center justify-center overflow-hidden bg-[#121212]">
        <div className="flex flex-col bg-[#212121] rounded-[20px] overflow-hidden p-4" style={{ width: '900px', height: '900px' }}>

          {/* Header */}
          <header className="flex-shrink-0 flex items-center justify-between px-2 pb-4">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="p-2 text-[#b3b3b3] hover:text-white hover:bg-[#282828] rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="text-right mr-1">
              <span className="title-your text-3xl">YOUR</span>
              <p className="title-calc text-2xl -mt-1 italic">Freight Calculator</p>
            </div>
          </header>

          {/* Two-column body */}
          <div className="flex-1 min-h-0 flex gap-4">

            {/* LEFT COLUMN — two equal stacked panels */}
            <div className="w-1/2 flex flex-col gap-4 min-h-0">
              {/* Map */}
              <div className="flex-1 min-h-0 bg-[#282828] rounded-xl overflow-hidden">
                <RouteMap routeRequest={routeRequest} />
              </div>

              {/* Route Planner */}
              <div className="flex-1 min-h-0 bg-[#282828] rounded-xl p-5 flex flex-col">
                <p className="section-title text-xs uppercase tracking-wider mb-3 text-[#b3b3b3]">Route Planner</p>
                <div className="flex-1 flex flex-col justify-between">
                  <LocationInputs
                    key={locationResetKey}
                    onMilesCalculated={calc.setRouteMiles}
                    onLocationsChange={handleLocationsChange}
                    onRouteReady={handleRouteReady}
                  />
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN — Calculator (single tall panel) */}
            <div className="w-1/2 flex flex-col min-h-0">
              <div className="flex-1 min-h-0 bg-[#282828] rounded-xl p-5 flex flex-col">

                <ModeSelector current={calc.mode} onChange={calc.changeMode} />

                <div className="flex flex-col justify-evenly flex-1">
                  <InputRow
                    label={config.inputLabel}
                    icon={<DollarIcon />}
                    value={calc.primaryInput}
                    onChange={calc.setPrimaryInput}
                    placeholder={config.placeholder}
                  />
                  <InputRow
                    label="Total Miles"
                    icon={<MilesIcon />}
                    value={calc.miles}
                    onChange={calc.setMiles}
                    placeholder="e.g., 500"
                  />
                  <InputRow
                    label="Tonnage"
                    icon={<TonnageIcon />}
                    value={calc.tonnage}
                    onChange={calc.setTonnage}
                    disabled={isFlatMode}
                  />
                  <InputRow
                    label="FSC (%)"
                    icon={<FscIcon />}
                    value={calc.fsc}
                    onChange={calc.setFsc}
                    placeholder="e.g., 10"
                  />

                  <hr className="border-[#535353]" />

                  <InputRow
                    label={config.outputLabel}
                    icon={<DollarIcon />}
                    value={fmtOutput(calc.outputs.primaryOutput)}
                    onChange={() => {}}
                    readOnly
                    isOutput
                  />
                  <InputRow
                    label="FSC Total"
                    icon={<DollarIcon />}
                    value={fmtOutput(calc.outputs.fscAmount)}
                    onChange={() => {}}
                    readOnly
                    isOutput
                  />
                  <InputRow
                    label="Final Total"
                    icon={<DollarIcon />}
                    value={fmtOutput(calc.outputs.finalTotal)}
                    onChange={() => {}}
                    readOnly
                    isOutput
                  />
                </div>

                <ActionButtons
                  mode={calc.mode}
                  summary={calc.summary}
                  miles={calc.miles}
                  tonnage={calc.tonnage}
                  fsc={calc.fsc}
                  fscTotal={fmtOutput(calc.outputs.fscAmount)}
                  finalTotal={fmtOutput(calc.outputs.finalTotal)}
                  onReset={handleReset}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Area */}
      <div className="print-area hidden">
        <div className="print-area-content p-8">
          <h1 className="text-2xl font-bold mb-6">Your Freight Calculator — Summary</h1>

          <p className="mb-2 text-lg"><strong className="print-label w-48 inline-block">Date:</strong> {printDate}</p>
          <p className="mb-2 text-lg"><strong className="print-label w-48 inline-block">Calculation Mode:</strong> {config.label}</p>

          {(locations.truck || locations.pickup || locations.drop) && (
            <>
              <h2 className="text-lg font-bold mt-6 mb-3">Route</h2>
              {locations.truck && <p className="mb-2 text-lg"><strong className="print-label w-48 inline-block">Truck Location:</strong> {locations.truck}</p>}
              {locations.pickup && <p className="mb-2 text-lg"><strong className="print-label w-48 inline-block">Pickup Location:</strong> {locations.pickup}</p>}
              {locations.drop && <p className="mb-2 text-lg"><strong className="print-label w-48 inline-block">Drop Location:</strong> {locations.drop}</p>}
            </>
          )}

          {(calc.deadheadMiles > 0 || calc.loadedMiles > 0 || calc.miles) && (
            <>
              <h2 className="text-lg font-bold mt-6 mb-3">Mileage</h2>
              {calc.deadheadMiles > 0 && <p className="mb-2 text-lg"><strong className="print-label w-48 inline-block">Deadhead Miles:</strong> {calc.deadheadMiles.toFixed(1)}</p>}
              {calc.loadedMiles > 0 && <p className="mb-2 text-lg"><strong className="print-label w-48 inline-block">Loaded Miles:</strong> {calc.loadedMiles.toFixed(1)}</p>}
              {calc.miles && <p className="mb-2 text-lg"><strong className="print-label w-48 inline-block">Total Miles:</strong> {calc.miles}</p>}
            </>
          )}

          <h2 className="text-lg font-bold mt-6 mb-3">Rate Calculation</h2>
          <p className="mb-2 text-lg"><strong className="print-label w-48 inline-block">Tonnage:</strong> {calc.tonnage || ''}</p>
          <p className="mb-2 text-lg"><strong className="print-label w-48 inline-block">FSC (%):</strong> {calc.fsc || '0'}%</p>
          <p className="mb-2 text-lg"><strong className="print-label w-48 inline-block">{config.inputLabel}:</strong> {calc.primaryInput || ''}</p>
          <p className="mb-2 text-lg"><strong className="print-label w-48 inline-block">{config.outputLabel}:</strong> {fmtOutput(calc.outputs.primaryOutput) || ''}</p>
          <p className="mb-2 text-lg"><strong className="print-label w-48 inline-block">FSC Total:</strong> ${fmtOutput(calc.outputs.fscAmount) || '0.00'}</p>
          <p className="text-xl font-bold mt-4"><strong className="print-label w-48 inline-block">Final Total:</strong> ${fmtOutput(calc.outputs.finalTotal) || '0.00'}</p>
        </div>
      </div>
    </>
  );
}
