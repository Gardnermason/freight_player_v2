import { CalculationMode, CalculationInputs, CalculationOutputs, SummaryText } from './types';

export function calculate(mode: CalculationMode, inputs: CalculationInputs): CalculationOutputs {
  const { primaryInput, miles, tonnage, fscPercent } = inputs;

  let lineHaul = 0;
  switch (mode) {
    case 'generateQuote':
      lineHaul = primaryInput * miles;
      break;
    case 'calculateFromTon':
      lineHaul = primaryInput * tonnage;
      break;
    case 'calculateFromFlat':
      lineHaul = primaryInput;
      break;
  }

  const fscAmount = lineHaul * (fscPercent / 100);
  const total = lineHaul + fscAmount;

  let primaryOutput = 0;
  switch (mode) {
    case 'generateQuote':
      primaryOutput = total > 0 ? total / tonnage : 0;
      break;
    case 'calculateFromTon':
    case 'calculateFromFlat':
      primaryOutput = miles > 0 ? total / miles : 0;
      break;
  }

  return { primaryOutput, fscAmount, finalTotal: total };
}

export function getSummaryText(
  mode: CalculationMode,
  primaryInputVal: string,
  milesVal: string,
  tonnageVal: string,
  fscVal: string
): SummaryText {
  const pInput = parseFloat(primaryInputVal) || 0;
  const miles = parseFloat(milesVal) || 0;
  const tonnage = parseFloat(tonnageVal) || 23;
  const fscPercent = parseFloat(fscVal) || 0;

  const outputs = calculate(mode, { primaryInput: pInput, miles, tonnage, fscPercent });

  if (mode === 'generateQuote') {
    return {
      yourRateLabel: 'Your Rate:',
      yourRateValue: `$${pInput.toFixed(2)} / mile`,
      offerLabel: 'Quote to Customer:',
      offerValue: `$${outputs.primaryOutput.toFixed(2)} / ton`,
    };
  }

  return {
    yourRateLabel: 'Your Calculated Rate:',
    yourRateValue: `$${outputs.primaryOutput.toFixed(2)} / mile`,
    offerLabel: 'Customer Offer:',
    offerValue: mode === 'calculateFromTon'
      ? `$${pInput.toFixed(2)} / ton`
      : `$${pInput.toFixed(2)} (Flat)`,
  };
}
