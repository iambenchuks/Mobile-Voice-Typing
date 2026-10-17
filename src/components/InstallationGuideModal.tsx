import React, { useState } from 'react';
import { Terminal, Smartphone, Download, Check, Sparkles, AlertTriangle } from 'lucide-react';

interface InstallationGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownloadZip: () => void;
}

export const InstallationGuideModal: React.FC<InstallationGuideModalProps> = ({
  isOpen,
  onClose,
  onDownloadZip,
}) => {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const steps = [
    {
      num: 1,
      title: 'Download the Complete Android Project',
      description: 'Get all Kotlin source files, AndroidManifest, Gradle scripts, and layouts in one organized .ZIP archive.',
    },
    {
      num: 2,
      title: 'Open in Android Studio',
      description: 'Extract the ZIP file and open the root folder in Android Studio (Ladybug, Koala, or newer).',
    },
    {
      num: 3,
      title: 'Bundle the Whisper Tiny English Model (~39 MB)',
      description: 'Place the quantized INT8 whisper model in app/src/main/assets/',
    },
    {
      num: 4,
      title: 'Build APK & Sideload to Phone',
      description: 'Click Build > Build Bundle(s) / APK(s) > Build APK, or plug your phone via USB with USB Debugging enabled.',
    },
    {
      num: 5,
      title: 'Grant Android System Permissions',
      description: 'Open WhisperFlow on your phone and enable: 1) Draw Over Apps, 2) Accessibility Service, 3) Microphone.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-tight">
                Android APK Compilation & Installation Guide
              </h3>
              <p className="text-xs text-slate-400">
                How to build and install WhisperFlow Mobile onto your Android phone
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Step Indicator Bar */}
        <div className="flex items-center justify-between px-5 py-3 bg-slate-900 border-b border-slate-800 text-xs overflow-x-auto">
          {steps.map((s) => (
            <button
              key={s.num}
              onClick={() => setActiveStep(s.num)}
              className={`flex items-center gap-2 py-1 px-2.5 rounded-lg whitespace-nowrap transition-all ${
                activeStep === s.num
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                activeStep === s.num ? 'bg-cyan-400 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
              }`}>
                {s.num}
              </span>
              <span>{s.title.split(' ')[0]} {s.title.split(' ')[1]}</span>
            </button>
          ))}
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs text-slate-300 leading-relaxed">
          {activeStep === 1 && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-white">Step 1: Download Complete Source Code</h4>
              <p>
                Click the button below to generate and download the full, compilable Android Studio project. It includes all Kotlin services, the translucent watermark layout, accessibility descriptor, and Gradle dependencies.
              </p>
              <button
                onClick={onDownloadZip}
                className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-cyan-500/20"
              >
                <Download className="w-4 h-4" />
                Download WhisperFlow-Android-Offline-Project.zip
              </button>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400">
                📦 <strong>Includes:</strong> <code className="text-cyan-300">WhisperAccessibilityService.kt</code>, <code className="text-cyan-300">FloatingWatermarkService.kt</code>, <code className="text-cyan-300">OfflineSpeechEngine.kt</code>, <code className="text-cyan-300">PunctuationFormatter.kt</code>, layouts, and Gradle files.
              </div>
            </div>
          )}

          {activeStep === 2 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-white">Step 2: Open in Android Studio</h4>
              <p>
                1. Unzip the downloaded file onto your laptop or desktop.<br />
                2. Open Android Studio and choose <strong>File &gt; Open...</strong><br />
                3. Navigate to the extracted folder and select it.<br />
                4. Android Studio will automatically run Gradle Sync to fetch the <code className="text-cyan-300">sherpa-onnx</code> and <code className="text-cyan-300">androidx.core</code> packages.
              </p>
              <div className="p-3 bg-slate-950 rounded-xl font-mono text-[11px] text-slate-300 border border-slate-800">
                # Or compile via terminal command line:
                <br />
                ./gradlew assembleDebug
              </div>
            </div>
          )}

          {activeStep === 3 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-white">Step 3: Whisper Tiny English INT8 Weights (~39 MB)</h4>
              <p>
                To run completely offline, the app uses OpenAI's Whisper Tiny English model quantized to INT8 precision. This gives you desktop Handy-level speech-to-text accuracy in just 39MB.
              </p>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="text-[11px] text-slate-400">Download the pre-quantized ONNX weights from Sherpa-ONNX release:</div>
                <div className="flex items-center justify-between bg-slate-900 p-2 rounded-lg font-mono text-[11px] text-cyan-300">
                  <span className="truncate">https://github.com/k2-fsa/sherpa-onnx/releases/whisper-tiny.en</span>
                  <button
                    onClick={() => copyToClipboard('https://github.com/k2-fsa/sherpa-onnx/releases', 'weights-link')}
                    className="p-1 hover:text-white"
                  >
                    {copiedCode === 'weights-link' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : 'Copy'}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500">
                  Save <code className="text-slate-300">whisper_tiny_en_int8.onnx</code> inside your project at: <code className="text-cyan-300">app/src/main/assets/</code>
                </p>
              </div>
            </div>
          )}

          {activeStep === 4 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-white">Step 4: Build APK & Sideload to Phone</h4>
              <p>
                You can install the APK onto your Android phone in two easy ways:
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-slate-300">
                <li><strong>Direct USB Run:</strong> Enable Developer Options & USB Debugging on your phone, connect the USB cable, and click the green ▶ <strong>Run 'app'</strong> button in Android Studio.</li>
                <li><strong>Export Standalone APK:</strong> Go to <strong>Build &gt; Build Bundle(s) / APK(s) &gt; Build APK(s)</strong>. Transfer the generated <code className="text-cyan-300">app-debug.apk</code> file to your phone via USB or Google Drive and tap to install!</li>
              </ul>
            </div>
          )}

          {activeStep === 5 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-white">Step 5: Enable Android System Permissions</h4>
              <p>
                When you first open WhisperFlow Mobile on your phone, the app presents a setup checklist:
              </p>
              <div className="space-y-2">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</span>
                  <div>
                    <strong className="text-white">Display Over Other Apps (Overlay Permission):</strong>
                    <p className="text-[11px] text-slate-400">Allows the translucent watermark pill to float above Gemini, WhatsApp, and Google Search.</p>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</span>
                  <div>
                    <strong className="text-white">Accessibility Service:</strong>
                    <p className="text-[11px] text-slate-400">Enables automatic detection when you tap or click any text field across the entire Android OS.</p>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</span>
                  <div>
                    <strong className="text-white">Microphone:</strong>
                    <p className="text-[11px] text-slate-400">Allows offline voice capture. Audio is processed 100% on-device and never transmitted.</p>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-xl text-emerald-300 text-[11px]">
                🎉 <strong>You're Done!</strong> Now whenever you tap any text field anywhere on your phone, WhisperFlow's watermark pill will appear ready to dictate!
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={() => setActiveStep((prev) => Math.max(1, prev - 1))}
            disabled={activeStep === 1}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition-colors"
          >
            Previous
          </button>
          <div className="text-[11px] text-slate-500">Step {activeStep} of 5</div>
          {activeStep < 5 ? (
            <button
              onClick={() => setActiveStep((prev) => Math.min(5, prev + 1))}
              className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold transition-colors"
            >
              Next Step
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold transition-colors"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
