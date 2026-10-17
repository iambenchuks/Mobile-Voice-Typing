import React, { useState } from 'react';
import { Plus, Pin, CheckSquare, Palette, ArrowLeft } from 'lucide-react';

interface KeepNotesAppProps {
  onInputFocus: (targetId: string, elementRect?: DOMRect) => void;
  onInputChange: (value: string) => void;
  currentInputText: string;
  setInputText: (text: string) => void;
}

export const KeepNotesApp: React.FC<KeepNotesAppProps> = ({
  onInputFocus,
  onInputChange,
  currentInputText,
  setInputText,
}) => {
  const [noteTitle, setNoteTitle] = useState('Voice Dictation Thoughts');
  const [savedNotes, setSavedNotes] = useState([
    {
      id: '1',
      title: 'WhisperFlow Mobile Spec',
      body: 'Lightweight English speech model. Floating translucent watermark icon. Automatically hooks on EditText focus.',
      time: 'Oct 16',
    },
    {
      id: '2',
      title: 'Handy Desktop Comparison',
      body: 'On laptop, Handy is amazing for quick typing anywhere. We now have the exact same offline experience on Android.',
      time: 'Oct 15',
    },
  ]);

  const handleSaveNote = () => {
    if (!currentInputText.trim()) return;

    setSavedNotes((prev) => [
      {
        id: Date.now().toString(),
        title: noteTitle.trim() || 'Untitled Note',
        body: currentInputText.trim(),
        time: 'Just now',
      },
      ...prev,
    ]);

    setInputText('');
    setNoteTitle('');
  };

  return (
    <div className="flex flex-col h-full bg-[#202124] text-slate-100 select-none overflow-y-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-3 py-2.5 bg-[#2d2e30] border-b border-slate-700">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-400"></span>
          <span className="text-xs font-semibold text-white tracking-wide">Google Keep Notes</span>
        </div>
        <button
          onClick={handleSaveNote}
          className="text-xs text-amber-400 hover:text-amber-300 font-medium px-2 py-1 rounded-md"
        >
          Save Note
        </button>
      </div>

      <div className="p-3 space-y-3">
        {/* Active Note Editor */}
        <div className="bg-[#2d2e30] rounded-xl p-3 border border-slate-700/80 space-y-2">
          <input
            id="keep-title-field"
            type="text"
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
            onFocus={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              onInputFocus('keep-title-field', rect);
            }}
            placeholder="Title"
            className="w-full bg-transparent text-sm font-semibold text-white placeholder-slate-500 focus:outline-none"
          />

          <textarea
            id="keep-notes-field"
            rows={4}
            value={currentInputText}
            onChange={(e) => {
              setInputText(e.target.value);
              onInputChange(e.target.value);
            }}
            onFocus={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              onInputFocus('keep-notes-field', rect);
            }}
            placeholder="Take a note (dictate using WhisperFlow)..."
            className="w-full bg-transparent text-xs text-slate-200 placeholder-slate-500 focus:outline-none resize-none leading-relaxed"
          />

          <div className="flex items-center justify-between pt-1 border-t border-slate-700/50 text-slate-400 text-xs">
            <span className="text-[10px] text-slate-500">
              {currentInputText ? `${currentInputText.split(/\s+/).filter(Boolean).length} words` : 'Empty note'}
            </span>
            <div className="flex items-center gap-2 text-slate-400">
              <Palette className="w-3.5 h-3.5 hover:text-white cursor-pointer" />
              <Pin className="w-3.5 h-3.5 hover:text-white cursor-pointer" />
            </div>
          </div>
        </div>

        {/* Existing notes */}
        <div className="space-y-2 pt-1">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Recent Notes</div>
          {savedNotes.map((note) => (
            <div
              key={note.id}
              className="p-2.5 bg-[#2d2e30]/60 rounded-lg border border-slate-700/40 text-xs space-y-1 hover:border-slate-600 transition-colors cursor-pointer"
              onClick={() => {
                setNoteTitle(note.title);
                setInputText(note.body);
                onInputChange(note.body);
                onInputFocus('keep-notes-field');
              }}
            >
              <div className="font-semibold text-slate-200 flex items-center justify-between">
                <span>{note.title}</span>
                <span className="text-[9px] text-slate-500">{note.time}</span>
              </div>
              <p className="text-slate-400 text-[11px] line-clamp-2">{note.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
