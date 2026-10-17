import React, { useState } from 'react';
import { Terminal, Smartphone, Download, Check, Sparkles, AlertTriangle, Github, Play, ArrowRight, ExternalLink } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'github' | 'studio' | 'termux'>('github');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const githubWorkflowYml = `name: Build ScribeFlow Android APK

on:
  push:
    branches: [ "main", "master" ]
  workflow_dispatch: # Allows manual trigger from GitHub web UI

jobs:
  build:
    name: Build Android APK
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'
          cache: 'gradle'

      - name: Setup Android SDK
        uses: android-actions/setup-android@v3

      - name: Build APK with Gradle
        run: |
          chmod +x gradlew || true
          ./gradlew assembleDebug --no-daemon

      - name: Upload APK to Artifacts
        uses: actions/upload-artifact@v4
        with:
          name: scribeflow-debug-apk
          path: app/build/outputs/apk/debug/app-debug.apk
          retention-days: 30`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white tracking-tight">
                How to Get &amp; Build the APK File
              </h3>
              <p className="text-xs text-slate-400">
                Why GitHub didn't show an APK by default &amp; how to build it automatically
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

        {/* Why there's no APK banner */}
        <div className="px-5 py-3 bg-amber-950/30 border-b border-amber-800/40 text-xs text-amber-200/90 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Why was there no APK on GitHub?</strong> GitHub is a source code repository—it only stores text files (<code className="text-amber-100 font-mono">.kt</code>, <code className="text-amber-100 font-mono">.xml</code>), not compiled binaries. To get an <code className="text-amber-100 font-mono">.apk</code>, you need a builder to compile it. Use <strong>GitHub Actions</strong> (free in the cloud) or <strong>Android Studio</strong> below!
          </div>
        </div>

        {/* Method Switcher Tabs */}
        <div className="flex items-center gap-2 p-2 bg-slate-950 border-b border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('github')}
            className={`flex-1 py-2 px-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === 'github'
                ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Github className="w-4 h-4" />
            <span>Option 1: GitHub Cloud Build (Easiest)</span>
          </button>
          <button
            onClick={() => setActiveTab('studio')}
            className={`flex-1 py-2 px-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === 'studio'
                ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Option 2: Android Studio</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs text-slate-300 leading-relaxed">
          {activeTab === 'github' && (
            <div className="space-y-4">
              <div className="p-3 bg-cyan-950/30 border border-cyan-800/40 rounded-xl text-cyan-300 text-xs">
                ✨ <strong>Zero software to install!</strong> We have added the automated GitHub Actions workflow to this project at <code className="text-white font-mono">.github/workflows/build-apk.yml</code>.
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-white">4 Simple Steps to Download the APK from GitHub:</h4>

                <div className="space-y-2.5">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <div className="flex items-center gap-2 font-semibold text-white">
                      <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[10px]">1</span>
                      <span>Push the code to your GitHub repo</span>
                    </div>
                    <p className="text-[11px] text-slate-400 pl-7">
                      Ensure your repository includes the <code className="text-cyan-300 font-mono">.github/workflows/build-apk.yml</code> file (included in our latest update).
                    </p>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <div className="flex items-center gap-2 font-semibold text-white">
                      <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[10px]">2</span>
                      <span>Click the "Actions" tab on GitHub</span>
                    </div>
                    <p className="text-[11px] text-slate-400 pl-7">
                      At the top of your GitHub repository page, click the tab named <strong>Actions</strong> (between <em>Pull requests</em> and <em>Projects</em>).
                    </p>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <div className="flex items-center gap-2 font-semibold text-white">
                      <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[10px]">3</span>
                      <span>Trigger or watch the build</span>
                    </div>
                    <p className="text-[11px] text-slate-400 pl-7">
                      You will see <strong>"Build ScribeFlow Android APK"</strong>. If it hasn't started automatically, click it in the left sidebar, click <strong>"Run workflow"</strong>, and hit the green button. It takes ~2 minutes.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-emerald-800/40 bg-emerald-950/20 space-y-1">
                    <div className="flex items-center gap-2 font-semibold text-emerald-300">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[10px]">4</span>
                      <span>Download the APK from "Artifacts"</span>
                    </div>
                    <p className="text-[11px] text-slate-300 pl-7 leading-relaxed">
                      Once the run shows a green checkmark (✓), click into it. Scroll to the bottom to the <strong>Artifacts</strong> section, and click <strong>scribeflow-debug-apk</strong>. It downloads directly to your device!
                    </p>
                  </div>
                </div>
              </div>

              {/* Workflow code preview */}
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-slate-200">The Workflow File (.github/workflows/build-apk.yml)</span>
                  <button
                    onClick={() => copyToClipboard(githubWorkflowYml, 'yml-copy')}
                    className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300"
                  >
                    {copiedCode === 'yml-copy' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : 'Copy YAML'}
                  </button>
                </div>
                <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[10px] text-slate-300 overflow-x-auto max-h-40 leading-relaxed">
                  {githubWorkflowYml}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'studio' && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-white">Build Locally Using Android Studio</h4>
              <p>
                If you have a laptop or desktop computer with Android Studio installed, you can generate the APK in 60 seconds:
              </p>

              <div className="space-y-2">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <strong>1. Export and Extract:</strong>
                  <p className="text-[11px] text-slate-400">
                    Click <strong>"Export Android Project"</strong> to download the ZIP file and extract it.
                  </p>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <strong>2. Open in Android Studio:</strong>
                  <p className="text-[11px] text-slate-400">
                    Open Android Studio, select <strong>Open</strong>, and choose the extracted folder.
                  </p>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <strong>3. Click Build APK:</strong>
                  <p className="text-[11px] text-slate-400">
                    From the top menu, go to: <code className="text-cyan-300 font-mono">Build &gt; Build Bundle(s) / APK(s) &gt; Build APK(s)</code>.
                  </p>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <strong>4. Locate APK &amp; Sideload:</strong>
                  <p className="text-[11px] text-slate-400">
                    Android Studio will show a popup saying <em>"APK(s) generated successfully"</em> with a <strong>locate</strong> link. The APK will be at: <code className="text-cyan-300 font-mono">app/build/outputs/apk/debug/app-debug.apk</code>. Transfer it to your phone and install!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onDownloadZip}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Download Project .ZIP
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold rounded-xl text-xs transition-colors"
          >
            Got It!
          </button>
        </div>
      </div>
    </div>
  );
};
