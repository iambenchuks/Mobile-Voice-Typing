import React, { useState } from 'react';
import { Smartphone, Download, Check, AlertTriangle, Github, CheckCircle2 } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'github' | 'studio'>('github');
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
  pull_request:
    branches: [ "main", "master" ]
  workflow_dispatch:

jobs:
  build:
    name: Build Android APK
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Source Code
        uses: actions/checkout@v4

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'

      - name: Setup Android SDK
        uses: android-actions/setup-android@v3

      - name: Setup Gradle
        uses: gradle/actions/setup-gradle@v3
        with:
          gradle-version: '8.7'

      - name: Build Debug APK with Gradle
        run: |
          gradle assembleDebug --stacktrace --no-daemon

      - name: Upload APK as GitHub Artifact
        uses: actions/upload-artifact@v4
        with:
          name: ScribeFlow-debug-apk
          path: app/build/outputs/apk/debug/*.apk
          if-no-files-found: error
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
                How to Download &amp; Build the ScribeFlow APK
              </h3>
              <p className="text-xs text-slate-400">
                Native Android App repository structure &amp; automated APK compilation
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

        {/* Root Cause Explanation Banner */}
        <div className="px-5 py-3.5 bg-cyan-950/40 border-b border-cyan-800/40 text-xs text-slate-300 space-y-1.5">
          <div className="flex items-center gap-2 text-cyan-300 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Why the previous GitHub build failed &amp; why an AI said it's a web app:</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed pl-6">
            1. <strong>Missing XML Resources Fixed:</strong> The initial commit lacked Android XML layouts (<code className="text-cyan-300 font-mono">activity_main.xml</code>, <code className="text-cyan-300 font-mono">layout_floating_watermark_pill.xml</code>, <code className="text-cyan-300 font-mono">strings.xml</code>, <code className="text-cyan-300 font-mono">themes.xml</code>), which caused Gradle's AAPT compiler to fail before outputting the APK.<br />
            2. <strong>Dual Project Architecture:</strong> This repository contains <strong>BOTH</strong> the complete Native Android Application (in <code className="text-cyan-300 font-mono">/app</code> with Kotlin, AndroidManifest, Gradle, &amp; resources) and an in-browser device simulator (<code className="text-slate-400 font-mono">package.json</code>). An AI looking only at the root files mistook <code className="text-slate-400 font-mono">package.json</code> for the entire project.<br />
            3. <strong>We have now created 100% of the native Android files</strong>, root build scripts, and an automated GitHub Actions runner.
          </p>
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
            <span>Method 1: GitHub Cloud Build (Recommended - 1 Click)</span>
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
            <span>Method 2: Android Studio Local Build</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs text-slate-300 leading-relaxed">
          {activeTab === 'github' && (
            <div className="space-y-4">
              <div className="p-3 bg-cyan-950/30 border border-cyan-800/40 rounded-xl text-cyan-300 text-xs">
                ✨ <strong>Zero software needed on your computer!</strong> GitHub compiles the Android APK in the cloud using Ubuntu + Gradle 8.7 + Android SDK 34.
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-white">4 Simple Steps to Download the APK:</h4>

                <div className="space-y-2.5">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <div className="flex items-center gap-2 font-semibold text-white">
                      <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[10px]">1</span>
                      <span>Push or sync this repository to GitHub</span>
                    </div>
                    <p className="text-[11px] text-slate-400 pl-7">
                      All native Android files in <code className="text-cyan-300 font-mono">/app</code>, <code className="text-cyan-300 font-mono">settings.gradle.kts</code>, and <code className="text-cyan-300 font-mono">.github/workflows/build-apk.yml</code> are ready to push.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <div className="flex items-center gap-2 font-semibold text-white">
                      <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[10px]">2</span>
                      <span>Open the "Actions" tab on GitHub</span>
                    </div>
                    <p className="text-[11px] text-slate-400 pl-7">
                      Go to your GitHub repo in your browser and click the <strong>Actions</strong> tab at the top.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <div className="flex items-center gap-2 font-semibold text-white">
                      <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[10px]">3</span>
                      <span>Select "Build ScribeFlow Android APK" &amp; Run Workflow</span>
                    </div>
                    <p className="text-[11px] text-slate-400 pl-7">
                      It will automatically run on push, or you can click <strong>"Run workflow"</strong> to start it immediately. It takes ~2 minutes.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-emerald-800/40 bg-emerald-950/20 space-y-1">
                    <div className="flex items-center gap-2 font-semibold text-emerald-300">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[10px]">4</span>
                      <span>Download the APK from "Artifacts"</span>
                    </div>
                    <p className="text-[11px] text-slate-300 pl-7 leading-relaxed">
                      Once the run shows a green checkmark (✓), click into it. Scroll down to the <strong>Artifacts</strong> section at the bottom, and click <strong>ScribeFlow-debug-apk</strong>. Sideload the APK onto your Android phone and enjoy!
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
                If you have a laptop or computer with Android Studio installed, you can generate the APK in 60 seconds:
              </p>

              <div className="space-y-2">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <strong>1. Export and Extract:</strong>
                  <p className="text-[11px] text-slate-400">
                    Click <strong>"Export Android Project (.ZIP)"</strong> below to download the complete Android project archive and extract it.
                  </p>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <strong>2. Open in Android Studio:</strong>
                  <p className="text-[11px] text-slate-400">
                    Open Android Studio, select <strong>Open</strong>, and choose the extracted folder. Android Studio will recognize the Gradle project immediately.
                  </p>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <strong>3. Build the APK:</strong>
                  <p className="text-[11px] text-slate-400">
                    From the top menu, click: <code className="text-cyan-300 font-mono">Build &gt; Build Bundle(s) / APK(s) &gt; Build APK(s)</code>.
                  </p>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <strong>4. Install on your Android Phone:</strong>
                  <p className="text-[11px] text-slate-400">
                    Android Studio will show a balloon notification saying <em>"APK(s) generated successfully"</em> with a <strong>locate</strong> link. The APK is located at: <code className="text-cyan-300 font-mono">app/build/outputs/apk/debug/app-debug.apk</code>. Transfer it to your phone and install!
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
            Download Android Project .ZIP
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
