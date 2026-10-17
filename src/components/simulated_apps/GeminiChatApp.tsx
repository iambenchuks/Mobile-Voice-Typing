import React, { useState } from 'react';
import { Sparkles, Send, ArrowUp, RefreshCw, Bot } from 'lucide-react';

interface GeminiChatAppProps {
  onInputFocus: (targetId: string, elementRect?: DOMRect) => void;
  onInputChange: (value: string) => void;
  currentInputText: string;
  setInputText: (text: string) => void;
}

interface Message {
  id: string;
  sender: 'user' | 'gemini';
  text: string;
  time: string;
}

export const GeminiChatApp: React.FC<GeminiChatAppProps> = ({
  onInputFocus,
  onInputChange,
  currentInputText,
  setInputText,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'gemini',
      text: "Hello! I'm Gemini. How can I help spark your curiosity or draft your ideas today?",
      time: '18:12',
    },
    {
      id: '2',
      sender: 'user',
      text: "Compare running local Whisper on Android vs cloud voice recognition.",
      time: '18:13',
    },
    {
      id: '3',
      sender: 'gemini',
      text: "Running Whisper-Tiny.en locally on your Android device provides zero-latency instant transcription, complete offline privacy with zero audio sent over the network, and works in airplane mode. The INT8 quantized model takes under 40MB of storage and runs on-device NPU/CPU in ~150ms.",
      time: '18:13',
    },
  ]);

  const handleSend = () => {
    if (!currentInputText.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: currentInputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');

    // Simulate friendly Gemini response
    setTimeout(() => {
      const geminiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'gemini',
        text: `Got your request: "${userMsg.text}". ScribeFlow dictated this straight into the text field offline!`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, geminiMsg]);
    }, 600);
  };

  return (
    <div className="flex flex-col h-full bg-[#131314] text-slate-100 select-none">
      {/* Top Gemini bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-[#1e1f20]/60 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-500 flex items-center justify-center shadow-sm">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight text-white flex items-center gap-1.5">
              Gemini Advanced
              <span className="text-[10px] text-blue-400 font-normal">2.5 Flash</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => {
            setMessages([
              {
                id: '1',
                sender: 'gemini',
                text: "Hello! I'm Gemini. Tap the prompt box below to activate ScribeFlow watermark dictation.",
                time: '18:14',
              },
            ]);
          }}
          className="p-1.5 text-slate-400 hover:text-slate-200 transition-colors"
          title="Reset chat"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-br-xs'
                  : 'bg-[#282a2c] text-slate-200 border border-slate-700/50 rounded-bl-xs'
              }`}
            >
              {m.text}
            </div>
            <span className="text-[10px] text-slate-500 mt-1 px-1">{m.time}</span>
          </div>
        ))}
      </div>

      {/* Input composition area (triggers the ScribeFlow watermark pill) */}
      <div className="p-3 bg-[#1e1f20] border-t border-slate-800">
        <div className="relative flex items-center bg-[#131314] border border-slate-700/80 rounded-2xl px-3 py-2 focus-within:border-blue-500 transition-all">
          <textarea
            id="gemini-input-field"
            value={currentInputText}
            onChange={(e) => {
              setInputText(e.target.value);
              onInputChange(e.target.value);
            }}
            onFocus={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              onInputFocus('gemini-input-field', rect);
            }}
            placeholder="Ask Gemini or dictate with ScribeFlow..."
            rows={2}
            className="w-full bg-transparent resize-none text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          <button
            onClick={handleSend}
            disabled={!currentInputText.trim()}
            className={`p-2 rounded-xl shrink-0 transition-all ml-2 ${
              currentInputText.trim()
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'text-slate-600 cursor-not-allowed'
            }`}
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-slate-500 text-center mt-1.5">
          Tap above to trigger the ScribeFlow translucent floating pill.
        </p>
      </div>
    </div>
  );
};
