import { useEffect, useRef, useState } from 'react';
import {
  startHealthAssistantSession,
  sendHealthAssistantMessage,
} from '../services/healthAssistantService';
import type {
  AssistantMode,
  ChatMessage,
  HealthAssistantResponse,
} from '../types/healthAssistant';

export default function HealthAssistant() {
  const [selectedMode, setSelectedMode] = useState<AssistantMode | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Start session when component mounts or mode changes
  useEffect(() => {
    if (!sessionId && selectedMode) {
      startSession();
    }
  }, [selectedMode]);

  const startSession = async () => {
    try {
      setLoading(true);
      const result = await startHealthAssistantSession();
      setSessionId(result.sessionid || result.sessionid);
    } catch (error: any) {
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: error.message || 'Failed to start conversation.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !sessionId) return;

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
        session_id: sessionId,
        message: userText,
        selectedMode,
      });

      setLatestResponse(result);

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: result.reply || result.response || result.message || 'No response received',
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

  // Rest of your JSX stays exactly the same...
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 md:px-8">
      {/* Your existing JSX - no changes needed */}
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Health Guidance Assistant</h1>
          <p className="mt-2 text-slate-600">
            Ask health questions, check symptom urgency, or find the right care.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">Choose a Mode</h2>

          <div className="grid gap-4 md:grid-cols-3">
            <button
              type="button"
              onClick={() => setSelectedMode('qa')}
              className={`rounded-2xl border p-4 text-left transition ${
                selectedMode === 'qa'
                  ? 'border-teal-600 bg-teal-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="font-semibold text-slate-900">Ask a Health Question</div>
              <div className="mt-1 text-sm text-slate-600">
                Example: What should I do for fever?
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMode('triage')}
              className={`rounded-2xl border p-4 text-left transition ${
                selectedMode === 'triage'
                  ? 'border-teal-600 bg-teal-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="font-semibold text-slate-900">Check Symptom Urgency</div>
              <div className="mt-1 text-sm text-slate-600">
                Example: I have chest pain and fever
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMode('navigation')}
              className={`rounded-2xl border p-4 text-left transition ${
                selectedMode === 'navigation'
                  ? 'border-teal-600 bg-teal-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="font-semibold text-slate-900">Find the Right Care</div>
              <div className="mt-1 text-sm text-slate-600">
                Example: Should I go to a clinic or hospital?
              </div>
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.5fr_0.9fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold text-slate-900">Chat</h2>

            <div className="mb-4 h-[480px] space-y-3 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-4">
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

            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSend();
                  }
                }}
                placeholder="Type your message here..."
                className="flex-1 rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-teal-600"
                disabled={!sessionId}
              />

              <button
                type="button"
                onClick={handleSend}
                disabled={loading || !input.trim() || !sessionId}
                className="rounded-xl bg-teal-600 px-5 py-3 font-medium text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold text-slate-900">Assistant Summary</h2>

            {latestResponse ? (
              <div className="space-y-3 text-sm text-slate-700">
                <div>
                  <span className="font-semibold">Mode:</span> {latestResponse.mode}
                </div>

                <div>
                  <span className="font-semibold">Urgency:</span> {latestResponse.urgency}
                </div>

                {latestResponse.recommendedType && (
                  <div>
                    <span className="font-semibold">Recommended care:</span>{' '}
                    {latestResponse.recommendedType}
                  </div>
                )}

                {latestResponse.specialty && (
                  <div>
                    <span className="font-semibold">Suggested specialty:</span>{' '}
                    {latestResponse.specialty}
                  </div>
                )}

                {latestResponse.redFlags && latestResponse.redFlags.length > 0 && (
                  <div>
                    <span className="font-semibold">Red flags:</span>
                    <ul className="mt-2 list-disc pl-5">
                      {latestResponse.redFlags.map((flag) => (
                        <li key={flag}>{flag}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {latestResponse.followUpQuestions &&
                  latestResponse.followUpQuestions.length > 0 && (
                    <div>
                      <span className="font-semibold">Follow-up questions:</span>
                      <ul className="mt-2 list-disc pl-5">
                        {latestResponse.followUpQuestions.map((question) => (
                          <li key={question}>{question}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                {latestResponse.shouldNavigate && (
                  <button
                    type="button"
                    className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-3 font-medium text-white"
                  >
                    Open Nearby Care Finder
                  </button>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                No response yet. Choose a mode and send a message to see results here.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}