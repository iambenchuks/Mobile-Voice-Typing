import React from 'react';
import { Cpu, Zap, HardDrive, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

export const ModelBenchmarking: React.FC = () => {
  const models = [
    {
      name: 'Whisper-Tiny.en (INT8 Quantized)',
      architecture: 'Transformer Encoder-Decoder (OpenAI)',
      runtime: 'Sherpa-ONNX / ONNX Runtime Mobile',
      size: '39 MB',
      ram: '~85 MB active RAM',
      latency: '~120-150ms RTF',
      offline: '100% On-Device',
      status: 'Recommended for ScribeFlow',
      isHero: true,
      notes: 'Optimized specifically for English. Handles punctuation, accents, technical jargon, and background noise exceptionally well.',
    },
    {
      name: 'Sherpa-ONNX Zipformer-en',
      architecture: 'Conformer / CTC Streaming',
      runtime: 'Sherpa-ONNX C++ Mobile NDK',
      size: '25 MB',
      ram: '~55 MB active RAM',
      latency: '~80ms (Real-time Streaming)',
      offline: '100% On-Device',
      status: 'Ultra-Fast Alternative',
      isHero: false,
      notes: 'Streaming acoustic model that emits words as you speak with minimal latency. Very low battery consumption.',
    },
    {
      name: 'Vosk Small English Model',
      architecture: 'Kaldi HMM-DNN acoustic',
      runtime: 'Vosk-Android AAR',
      size: '35 MB',
      ram: '~60 MB active RAM',
      latency: '~110ms',
      offline: '100% On-Device',
      status: 'Lightweight Classic',
      isHero: false,
      notes: 'Proven offline recognition engine with zero cloud dependency. Great for simple commands and notes.',
    },
    {
      name: 'Android Native SpeechRecognizer',
      architecture: 'Google On-Device Speech Model',
      runtime: 'android.speech.SpeechRecognizer',
      size: '0 MB (Pre-installed in OS)',
      ram: 'Shared System Process',
      latency: '~60ms',
      offline: 'Requires Google Offline Voice Pack',
      status: 'Built-in Fallback',
      isHero: false,
      notes: 'Uses Android OS built-in recognition if the user already has English offline pack installed in Gboard.',
    },
    {
      name: 'Whisper-Base (Unquantized)',
      architecture: 'Standard OpenAI Base Model',
      runtime: 'PyTorch / TFLite',
      size: '142 MB (Too Heavy for Mobile BG)',
      ram: '~320 MB active RAM',
      latency: '~450ms',
      offline: '100% On-Device',
      status: 'Not Recommended for Background Overlay',
      isHero: false,
      notes: 'High memory footprint risks being killed by Android LowMemoryKiller (LMK) during gaming or heavy multitasking.',
    },
  ];

  return (
    <div className="space-y-6 text-slate-200">
      <div className="p-6 bg-slate-900/80 rounded-2xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              Lightweight Offline English Models for Mobile
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Engineered to bring the desktop "Handy" offline dictation experience directly to Android without draining battery or RAM.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="text-cyan-400 font-medium">Target Language: English (en-US)</span>
            <span>·</span>
            <span className="text-emerald-400 font-medium">Footprint: &lt; 40 MB</span>
          </div>
        </div>

        {/* Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {models.map((m, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                m.isHero
                  ? 'bg-gradient-to-b from-cyan-950/40 to-slate-900/90 border-cyan-500/50 ring-1 ring-cyan-500/20'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-semibold text-white tracking-tight">{m.name}</h4>
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${
                      m.isHero
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {m.size}
                  </span>
                </div>

                <div className="text-[10px] text-slate-400 space-y-1 py-1 font-mono">
                  <div className="flex justify-between">
                    <span>RAM:</span>
                    <span className="text-slate-200">{m.ram}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Latency:</span>
                    <span className="text-cyan-300">{m.latency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Engine:</span>
                    <span className="text-slate-300">{m.runtime}</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-300/90 leading-relaxed pt-1 border-t border-slate-800/80">
                  {m.notes}
                </p>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                <span className={m.isHero ? 'text-cyan-400 font-semibold' : 'text-slate-400'}>
                  {m.status}
                </span>
                {m.isHero && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Architecture Deep Dive */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="text-xs font-semibold text-white flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-400" />
            How Handy & ScribeFlow Work Under the Hood
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            On macOS/Windows, <strong>Handy</strong> registers a global keyboard shortcut hook, captures your microphone to an in-memory ring buffer, processes the audio through quantized C++ Whisper, and synthesizes keypresses via OS event taps.
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            On Android, there are no global keyboard shortcuts. Instead, <strong>ScribeFlow Mobile</strong> hooks into Android's <code className="text-cyan-300">AccessibilityService</code>, which is notified by the OS the millisecond you tap any <code className="text-cyan-300">EditText</code> or search box. It automatically shows the floating watermark pill near your finger, lets you tap or speak, and injects the text via <code className="text-cyan-300">AccessibilityNodeInfo.ACTION_SET_TEXT</code>!
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="text-xs font-semibold text-white flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Zero-Cloud Privacy Guarantee
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Traditional speech recognition sends raw audio to external servers, exposing sensitive chat messages, passwords, and private notes.
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            ScribeFlow runs <strong>100% offline</strong> on your phone's processor. Turn on Airplane Mode or pull out your SIM card: voice recognition runs at the exact same lightning-fast speed with zero internet data used.
          </p>
        </div>
      </div>
    </div>
  );
};
