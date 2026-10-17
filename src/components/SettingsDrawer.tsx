import React from 'react';
import { DictationSettings } from '../types';
import { Settings, X, Sliders, Volume2, ShieldCheck, Sparkles, Cpu } from 'lucide-react';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  settings: DictationSettings;
  onUpdateSettings: (newSettings: Partial<DictationSettings>) => void;
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-md h-full bg-slate-900 border-l border-slate-800 shadow-2xl p-6 flex flex-col justify-between overflow-y-auto">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-cyan-500/10 border border-cyan-400/20 rounded-xl text-cyan-400">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white tracking-tight">ScribeFlow Settings</h3>
                <p className="text-xs text-slate-400">Floating Watermark & Offline Speech Preferences</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Section 1: Watermark Appearance */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              Watermark Appearance & Transparency
            </h4>

            <div className="p-4 bg-slate-950/70 rounded-2xl border border-slate-800/80 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-medium">Watermark Opacity</span>
                <span className="font-mono text-cyan-400 font-semibold">
                  {Math.round(settings.watermarkOpacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0.15}
                max={0.9}
                step={0.05}
                value={settings.watermarkOpacity}
                onChange={(e) => onUpdateSettings({ watermarkOpacity: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Stealth (15%)</span>
                <span>Translucent (55%)</span>
                <span>Solid (90%)</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed pt-1 border-t border-slate-800/60">
                Controls the floating pill's alpha transparency so text underneath remains legible in all apps.
              </p>
            </div>
          </div>

          {/* Section 2: Speech & Spoken Punctuation */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Spoken Dictation & Punctuation
            </h4>

            <div className="p-4 bg-slate-950/70 rounded-2xl border border-slate-800/80 space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="text-xs font-medium text-white">Voice Punctuation Formatting</div>
                  <div className="text-[11px] text-slate-400">
                    Turns spoken "comma", "period", "question mark" into punctuation
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoPunctuation}
                  onChange={(e) => onUpdateSettings({ autoPunctuation: e.target.checked })}
                  className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
                />
              </label>

              <div className="h-px bg-slate-800/80" />

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="text-xs font-medium text-white">Smart Sentence Capitalization</div>
                  <div className="text-[11px] text-slate-400">
                    Capitalizes start of sentences after periods &amp; newlines
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.smartCapitalization}
                  onChange={(e) => onUpdateSettings({ smartCapitalization: e.target.checked })}
                  className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
                />
              </label>

              <div className="h-px bg-slate-800/80" />

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="text-xs font-medium text-white">Live Waveform Rings</div>
                  <div className="text-[11px] text-slate-400">
                    Display soundwave bars inside the watermark bubble
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showWaveform}
                  onChange={(e) => onUpdateSettings({ showWaveform: e.target.checked })}
                  className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Section 3: Selected Offline Model */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              Target Mobile Model
            </h4>

            <div className="space-y-2">
              {[
                {
                  id: 'whisper-tiny-en',
                  name: 'Whisper-Tiny.en (INT8)',
                  size: '39 MB',
                  desc: 'Handy-grade OpenAI Whisper quantized for ARM64 mobile processors.',
                },
                {
                  id: 'sherpa-onnx-int8',
                  name: 'Sherpa-ONNX Zipformer-en',
                  size: '25 MB',
                  desc: 'Real-time streaming model with ultra-low ~80ms speech latency.',
                },
                {
                  id: 'vosk-small-en',
                  name: 'Vosk Small English',
                  size: '35 MB',
                  desc: 'Traditional Kaldi-based offline speech recognizer.',
                },
              ].map((model) => (
                <div
                  key={model.id}
                  onClick={() => onUpdateSettings({ selectedModel: model.id as any })}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    settings.selectedModel === model.id
                      ? 'bg-cyan-950/40 border-cyan-500/50 text-white'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">{model.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300">
                      {model.size}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">{model.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            Apply &amp; Return to Sandbox
          </button>
        </div>
      </div>
    </div>
  );
};
