import React, { useState } from 'react';
import { Sliders, CheckCircle2, RotateCcw } from 'lucide-react';

interface CustomSandboxAppProps {
  onInputFocus: (targetId: string, elementRect?: DOMRect) => void;
  onInputChange: (value: string) => void;
  currentInputText: string;
  setInputText: (text: string) => void;
  activeFocusId: string | null;
}

export const CustomSandboxApp: React.FC<CustomSandboxAppProps> = ({
  onInputFocus,
  onInputChange,
  currentInputText,
  setInputText,
  activeFocusId,
}) => {
  const [field1, setField1] = useState('Quick task description');
  const [field2, setField2] = useState('https://github.com/scribeflow');
  const [field3, setField3] = useState('');

  const handleReset = () => {
    setField1('');
    setField2('');
    setField3('');
    setInputText('');
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 select-none overflow-y-auto p-4 space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-semibold text-white">System Focus Sandbox</h3>
          <p className="text-[11px] text-slate-400">Click any field below to watch the watermark pill relocate</p>
        </div>
        <button
          onClick={handleReset}
          className="p-1 text-slate-400 hover:text-white transition-colors"
          title="Reset fields"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Field 1: Task Title */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
          <span>Task / Reminder Title</span>
          {activeFocusId === 'sandbox-task-title' && (
            <span className="text-[10px] text-cyan-400 font-mono">FOCUSED</span>
          )}
        </label>
        <input
          id="sandbox-task-title"
          type="text"
          value={activeFocusId === 'sandbox-task-title' ? currentInputText : field1}
          onChange={(e) => {
            if (activeFocusId === 'sandbox-task-title') {
              setInputText(e.target.value);
              onInputChange(e.target.value);
            } else {
              setField1(e.target.value);
            }
          }}
          onFocus={(e) => {
            setInputText(field1);
            const rect = e.currentTarget.getBoundingClientRect();
            onInputFocus('sandbox-task-title', rect);
          }}
          placeholder="e.g. Call client back at 3 PM..."
          className={`w-full px-3 py-2 text-xs rounded-xl bg-slate-800/80 border transition-all ${
            activeFocusId === 'sandbox-task-title'
              ? 'border-cyan-500 ring-1 ring-cyan-500/20 text-white'
              : 'border-slate-700 text-slate-300'
          }`}
        />
      </div>

      {/* Field 2: Target URL / Query */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
          <span>Destination URL / Repo</span>
          {activeFocusId === 'sandbox-url-field' && (
            <span className="text-[10px] text-cyan-400 font-mono">FOCUSED</span>
          )}
        </label>
        <input
          id="sandbox-url-field"
          type="text"
          value={activeFocusId === 'sandbox-url-field' ? currentInputText : field2}
          onChange={(e) => {
            if (activeFocusId === 'sandbox-url-field') {
              setInputText(e.target.value);
              onInputChange(e.target.value);
            } else {
              setField2(e.target.value);
            }
          }}
          onFocus={(e) => {
            setInputText(field2);
            const rect = e.currentTarget.getBoundingClientRect();
            onInputFocus('sandbox-url-field', rect);
          }}
          placeholder="https://..."
          className={`w-full px-3 py-2 text-xs rounded-xl bg-slate-800/80 border transition-all ${
            activeFocusId === 'sandbox-url-field'
              ? 'border-cyan-500 ring-1 ring-cyan-500/20 text-white'
              : 'border-slate-700 text-slate-300'
          }`}
        />
      </div>

      {/* Field 3: Long Dictation Memo */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
          <span>Long-form Voice Memo</span>
          {activeFocusId === 'sandbox-memo-field' && (
            <span className="text-[10px] text-cyan-400 font-mono">FOCUSED</span>
          )}
        </label>
        <textarea
          id="sandbox-memo-field"
          rows={5}
          value={activeFocusId === 'sandbox-memo-field' ? currentInputText : field3}
          onChange={(e) => {
            if (activeFocusId === 'sandbox-memo-field') {
              setInputText(e.target.value);
              onInputChange(e.target.value);
            } else {
              setField3(e.target.value);
            }
          }}
          onFocus={(e) => {
            setInputText(field3);
            const rect = e.currentTarget.getBoundingClientRect();
            onInputFocus('sandbox-memo-field', rect);
          }}
          placeholder="Speak naturally: 'ScribeFlow works like handy on laptop comma typing directly offline period new line this is fast!'"
          className={`w-full px-3 py-2 text-xs rounded-xl bg-slate-800/80 border transition-all resize-none leading-relaxed ${
            activeFocusId === 'sandbox-memo-field'
              ? 'border-cyan-500 ring-1 ring-cyan-500/20 text-white'
              : 'border-slate-700 text-slate-300'
          }`}
        />
      </div>

      <div className="p-3 bg-cyan-950/30 border border-cyan-800/40 rounded-xl text-[11px] text-cyan-300/90 leading-relaxed">
        💡 <strong>Watermark Transparency:</strong> Notice how the floating pill allows you to read text directly underneath it without obstructing your view.
      </div>
    </div>
  );
};
