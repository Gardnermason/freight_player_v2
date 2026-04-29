'use client';

import { useState } from 'react';
import { HistoryEntry, MODE_CONFIG } from '../lib/types';
import { getSummaryText } from '../lib/calculations';

type View = 'main' | 'history' | 'feedback';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryEntry[];
  onLoadHistory: (entry: HistoryEntry) => void;
  onClearHistory: () => void;
  calcCount: number;
}

export default function SideMenu({
  isOpen, onClose,
  history, onLoadHistory, onClearHistory, calcCount,
}: Props) {
  const [view, setView] = useState<View>('main');

  const close = () => {
    onClose();
    setView('main');
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 z-30 transition-opacity"
        style={{ opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? 'auto' : 'none' }}
        onClick={close}
      />

      {/* Menu Panel */}
      <div
        className="fixed top-0 left-0 h-full w-80 bg-[#212121] shadow-2xl z-40 transition-transform duration-300"
        style={{ transform: isOpen ? 'translateX(0)' : 'translateX(-100%)' }}
      >
        <div className="p-5 flex flex-col h-full relative">
          {/* Main Menu */}
          <div className={view !== 'main' ? 'hidden' : ''}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Menu</h2>
              <button onClick={close} className="p-1 rounded-full hover:bg-[#282828]">
                <svg className="w-6 h-6 text-[#b3b3b3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav>
              <a href="#" onClick={(e) => { e.preventDefault(); setView('history'); }} className="flex items-center p-3 text-lg text-[#b3b3b3] rounded-lg hover:bg-[#282828] hover:text-white">
                <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Recent Calculations
              </a>
              <a href="#" onClick={(e) => { e.preventDefault(); setView('feedback'); }} className="flex items-center p-3 text-lg text-[#b3b3b3] rounded-lg hover:bg-[#282828] hover:text-white">
                <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                Send Feedback
              </a>
            </nav>
          </div>

          {/* Counter */}
          {view === 'main' && (
            <div className="mt-auto p-4 border-t border-[#535353]">
              <h3 className="text-lg font-semibold text-center text-[#b3b3b3]">Calculation Counter</h3>
              <p className="text-4xl font-bold text-center text-[#0EA5E9] mt-2">
                {calcCount.toLocaleString()}
              </p>
              <p className="text-center text-xs text-[#535353] mt-2">Version 3.0</p>
            </div>
          )}

          {/* History View */}
          {view === 'history' && (
            <div className="absolute inset-0 bg-[#212121] p-5 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <button onClick={() => setView('main')} className="p-1 rounded-full hover:bg-[#282828]">
                  <svg className="w-6 h-6 text-[#b3b3b3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h3 className="text-xl font-bold text-center text-white">History</h3>
                <div className="w-6" />
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto flex-1">
                {history.length === 0 ? (
                  <p className="text-center text-[#b3b3b3]">No recent calculations.</p>
                ) : (
                  history.map((entry, i) => {
                    const s = getSummaryText(entry.mode, entry.primaryInput, entry.miles, entry.tonnage, entry.fsc);
                    return (
                      <button
                        key={i}
                        onClick={() => { onLoadHistory(entry); close(); }}
                        className="w-full text-left p-3 rounded-lg hover:bg-[#282828]"
                      >
                        <div className="font-bold text-white">
                          {MODE_CONFIG[entry.mode].label}
                        </div>
                        <div className="text-sm text-[#b3b3b3]">
                          Rate: {s.yourRateValue} | Offer: {s.offerValue}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
              <button onClick={onClearHistory} className="w-full mt-4 bg-[#E5173F] hover:bg-[#c0132f] text-white font-bold py-2 px-4 rounded-full">
                Clear History
              </button>
            </div>
          )}

          {/* Feedback View */}
          {view === 'feedback' && (
            <div className="absolute inset-0 bg-[#212121] p-5">
              <div className="flex justify-between items-center mb-4">
                <button onClick={() => setView('main')} className="p-1 rounded-full hover:bg-[#282828]">
                  <svg className="w-6 h-6 text-[#b3b3b3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h3 className="text-xl font-bold text-center text-white">Feedback</h3>
                <div className="w-6" />
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const textarea = form.querySelector('textarea') as HTMLTextAreaElement;
                  const message = textarea.value.trim();
                  if (message) {
                    window.location.href = `mailto:mgardner@thompsontrans.net?subject=${encodeURIComponent('Feedback for Freight Calculator')}&body=${encodeURIComponent(message)}`;
                  }
                }}
                className="space-y-4"
              >
                <textarea
                  placeholder="Your feedback..."
                  rows={5}
                  className="w-full p-3 border border-[#535353] rounded-lg bg-[#282828] text-white placeholder-[#b3b3b3] focus:outline-none focus:border-[#0EA5E9]"
                />
                <button type="submit" className="w-full bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-bold py-2 px-4 rounded-full">
                  Send
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
