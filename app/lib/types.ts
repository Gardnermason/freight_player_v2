export type CalculationMode = 'generateQuote' | 'calculateFromTon' | 'calculateFromFlat';

export interface CalculationInputs {
  primaryInput: number;
  miles: number;
  tonnage: number;
  fscPercent: number;
}

export interface CalculationOutputs {
  primaryOutput: number;
  fscAmount: number;
  finalTotal: number;
}

export interface HistoryEntry {
  mode: CalculationMode;
  primaryInput: string;
  miles: string;
  tonnage: string;
  fsc: string;
  timestamp: string;
}

export interface SummaryText {
  yourRateLabel: string;
  yourRateValue: string;
  offerLabel: string;
  offerValue: string;
}

export const MODE_CONFIG: Record<CalculationMode, {
  label: string;
  inputLabel: string;
  outputLabel: string;
  placeholder: string;
}> = {
  generateQuote: {
    label: 'Generate Quote',
    inputLabel: 'Your Rate ($/Mile)',
    outputLabel: 'Quote ($/Ton)',
    placeholder: 'e.g., 3.50',
  },
  calculateFromTon: {
    label: 'Calc from Ton',
    inputLabel: 'Offer ($/Ton)',
    outputLabel: 'Your Rate ($/Mile)',
    placeholder: 'e.g., 150.00',
  },
  calculateFromFlat: {
    label: 'Calc from Flat',
    inputLabel: 'Flat Rate Offer ($)',
    outputLabel: 'Your Rate ($/Mile)',
    placeholder: 'e.g., 3000.00',
  },
};
