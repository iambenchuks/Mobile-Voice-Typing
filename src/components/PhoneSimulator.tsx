import React, { useState, useRef, useEffect } from 'react';
import {
  Wifi,
  Battery,
  Signal,
  MessageSquare,
  Search,
  Sparkles,
  FileText,
  Layers,
  Volume2,
  Undo2,
  Trash2,
  Zap,
} from 'lucide-react';
import { SimulatedAppId, DictationSettings } from '../types';
import { GeminiChatApp } from './simulated_apps/GeminiChatApp';
import { GoogleSearchApp } from './simulated_apps/GoogleSearchApp';
import { WhatsAppChatApp } from './simulated_apps/WhatsAppChatApp';
import { KeepNotesApp } from './simulated_apps/KeepNotesApp';
import { CustomSandboxApp } from './simulated_apps/CustomSandboxApp';
import { FloatingWatermarkPill } from './FloatingWatermarkPill';
import { speechAudioEngine, formatSpokenPunctuation } from '../services/speechEngine';

interface PhoneSimulatorProps {
  settings: DictationSettings;
  onUpdateSettings: (newSettings: Partial<DictationSettings>) => void;
  onNewDictationLog: (text: string, targetApp: string) => void;
}

export const PhoneSimulator: React.FC<PhoneSimulatorProps> = ({
  settings,
  onUpdateSettings,
  onNewDictationLog,
}) => {
  const [activeApp, setActiveApp] = useState<SimulatedAppId>('gemini');
  const [activeFocusedFieldId, setActiveFocusedFieldId] = useState<string | null>('gemini-input-field');
  const [inputText, setInputText] = useState<string>('What is the best offline model for mobile speech recognition?');
  const [isListening, setIsListening] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [watermarkPillVisible, setWatermarkPillVisible] = useState(true);

  const phoneScreenRef = useRef<HTMLDivElement>(null);
  const dictationStartTimeRef = useRef<number>(0);

  // When a text field is focused in any app, simulate Android AccessibilityService detecting focus
  const handleInputFocus = (targetId: string, elementRect?: DOMRect) => {
    setActiveFocusedFieldId(targetId);
    setWatermarkPillVisible(true);
  };

  const handleInputChange = (val: string) => {
    setInputText(val);
  };

  // Toggle voice recognition
  const toggleListening = async () => {
    if (isListening) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const startRecording = async () => {
    setIsListening(true);
    setLiveTranscript('');
    dictationStartTimeRef.current = Date.now();

    await speechAudioEngine.start(
      (transcript, isFinal) => {
        setLiveTranscript(transcript);
        // Live streaming injection into focused input field!
        setInputText(transcript);

        if (isFinal) {
          const duration = Date.now() - dictationStartTimeRef.current;
          onNewDictationLog(transcript, activeApp);
        }
      },
      (level) => {
        setAudioLevel(level);
      }
    );
  };

  const stopRecording = () => {
    setIsListening(false);
    speechAudioEngine.stop();

    if (liveTranscript.trim()) {
      onNewDictationLog(liveTranscript.trim(), activeApp);
    }
  };

  // Preset voice test phrases (useful for testing punctuation and instant injection)
  const sampleVoicePhrases = [
    {
      label: 'Question with comma',
      phrase: 'Hey Gemini comma what is the lightest offline Whisper model question mark',
    },
    {
      label: 'Dictate Note with Newline',
      phrase: 'Meeting action items colon new line test ScribeFlow offline accuracy new line verify watermark transparency period',
    },
    {
      label: 'Chat Message',
      phrase: 'Hey Jordan comma I am testing ScribeFlow on my Android phone right now period Works 100% offline exclamation mark',
    },
  ];

  const injectSamplePhrase = (phrase: string) => {
    const formatted = formatSpokenPunctuation(phrase, settings.smartCapitalization);
    setInputText((prev) => (prev ? `${prev} ${formatted}` : formatted));
    setLiveTranscript(formatted);
    onNewDictationLog(formatted, activeApp);
  };

  const clearCurrentInput = () => {
    setInputText('');
    setLiveTranscript('');
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6 items-center justify-center w-full">
      {/* Android Device Chassis Frame */}
      <div className="relative w-full max-w-[380px] sm:max-w-[400px] h-[780px] rounded-[48px] bg-slate-900 p-3 shadow-2xl border-4 border-slate-700/80 ring-1 ring-white/10 flex flex-col shrink-0 select-none">
        {/* Hardware side buttons decoration */}
        <div className="absolute -left-4.5 top-28 w-1 h-12 bg-slate-700 rounded-l-md" title="Volume Up" />
        <div className="absolute -left-4.5 top-44 w-1 h-12 bg-slate-700 rounded-l-md" title="Volume Down" />
        <div className="absolute -right-4.5 top-36 w-1 h-16 bg-slate-700 rounded-r-md" title="Power Key" />

        {/* Screen Bezel Area */}
        <div
          ref={phoneScreenRef}
          className="relative flex-1 w-full h-full bg-slate-950 rounded-[38px] overflow-hidden flex flex-col border border-slate-800"
        >
          {/* Top Camera Punch Hole & Android Status Bar */}
          <div className="h-9 px-6 bg-transparent flex items-center justify-between text-xs text-slate-300 z-30 shrink-0">
            {/* Time */}
            <span className="font-semibold text-xs text-white tracking-tight">18:14</span>

            {/* Center Punch-Hole Camera */}
            <div className="w-4 h-4 rounded-full bg-black border border-slate-800/80 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-900" />
            </div>

            {/* Status Icons */}
            <div className="flex items-center gap-1.5 text-slate-300">
              <Signal className="w-3.5 h-3.5 text-slate-200" />
              <Wifi className="w-3.5 h-3.5 text-slate-200" />
              <Battery className="w-4 h-4 text-slate-200" />
            </div>
          </div>

          {/* App Switcher Tabs Header (Inside Android OS) */}
          <div className="flex items-center justify-between px-2 py-1.5 bg-slate-900/90 border-b border-slate-800 shrink-0 z-20">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
              <button
                onClick={() => setActiveApp('gemini')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors flex items-center gap-1 shrink-0 ${
                  activeApp === 'gemini'
                    ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3 h-3 text-blue-400" />
                Gemini
              </button>
              <button
                onClick={() => setActiveApp('search')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors flex items-center gap-1 shrink-0 ${
                  activeApp === 'search'
                    ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Search className="w-3 h-3 text-amber-400" />
                Search
              </button>
              <button
                onClick={() => setActiveApp('whatsapp')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors flex items-center gap-1 shrink-0 ${
                  activeApp === 'whatsapp'
                    ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <MessageSquare className="w-3 h-3 text-emerald-400" />
                WhatsApp
              </button>
              <button
                onClick={() => setActiveApp('notes')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors flex items-center gap-1 shrink-0 ${
                  activeApp === 'notes'
                    ? 'bg-yellow-600/30 text-yellow-300 border border-yellow-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3 h-3 text-yellow-400" />
                Notes
              </button>
              <button
                onClick={() => setActiveApp('sandbox')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors flex items-center gap-1 shrink-0 ${
                  activeApp === 'sandbox'
                    ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3 h-3 text-cyan-400" />
                Multi-Form
              </button>
            </div>
          </div>

          {/* Active Simulated Application Viewport */}
          <div className="relative flex-1 w-full overflow-hidden">
            {activeApp === 'gemini' && (
              <GeminiChatApp
                onInputFocus={handleInputFocus}
                onInputChange={handleInputChange}
                currentInputText={inputText}
                setInputText={setInputText}
              />
            )}
            {activeApp === 'search' && (
              <GoogleSearchApp
                onInputFocus={handleInputFocus}
                onInputChange={handleInputChange}
                currentInputText={inputText}
                setInputText={setInputText}
              />
            )}
            {activeApp === 'whatsapp' && (
              <WhatsAppChatApp
                onInputFocus={handleInputFocus}
                onInputChange={handleInputChange}
                currentInputText={inputText}
                setInputText={setInputText}
              />
            )}
            {activeApp === 'notes' && (
              <KeepNotesApp
                onInputFocus={handleInputFocus}
                onInputChange={handleInputChange}
                currentInputText={inputText}
                setInputText={setInputText}
              />
            )}
            {activeApp === 'sandbox' && (
              <CustomSandboxApp
                onInputFocus={handleInputFocus}
                onInputChange={handleInputChange}
                currentInputText={inputText}
                setInputText={setInputText}
                activeFocusId={activeFocusedFieldId}
              />
            )}

            {/* The Authentic WhisperFlow Floating Translucent Watermark Pill */}
            {watermarkPillVisible && (
              <FloatingWatermarkPill
                isListening={isListening}
                onToggleListening={toggleListening}
                audioLevel={audioLevel}
                watermarkOpacity={settings.watermarkOpacity}
                onOpacityChange={(newVal) => onUpdateSettings({ watermarkOpacity: newVal })}
                currentTranscript={liveTranscript}
                isFocused={Boolean(activeFocusedFieldId)}
                containerRef={phoneScreenRef}
              />
            )}
          </div>

          {/* Android Navigation Gesture Pill Bar */}
          <div className="h-6 w-full flex items-center justify-center bg-transparent z-30 shrink-0">
            <div className="w-32 h-1 bg-slate-500/60 rounded-full" />
          </div>
        </div>
      </div>

      {/* Control Bench & Live Dictation Inspector */}
      <div className="flex-1 max-w-xl space-y-4 text-slate-200">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
                <span>ScribeFlow Floating Watermark Engine</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Emulating Android's <code className="text-cyan-300 font-mono">AccessibilityService</code> & <code className="text-cyan-300 font-mono">WindowManager.TYPE_APPLICATION_OVERLAY</code>
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="font-mono text-[11px] text-cyan-400">Whisper Tiny.en</span>
              <span className="text-slate-600">·</span>
              <span className="text-[11px] text-emerald-400">100% Offline</span>
            </div>
          </div>

          {/* Quick Voice Simulation / Verbal Dictation Trigger */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="font-medium">1-Click Voice Dictation Presets (Instant Injection):</span>
              <button
                onClick={clearCurrentInput}
                className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                Clear Text
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {sampleVoicePhrases.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => injectSamplePhrase(item.phrase)}
                  className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-left transition-all group"
                >
                  <div className="text-[11px] font-semibold text-cyan-300 group-hover:text-cyan-200">
                    {item.label}
                  </div>
                  <div className="text-[10px] text-slate-400 line-clamp-2 mt-0.5 leading-snug">
                    "{item.phrase}"
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Real Live Microphone Button */}
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleListening}
                className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-all ${
                  isListening
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30 animate-pulse'
                    : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
                }`}
              >
                <Volume2 className="w-5 h-5" />
              </button>
              <div>
                <div className="text-xs font-semibold text-white">
                  {isListening ? 'Listening via Microphone (Speak now)...' : 'Test Real Microphone Audio'}
                </div>
                <div className="text-[11px] text-slate-400">
                  {isListening
                    ? 'Say "comma", "period", "question mark", "new line" to test punctuation!'
                    : 'Tap microphone or tap the floating watermark bubble inside the phone.'}
                </div>
              </div>
            </div>

            {isListening && (
              <div className="flex items-center gap-1 px-3 py-1 bg-cyan-500/10 border border-cyan-400/30 rounded-full text-[11px] text-cyan-300 font-mono">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                Live Audio Wave
              </div>
            )}
          </div>

          {/* Watermark Transparency Slider */}
          <div className="space-y-1.5 p-3 bg-slate-950/40 rounded-xl border border-slate-800/60">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Floating Watermark Transparency:</span>
              <span className="text-cyan-400 font-mono font-semibold">
                {Math.round(settings.watermarkOpacity * 100)}% Opacity
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
              <span>Ultra-see-through watermark (15%)</span>
              <span>Balanced (55%)</span>
              <span>Solid pill (90%)</span>
            </div>
          </div>
        </div>

        {/* Real-time Field Injection Log */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-semibold text-white">Active Text Injection Stream</span>
            <span className="text-[10px] text-slate-500">
              Target: <code className="text-cyan-300 font-mono">{activeFocusedFieldId || 'none'}</code> in <span className="uppercase text-slate-300">{activeApp}</span>
            </span>
          </div>
          <div className="p-2.5 bg-slate-950 rounded-xl font-mono text-[11px] text-slate-200 border border-slate-800/80 min-h-[48px] max-h-[80px] overflow-y-auto whitespace-pre-wrap leading-relaxed">
            {inputText || <span className="text-slate-600 italic">No text in focused field...</span>}
          </div>
        </div>
      </div>
    </div>
  );
};
