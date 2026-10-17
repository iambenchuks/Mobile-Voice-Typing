import React, { useState } from 'react';
import { Search, Globe, TrendingUp, History, ArrowRight } from 'lucide-react';

interface GoogleSearchAppProps {
  onInputFocus: (targetId: string, elementRect?: DOMRect) => void;
  onInputChange: (value: string) => void;
  currentInputText: string;
  setInputText: (text: string) => void;
}

export const GoogleSearchApp: React.FC<GoogleSearchAppProps> = ({
  onInputFocus,
  onInputChange,
  currentInputText,
  setInputText,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'images' | 'news'>('all');
  const [hasSearched, setHasSearched] = useState(false);

  const sampleTrending = [
    'whisper tiny offline english apk',
    'how does scribeflow floating icon work android',
    'handy speech to text shortcut keys',
    'android accessibility service input focus listener',
  ];

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (currentInputText.trim()) {
      setHasSearched(true);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#202124] text-slate-100 select-none overflow-y-auto">
      {/* Top Google Branding / Search Header */}
      <div className="p-4 pt-6 flex flex-col items-center">
        {!hasSearched ? (
          <div className="my-6 text-center">
            <span className="text-3xl font-bold tracking-tight text-white flex items-center justify-center gap-1">
              <span className="text-blue-400">G</span>
              <span className="text-red-400">o</span>
              <span className="text-amber-400">o</span>
              <span className="text-blue-400">g</span>
              <span className="text-emerald-400">l</span>
              <span className="text-red-400">e</span>
            </span>
            <p className="text-[11px] text-slate-400 mt-1">Search the web or dictate via ScribeFlow</p>
          </div>
        ) : (
          <div className="w-full flex items-center justify-between pb-3 border-b border-slate-700 mb-3">
            <span className="text-lg font-bold text-blue-400">Google</span>
            <button
              onClick={() => {
                setHasSearched(false);
                setInputText('');
              }}
              className="text-xs text-slate-400 hover:text-white"
            >
              Clear
            </button>
          </div>
        )}

        {/* Search Bar Input */}
        <form onSubmit={handleSearchSubmit} className="w-full relative">
          <div className="flex items-center bg-[#303134] rounded-full px-4 py-3 border border-slate-700 focus-within:border-blue-400 focus-within:shadow-md transition-all">
            <Search className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
            <input
              id="google-search-field"
              type="text"
              value={currentInputText}
              onChange={(e) => {
                setInputText(e.target.value);
                onInputChange(e.target.value);
              }}
              onFocus={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                onInputFocus('google-search-field', rect);
              }}
              placeholder="Search or type URL..."
              className="w-full bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none"
            />
            {currentInputText && (
              <button
                type="submit"
                className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white shrink-0 ml-1"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Body content */}
      <div className="flex-1 px-4 pb-6">
        {hasSearched ? (
          <div className="space-y-4">
            <div className="text-xs text-slate-400">
              Showing simulated results for <strong className="text-white">"{currentInputText}"</strong>
            </div>

            <div className="p-3 bg-[#303134] rounded-xl border border-slate-700/60">
              <span className="text-[10px] text-emerald-400 block">https://scribeflow.org/android</span>
              <h4 className="text-sm font-semibold text-blue-400 hover:underline cursor-pointer mt-0.5">
                ScribeFlow Mobile: Ultra-Lightweight Offline English STT
              </h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Seamless floating watermark bubble triggered automatically upon text field focus. 100% on-device speech processing with zero cloud latency.
              </p>
            </div>

            <div className="p-3 bg-[#303134] rounded-xl border border-slate-700/60">
              <span className="text-[10px] text-emerald-400 block">https://developer.android.com/reference</span>
              <h4 className="text-sm font-semibold text-blue-400 hover:underline cursor-pointer mt-0.5">
                AccessibilityService & TYPE_VIEW_FOCUSED Guide
              </h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Inspect how accessibility event broadcasts enable overlay assistants to identify active input targets and inject characters safely.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
              <span>Trending Searches</span>
            </div>
            <div className="space-y-2">
              {sampleTrending.map((query, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInputText(query);
                    onInputChange(query);
                    onInputFocus('google-search-field');
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg bg-[#303134]/40 hover:bg-[#303134] border border-slate-700/30 flex items-center justify-between text-xs text-slate-300 transition-colors"
                >
                  <span className="truncate">{query}</span>
                  <History className="w-3.5 h-3.5 text-slate-500 shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
