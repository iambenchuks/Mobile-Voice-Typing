import React, { useState } from 'react';
import {
  Smartphone,
  Download,
  Code2,
  Cpu,
  BookOpen,
  Settings,
  ShieldCheck,
  Zap,
  Mic,
  Sliders,
  Check,
} from 'lucide-react';
import { DictationSettings, DictationHistoryItem } from './types';
import { PhoneSimulator } from './components/PhoneSimulator';
import { AndroidCodeViewer } from './components/AndroidCodeViewer';
import { ModelBenchmarking } from './components/ModelBenchmarking';
import { InstallationGuideModal } from './components/InstallationGuideModal';
import { SettingsDrawer } from './components/SettingsDrawer';
import { generateAndroidProjectZip } from './services/androidProjectGenerator';

export default function App() {
  const [activeTab, setActiveTab] = useState<'simulator' | 'code' | 'models' | 'guide'>('simulator');
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [settings, setSettings] = useState<DictationSettings>({
    watermarkOpacity: 0.55,
    autoPunctuation: true,
    smartCapitalization: true,
    showWaveform: true,
    hapticFeedback: true,
    edgeSnapping: true,
    triggerMode: 'auto-focus',
    selectedModel: 'whisper-tiny-en',
  });

  const [dictationHistory, setDictationHistory] = useState<DictationHistoryItem[]>([
    {
      id: '1',
      text: 'WhisperFlow automatically appears when you tap any text field in Gemini or WhatsApp.',
      timestamp: '18:12',
      targetApp: 'gemini',
      durationMs: 3200,
      wordCount: 13,
    },
    {
      id: '2',
      text: 'Running Whisper Tiny English on-device with zero internet latency.',
      timestamp: '18:10',
      targetApp: 'notes',
      durationMs: 2400,
      wordCount: 10,
    },
  ]);

  const handleUpdateSettings = (newSettings: Partial<DictationSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const handleNewDictationLog = (text: string, targetApp: string) => {
    if (!text.trim()) return;
    const newItem: DictationHistoryItem = {
      id: Date.now().toString(),
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      targetApp,
      durationMs: 2800,
      wordCount: text.split(/\s+/).filter(Boolean).length,
    };
    setDictationHistory((prev) => [newItem, ...prev.slice(0, 19)]);
  };

  const handleDownloadZip = async () => {
    try {
      setIsExporting(true);
      const blob = await generateAndroidProjectZip();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'WhisperFlow-Android-Offline-Project.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to create ZIP', e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Universal Top Bar Contract: 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-40 flex items-center justify-between gap-8 px-6 py-3.5 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('simulator');
          }}
          className="text-base sm:text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-sm">
            <Mic className="w-4 h-4" />
          </div>
          <span>WhisperFlow Mobile</span>
        </a>

        {/* Zone 2: 4-5 single-line clean text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-xs sm:text-sm font-medium text-slate-400">
          <button
            onClick={() => setActiveTab('simulator')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'simulator' ? 'text-cyan-400 font-semibold' : 'hover:text-slate-200'
            }`}
          >
            Android Simulator
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'code' ? 'text-cyan-400 font-semibold' : 'hover:text-slate-200'
            }`}
          >
            Android Source Code
          </button>
          <button
            onClick={() => setActiveTab('models')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'models' ? 'text-cyan-400 font-semibold' : 'hover:text-slate-200'
            }`}
          >
            Offline English Models
          </button>
          <button
            onClick={() => setIsGuideOpen(true)}
            className="whitespace-nowrap shrink-0 hover:text-slate-200 transition-colors"
          >
            APK Build Guide
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="App Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={handleDownloadZip}
            disabled={isExporting}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-sm flex items-center gap-1.5 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Generating ZIP...' : 'Export Android Project'}</span>
          </button>
        </div>
      </header>

      {/* Hero Banner with Proof adjacency */}
      <section className="px-6 py-6 border-b border-slate-800/80 bg-gradient-to-b from-slate-900/40 to-transparent">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>Offline Floating Voice Dictation for Android</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
              Works like <strong>Handy</strong> on your desktop laptop, built natively for Android phones. Features a translucent watermark floating icon that appears whenever you tap a text field in Gemini, Google Search, WhatsApp, or any app.
            </p>
          </div>

          {/* Quick specs strip */}
          <div className="flex items-center gap-4 text-xs font-mono text-slate-400 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>100% Offline English</span>
            </div>
            <span>·</span>
            <div>
              <span className="text-slate-200 font-semibold">39 MB</span> INT8 Footprint
            </div>
            <span>·</span>
            <div>
              <span className="text-cyan-400 font-semibold">~120ms</span> Latency
            </div>
          </div>
        </div>
      </section>

      {/* Main Interactive Work Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {/* Navigation Tab Bar for mobile/quick toggles */}
        <div className="flex md:hidden items-center gap-2 p-1 bg-slate-900 rounded-xl mb-6 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('simulator')}
            className={`flex-1 py-2 px-3 rounded-lg font-medium whitespace-nowrap ${
              activeTab === 'simulator' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400'
            }`}
          >
            Simulator
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`flex-1 py-2 px-3 rounded-lg font-medium whitespace-nowrap ${
              activeTab === 'code' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400'
            }`}
          >
            Source Code
          </button>
          <button
            onClick={() => setActiveTab('models')}
            className={`flex-1 py-2 px-3 rounded-lg font-medium whitespace-nowrap ${
              activeTab === 'models' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400'
            }`}
          >
            Models
          </button>
          <button
            onClick={() => setIsGuideOpen(true)}
            className="flex-1 py-2 px-3 rounded-lg text-slate-400 font-medium whitespace-nowrap"
          >
            Guide
          </button>
        </div>

        {/* Tab 1: Android Device Simulator & Watermark Sandbox */}
        {activeTab === 'simulator' && (
          <div className="space-y-6">
            <PhoneSimulator
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onNewDictationLog={handleNewDictationLog}
            />

            {/* Dictation History Log */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">Recent Dictation Stream &amp; Injections</span>
                <span className="text-slate-500 font-mono text-[11px]">
                  {dictationHistory.length} transcribes logged
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {dictationHistory.slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span className="uppercase text-cyan-400 font-semibold font-mono">
                        {item.targetApp}
                      </span>
                      <span>{item.timestamp} · {item.wordCount} words</span>
                    </div>
                    <p className="text-slate-200 text-xs leading-relaxed font-sans font-normal">
                      "{item.text}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Android Native Source Code Viewer */}
        {activeTab === 'code' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold text-white">Android Source Code Architecture</h2>
                <p className="text-xs text-slate-400">
                  Inspect the Kotlin services for global accessibility hooks, floating watermark overlays, and offline speech decoding.
                </p>
              </div>
              <button
                onClick={() => setIsGuideOpen(true)}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 shrink-0"
              >
                <BookOpen className="w-3.5 h-3.5" />
                View Build Instructions
              </button>
            </div>
            <AndroidCodeViewer />
          </div>
        )}

        {/* Tab 3: Offline English Models Benchmark */}
        {activeTab === 'models' && <ModelBenchmarking />}
      </main>

      {/* Footer */}
      <footer className="mt-auto px-6 py-5 border-t border-slate-800 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">WhisperFlow Mobile</span>
          <span>·</span>
          <span>100% Offline English Voice Dictation for Android</span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span>AccessibilityService API</span>
          <span>·</span>
          <span>TYPE_APPLICATION_OVERLAY</span>
          <span>·</span>
          <span>Sherpa-ONNX Whisper Tiny.en</span>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <InstallationGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        onDownloadZip={handleDownloadZip}
      />

      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />
    </div>
  );
}
