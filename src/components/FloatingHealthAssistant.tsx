import { BotMessageSquare } from 'lucide-react';

interface FloatingHealthAssistantProps {
  onClick: () => void;
}

export function FloatingHealthAssistant({ onClick }: FloatingHealthAssistantProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Open Health Guidance Assistant"
      title="Open Health Guidance Assistant"
      className="fixed bottom-6 right-6 z-40 flex items-center gap-3 rounded-full bg-teal-600 px-4 py-3 text-white shadow-xl ring-1 ring-black/5 transition-all duration-200 hover:scale-105 hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-200"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
        <BotMessageSquare size={20} strokeWidth={2.2} />
      </span>
    </button>
  );
}