import { useEffect, useRef, useState } from 'react';
import { X, BotMessageSquare } from 'lucide-react';
import {
  startHealthAssistantSession,
  sendHealthAssistantMessage,
} from '../services/healthAssistantService';
import type {
  AssistantMode,
  ChatMessage,
  HealthAssistantResponse,
} from '../types/healthAssistant';

interface HealthAssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HealthAssistantPanel({
  isOpen,
  onClose,
}: HealthAssistantPanelProps) {
  const [selectedMode, setSelectedMode] = useState<AssistantMode | null>('qa');
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Hi! I am your Health Guidance Assistant. I can answer health questions, check symptom urgency, and help you find the right care.',
    },
  ]);
  const [latestResponse, setLatestResponse] = useState<HealthAssistantResponse | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
  if (!isOpen || !selectedMode || sessionId) return;
  const init = async () => {
    try {
      const result = await startHealthAssistantSession();
      setSessionId(result.sessionid);
    } catch (error) {
      console.error('Session failed:', error);
    }
  };
  init();
}, [isOpen, selectedMode, sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, isOpen]);

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!input.trim()) return;
    if (!sessionId) {
        const errorMsg: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            text: 'Session starting... please wait.',
    };
  setMessages((prev) => [...prev, errorMsg]);
  setLoading(false);
  return;
}

    const userText = input.trim();

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text: userText,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const result = await sendHealthAssistantMessage({
        message: userText,
        selectedMode,
        session_id: sessionId,
      });

      setLatestResponse(result);

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: result.reply || '',
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: error.message || 'Something went wrong while contacting the assistant.',
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
  <>
    <div
      className={`fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-[2px] transition-opacity duration-500 ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={onClose}
    />

    <aside 
  className={`fixed right-0 top-0 z-50 flex h-screen w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl transition-all duration-1000 ease-in-out will-change-transform ${
    isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
  }`}
>
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-teal-100 p-2 text-teal-700">
            <BotMessageSquare size={20} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Health Assistant
            </h2>
            <p className="text-xs text-slate-500">
              Q&A, triage, and care navigation
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <X size={20} />
        </button>
      </div>

      <div className="border-b border-slate-200 px-4 py-3">
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setSelectedMode('qa')}
            className={`rounded-xl px-3 py-2 text-xs font-medium ${
              selectedMode === 'qa'
                ? 'bg-teal-600 text-white'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            Q&A
          </button>

          <button
            type="button"
            onClick={() => setSelectedMode('triage')}
            className={`rounded-xl px-3 py-2 text-xs font-medium ${
              selectedMode === 'triage'
                ? 'bg-teal-600 text-white'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            Triage
          </button>

          <button
            type="button"
            onClick={() => setSelectedMode('navigation')}
            className={`rounded-xl px-3 py-2 text-xs font-medium ${
              selectedMode === 'navigation'
                ? 'bg-teal-600 text-white'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            Care
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-4 py-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                message.role === 'user'
                  ? 'bg-teal-600 text-white'
                  : 'border border-slate-200 bg-white text-slate-800'
              }`}
            >
              {message.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
              Thinking...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {latestResponse && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 text-xs text-slate-600">
          <div><span className="font-semibold">Mode:</span> {latestResponse.mode}</div>
          <div><span className="font-semibold">Urgency:</span> {latestResponse.urgency}</div>
          {latestResponse.recommendedType && (
            <div>
              <span className="font-semibold">Care:</span> {latestResponse.recommendedType}
            </div>
          )}
          {latestResponse.specialty && (
            <div>
              <span className="font-semibold">Specialty:</span> {latestResponse.specialty}
            </div>
          )}
        </div>
      )}

      <div className="border-t border-slate-200 bg-white px-4 py-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSend();
              }
            }}
            placeholder="Ask something..."
            className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-teal-600"
          />

          <button
            type="button"
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="rounded-xl bg-teal-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Send
          </button>
        </div>
      </div>
    </aside>
  </>
);
}