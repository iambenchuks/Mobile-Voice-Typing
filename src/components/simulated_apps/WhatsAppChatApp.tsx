import React, { useState } from 'react';
import { Send, Phone, Video, MoreVertical, CheckCheck, Smile } from 'lucide-react';

interface WhatsAppChatAppProps {
  onInputFocus: (targetId: string, elementRect?: DOMRect) => void;
  onInputChange: (value: string) => void;
  currentInputText: string;
  setInputText: (text: string) => void;
}

export const WhatsAppChatApp: React.FC<WhatsAppChatAppProps> = ({
  onInputFocus,
  onInputChange,
  currentInputText,
  setInputText,
}) => {
  const [messages, setMessages] = useState([
    {
      id: '1',
      sender: 'them',
      text: "Hey! Did you see the new Whisperflow floating watermark app?",
      time: '18:10',
    },
    {
      id: '2',
      sender: 'me',
      text: "Yes! It has that watermark pill that floats over any text box when you tap it.",
      time: '18:11',
    },
    {
      id: '3',
      sender: 'them',
      text: "Is it completely offline like Handy on laptop? Does it use the tiny English model?",
      time: '18:12',
    },
  ]);

  const handleSend = () => {
    if (!currentInputText.trim()) return;

    const newMsg = {
      id: Date.now().toString(),
      sender: 'me',
      text: currentInputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');

    setTimeout(() => {
      const reply = {
        id: (Date.now() + 1).toString(),
        sender: 'them',
        text: "That was so fast! Did you speak that in or type it?",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, reply]);
    }, 700);
  };

  return (
    <div className="flex flex-col h-full bg-[#0b141a] text-slate-100 select-none">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#202c33] border-b border-[#222e35]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-xs text-white">
            JD
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-100">Jordan Davis</div>
            <div className="text-[10px] text-emerald-400">online</div>
          </div>
        </div>
        <div className="flex items-center gap-3 text-slate-400">
          <Phone className="w-4 h-4" />
          <Video className="w-4 h-4" />
          <MoreVertical className="w-4 h-4" />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-[radial-gradient(#1f2c34_1px,transparent_1px)] [background-size:16px_16px]">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.sender === 'me' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-xl px-3 py-1.5 text-xs shadow-xs leading-relaxed ${
                m.sender === 'me'
                  ? 'bg-[#005c4b] text-slate-100 rounded-tr-none'
                  : 'bg-[#202c33] text-slate-200 rounded-tl-none'
              }`}
            >
              <div>{m.text}</div>
              <div className="flex items-center justify-end gap-1 text-[9px] text-slate-400 mt-0.5">
                <span>{m.time}</span>
                {m.sender === 'me' && <CheckCheck className="w-3 h-3 text-cyan-400" />}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* WhatsApp Input Field */}
      <div className="p-2 bg-[#202c33] flex items-center gap-2">
        <div className="flex-1 flex items-center bg-[#2a3942] rounded-full px-3 py-1.5 border border-slate-700/40 focus-within:border-emerald-500">
          <Smile className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
          <input
            id="whatsapp-chat-field"
            type="text"
            value={currentInputText}
            onChange={(e) => {
              setInputText(e.target.value);
              onInputChange(e.target.value);
            }}
            onFocus={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              onInputFocus('whatsapp-chat-field', rect);
            }}
            placeholder="Type a message..."
            className="w-full bg-transparent text-xs text-white placeholder-slate-400 focus:outline-none"
          />
        </div>
        <button
          onClick={handleSend}
          disabled={!currentInputText.trim()}
          className="w-9 h-9 rounded-full bg-[#00a884] flex items-center justify-center text-white shrink-0 hover:bg-[#008f6f] transition-colors disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
