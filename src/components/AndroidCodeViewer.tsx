import React, { useState } from 'react';
import { ANDROID_FILES, generateAndroidProjectZip } from '../services/androidProjectGenerator';
import { AndroidFile } from '../types';
import { FileCode, Download, Copy, Check, ExternalLink, ShieldCheck, Cpu } from 'lucide-react';

export const AndroidCodeViewer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<AndroidFile>(ANDROID_FILES[0]);
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    try {
      setIsDownloading(true);
      const blob = await generateAndroidProjectZip();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ScribeFlow-Android-Offline-Project.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to create ZIP', e);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[650px] bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
      {/* Sidebar: File Tree */}
      <div className="w-full lg:w-72 bg-slate-950/60 border-r border-slate-800 flex flex-col shrink-0">
        <div className="p-3 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-white tracking-wide">Android Project Files</div>
            <div className="text-[10px] text-slate-400">Ready to build APK in Android Studio</div>
          </div>
          <button
            onClick={handleDownloadZip}
            disabled={isDownloading}
            className="px-2.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-[11px] rounded-lg transition-colors flex items-center gap-1 shadow-sm disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            {isDownloading ? 'Zipping...' : 'Export .ZIP'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {ANDROID_FILES.map((file) => {
            const isSelected = selectedFile.path === file.path;
            return (
              <button
                key={file.path}
                onClick={() => setSelectedFile(file)}
                className={`w-full text-left px-2.5 py-2 rounded-xl text-xs transition-all flex items-start gap-2 ${
                  isSelected
                    ? 'bg-slate-800 text-cyan-300 font-medium border border-cyan-500/30'
                    : 'text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                }`}
              >
                <FileCode className={`w-4 h-4 shrink-0 mt-0.5 ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`} />
                <div className="min-w-0">
                  <div className="truncate font-mono text-[11px]">{file.filename}</div>
                  <div className="text-[10px] text-slate-500 truncate">{file.path}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Info box at sidebar bottom */}
        <div className="p-3 bg-slate-900/90 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>100% On-Device Privacy</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            No audio ever leaves the Android phone. Whisper Tiny runs entirely in memory via Sherpa-ONNX.
          </p>
        </div>
      </div>

      {/* Main Code View */}
      <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
        {/* Top bar of code viewer */}
        <div className="p-3 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-white truncate">
                {selectedFile.filename}
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                {selectedFile.category}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">{selectedFile.description}</p>
          </div>

          <button
            onClick={handleCopy}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0 ml-3 border border-slate-700"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {isCopied ? 'Copied!' : 'Copy Code'}
          </button>
        </div>

        {/* Code Content with syntax styling */}
        <div className="flex-1 overflow-auto p-4 font-mono text-[11px] sm:text-xs leading-relaxed text-slate-200 bg-[#0d1117] selection:bg-cyan-500/20">
          <pre className="whitespace-pre">
            <code>{selectedFile.content}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
