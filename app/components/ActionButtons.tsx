'use client';

import { useState } from 'react';
import { CalculationMode, MODE_CONFIG } from '../lib/types';
import { SummaryText } from '../lib/types';

interface Props {
  mode: CalculationMode;
  summary: SummaryText;
  miles: string;
  tonnage: string;
  fsc: string;
  fscTotal: string;
  finalTotal: string;
  onReset: () => void;
}

export default function ActionButtons({ mode, summary, miles, tonnage, fsc, fscTotal, finalTotal, onReset }: Props) {
  const [copyNotice, setCopyNotice] = useState('');

  const handleCopy = () => {
    const modeLabel = MODE_CONFIG[mode].label;
    const text = `Freight Calculation Summary:
- Mode: ${modeLabel}
- Miles: ${miles || 'N/A'}
- Tonnage: ${tonnage || 'N/A'}
- FSC: ${fsc || '0'}%
---
- Final Total: $${finalTotal || '0.00'}
- FSC Amount: $${fscTotal || '0.00'}
---
- ${summary.yourRateLabel} ${summary.yourRateValue}
- ${summary.offerLabel} ${summary.offerValue}`;

    navigator.clipboard.writeText(text).then(() => {
      setCopyNotice('Copied to clipboard!');
      setTimeout(() => setCopyNotice(''), 2000);
    });
  };

  const handleEmail = () => {
    const subject = 'Freight Quote';
    const body = `Hello,\n\nFollowing up on your request, here is our all-inclusive quote for the lane:\n\nRate: ${summary.offerValue}\n\nPlease let us know if you have any questions.\n\nThank you`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <div className="flex items-center justify-center space-x-3 pt-4">
        {mode === 'generateQuote' ? (
          <button type="button" onClick={handleEmail} className="action-btn btn-email">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Email
          </button>
        ) : (
          <button type="button" onClick={handlePrint} className="action-btn btn-print">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print
          </button>
        )}
        <button type="button" onClick={handleCopy} className="action-btn btn-copy">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Copy
        </button>
        <button type="button" onClick={onReset} className="action-btn btn-reset">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Reset
        </button>
      </div>
      <div className={`text-center text-[#1DB954] font-semibold text-sm mt-2 h-5 transition-opacity duration-300 ${copyNotice ? 'opacity-100' : 'opacity-0'}`}>
        {copyNotice}
      </div>
    </>
  );
}
