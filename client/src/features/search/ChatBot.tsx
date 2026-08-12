import { useState, useRef, useEffect } from 'react';
import { apiClient } from '../../api/client';

interface DisplayMessage {
  role: 'user' | 'bot';
  text: string;
}

interface ApiContent {
  role: 'user' | 'model';
  parts: { text: string }[];
}

const WELCOME_MSG =
  'Hi! I can help you with hotels, room types, amenities, and booking info. What would you like to know?';

async function askGemini(history: ApiContent[], userText: string): Promise<string> {
  const res = await apiClient.post<{ data: { reply: string } }>('/chat/ask', { history, userText });
  return res.data.data.reply;
}

// ── Icons ──────────────────────────────────────────────────────────────────────

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z" />
      <path d="M7 9h10v2H7zm0-3h10v2H7zm0 6h7v2H7z" />
    </svg>
  );
}

function BotAvatar() {
  return (
    <div className="w-8 h-8 rounded-full bg-[#003580] flex items-center justify-center shrink-0 mt-0.5">
      <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7H3a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 10 4a2 2 0 0 1 2-2M5 16v-2h14v2H5m1 4v-2h4v2H6m8 0v-2h4v2h-4z" />
      </svg>
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function ChatBot() {
  const [open, setOpen]       = useState(false);
  const [messages, setMessages] = useState<DisplayMessage[]>([{ role: 'bot', text: WELCOME_MSG }]);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const historyRef = useRef<ApiContent[]>([]);
  const bottomRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text }]);
    setLoading(true);
    try {
      const reply = await askGemini(historyRef.current, text);
      historyRef.current = [
        ...historyRef.current,
        { role: 'user',  parts: [{ text }] },
        { role: 'model', parts: [{ text: reply }] },
      ];
      setMessages(prev => [...prev, { role: 'bot', text: reply }]);
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      console.error('Gemini error:', detail);
      setMessages(prev => [
        ...prev,
        { role: 'bot', text: `Sorry, something went wrong: ${detail}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <>
      {/* Chat window */}
      {open && (
        <div className="fixed bottom-24 right-6 w-80 h-[460px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50 overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#003580] rounded-t-2xl shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7H3a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 10 4a2 2 0 0 1 2-2M5 16v-2h14v2H5m1 4v-2h4v2H6m8 0v-2h4v2h-4z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-semibold text-sm leading-tight">StayBook Assistant</p>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                  <p className="text-blue-200 text-xs">Online · Hotel info</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-blue-200 hover:text-white transition-colors w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/10"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex items-end gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'bot' && <BotAvatar />}
                <div
                  className={`max-w-[78%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-[#003580] text-white rounded-br-none'
                      : 'bg-gray-100 text-gray-800 rounded-bl-none'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-end gap-2 justify-start">
                <BotAvatar />
                <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-none flex gap-1 items-center">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t border-gray-100 flex gap-2 items-center shrink-0">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask about hotels..."
              disabled={loading}
              className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#003580] transition-colors disabled:opacity-50 bg-gray-50"
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className="w-9 h-9 bg-[#003580] rounded-xl flex items-center justify-center shrink-0 disabled:opacity-40 hover:bg-[#00224F] transition-colors"
            >
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Floating toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#003580] rounded-full shadow-xl flex items-center justify-center z-50 hover:bg-[#00224F] transition-colors"
        aria-label="Open hotel assistant"
      >
        {open ? (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <ChatIcon className="w-6 h-6 text-white" />
        )}
      </button>
    </>
  );
}
