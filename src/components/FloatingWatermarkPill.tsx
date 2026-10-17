import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, Sparkles, X, Check, Undo, Settings } from 'lucide-react';
import { DictationSettings } from '../types';

interface FloatingWatermarkPillProps {
  isListening: boolean;
  onToggleListening: () => void;
  audioLevel: number;
  watermarkOpacity: number;
  onOpacityChange: (newOpacity: number) => void;
  currentTranscript: string;
  isFocused: boolean;
  onClearText?: () => void;
  onInsertPunctuation?: (mark: string) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export const FloatingWatermarkPill: React.FC<FloatingWatermarkPillProps> = ({
  isListening,
  onToggleListening,
  audioLevel,
  watermarkOpacity,
  onOpacityChange,
  currentTranscript,
  isFocused,
  onClearText,
  onInsertPunctuation,
  containerRef,
}) => {
  // Pill position (x, y inside container)
  const [position, setPosition] = useState({ x: 180, y: 380 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showQuickSettings, setShowQuickSettings] = useState(false);
  const pillRef = useRef<HTMLDivElement>(null);

  // Drag start
  const handleMouseDown = (e: React.MouseEvent) => {
    // Avoid dragging when clicking sliders or action buttons
    if ((e.target as HTMLElement).closest('.no-drag')) return;

    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('.no-drag')) return;
    const touch = e.touches[0];
    setIsDragging(true);
    setDragOffset({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y,
    });
  };

  // Drag move
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const pillWidth = pillRef.current?.offsetWidth || 140;
      const pillHeight = pillRef.current?.offsetHeight || 44;

      const rawX = e.clientX - dragOffset.x;
      const rawY = e.clientY - dragOffset.y;

      // Bound within container
      const boundedX = Math.max(8, Math.min(containerRect.width - pillWidth - 8, rawX));
      const boundedY = Math.max(36, Math.min(containerRect.height - pillHeight - 48, rawY));

      setPosition({ x: boundedX, y: boundedY });
    };

    const handleMouseUp = () => {
      if (!isDragging) return;
      setIsDragging(false);

      // Snap to nearest edge (left or right)
      if (containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const pillWidth = pillRef.current?.offsetWidth || 140;
        const middle = containerRect.width / 2;

        setPosition((prev) => ({
          x: prev.x + pillWidth / 2 < middle ? 12 : containerRect.width - pillWidth - 12,
          y: prev.y,
        }));
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || !containerRef.current) return;
      const touch = e.touches[0];
      const containerRect = containerRef.current.getBoundingClientRect();
      const pillWidth = pillRef.current?.offsetWidth || 140;
      const pillHeight = pillRef.current?.offsetHeight || 44;

      const rawX = touch.clientX - dragOffset.x;
      const rawY = touch.clientY - dragOffset.y;

      const boundedX = Math.max(8, Math.min(containerRect.width - pillWidth - 8, rawX));
      const boundedY = Math.max(36, Math.min(containerRect.height - pillHeight - 48, rawY));

      setPosition({ x: boundedX, y: boundedY });
    };

    const handleTouchEnd = () => {
      if (!isDragging) return;
      setIsDragging(false);
      if (containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const pillWidth = pillRef.current?.offsetWidth || 140;
        const middle = containerRect.width / 2;
        setPosition((prev) => ({
          x: prev.x + pillWidth / 2 < middle ? 12 : containerRect.width - pillWidth - 12,
          y: prev.y,
        }));
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, dragOffset, containerRef]);

  // Waveform bars count
  const bars = [0.3, 0.7, 1.0, 0.6, 0.4];

  return (
    <div
      ref={pillRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        opacity: isDragging || isListening ? 0.95 : watermarkOpacity,
        transition: isDragging ? 'none' : 'opacity 0.2s ease, transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      className={`absolute z-40 select-none cursor-grab active:cursor-grabbing ${
        !isFocused && !isListening ? 'scale-95' : 'scale-100'
      }`}
    >
      {/* Floating Watermark Pill Body */}
      <div
        className={`group relative flex items-center gap-2 px-3 py-2 rounded-full border shadow-xl backdrop-blur-md transition-all ${
          isListening
            ? 'bg-slate-900/90 border-cyan-400/80 shadow-cyan-500/20 ring-2 ring-cyan-400/30'
            : 'bg-slate-900/50 hover:bg-slate-900/80 border-white/20 hover:border-cyan-400/50 shadow-black/40'
        }`}
      >
        {/* Glow pulse when listening */}
        {isListening && (
          <span className="absolute -inset-1 rounded-full bg-cyan-400/20 blur-sm animate-ping pointer-events-none" />
        )}

        {/* Tap-to-Record Trigger */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleListening();
          }}
          className={`no-drag relative w-8 h-8 rounded-full flex items-center justify-center transition-all ${
            isListening
              ? 'bg-cyan-500 text-slate-950 shadow-md scale-105'
              : 'bg-white/15 text-white group-hover:bg-cyan-500/30'
          }`}
          title={isListening ? 'Stop offline recording' : 'Tap to speak offline with WhisperFlow'}
        >
          {isListening ? (
            <Mic className="w-4 h-4 animate-pulse" />
          ) : (
            <MicOff className="w-4 h-4 text-slate-300" />
          )}
        </button>

        {/* Dynamic State: Waveform or Watermark Label */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            onToggleListening();
          }}
          className="flex items-center gap-2 cursor-pointer pr-1"
        >
          {isListening ? (
            <div className="flex items-center gap-1 h-5 px-1">
              {bars.map((scale, i) => {
                const dynamicHeight = Math.max(4, Math.min(20, scale * (audioLevel * 30 + 6)));
                return (
                  <span
                    key={i}
                    style={{ height: `${dynamicHeight}px` }}
                    className="w-1 bg-cyan-400 rounded-full transition-all duration-75"
                  />
                );
              })}
              <span className="text-[11px] font-medium text-cyan-200 ml-1 font-mono tracking-tight">
                Listening...
              </span>
            </div>
          ) : (
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold text-white/90 tracking-tight flex items-center gap-1">
                WhisperFlow
                <span className="text-[9px] text-cyan-300/80 font-normal">Offline</span>
              </span>
              <span className="text-[8px] text-slate-300/70 -mt-0.5">Watermark Active</span>
            </div>
          )}
        </div>

        {/* Quick Settings Gear (Watermark Opacity Toggle) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowQuickSettings(!showQuickSettings);
          }}
          className="no-drag p-1 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-white/10"
          title="Adjust Watermark Opacity"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Floating Transcript Streamer (Appears right above pill while dictating) */}
      {isListening && currentTranscript && (
        <div className="absolute bottom-full mb-2 left-0 right-0 min-w-[200px] max-w-[260px] p-2 rounded-xl bg-slate-900/95 border border-cyan-500/40 backdrop-blur-md shadow-2xl text-[11px] text-slate-100 leading-snug animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between text-[9px] text-cyan-300 pb-1 mb-1 border-b border-slate-800">
            <span>Transcribing (Whisper Tiny.en)</span>
            <span className="font-mono">100% Offline</span>
          </div>
          <div className="text-white font-medium line-clamp-3">"{currentTranscript}"</div>
        </div>
      )}

      {/* Quick Watermark Opacity Slider Popover */}
      {showQuickSettings && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="no-drag absolute top-full mt-2 right-0 w-52 p-3 bg-slate-950/95 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-xl text-xs space-y-2 z-50 text-slate-200"
        >
          <div className="flex items-center justify-between pb-1 border-b border-slate-800">
            <span className="font-semibold text-white text-[11px]">Watermark Transparency</span>
            <button
              onClick={() => setShowQuickSettings(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>See-through</span>
              <span className="text-cyan-400 font-mono">{Math.round(watermarkOpacity * 100)}%</span>
              <span>Solid</span>
            </div>
            <input
              type="range"
              min={0.15}
              max={0.9}
              step={0.05}
              value={watermarkOpacity}
              onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
          </div>

          <p className="text-[9px] text-slate-400 leading-tight">
            Adjust so you can clearly see text and buttons underneath the floating icon.
          </p>

          <div className="pt-1 flex gap-1 text-[10px]">
            <button
              onClick={() => onOpacityChange(0.35)}
              className={`flex-1 py-1 rounded border transition-colors ${
                Math.abs(watermarkOpacity - 0.35) < 0.05
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                  : 'border-slate-800 hover:border-slate-700 text-slate-400'
              }`}
            >
              Ghost (35%)
            </button>
            <button
              onClick={() => onOpacityChange(0.55)}
              className={`flex-1 py-1 rounded border transition-colors ${
                Math.abs(watermarkOpacity - 0.55) < 0.05
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                  : 'border-slate-800 hover:border-slate-700 text-slate-400'
              }`}
            >
              Default (55%)
            </button>
            <button
              onClick={() => onOpacityChange(0.85)}
              className={`flex-1 py-1 rounded border transition-colors ${
                Math.abs(watermarkOpacity - 0.85) < 0.05
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                  : 'border-slate-800 hover:border-slate-700 text-slate-400'
              }`}
            >
              Solid (85%)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
