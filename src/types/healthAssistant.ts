export type AssistantMode = 'qa' | 'triage' | 'navigation';

export type UrgencyLevel = 'low' | 'medium' | 'high' | 'emergency';

export type CareType = 'self-care' | 'doctor' | 'clinic' | 'hospital';

export type ChatRole = 'user' | 'assistant';

export type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
};

export type HealthAssistantResponse = {
  mode: AssistantMode;
  reply?: string;
  response?: string;
  message?: string;
  urgency: UrgencyLevel;
  recommendedType?: CareType;
  specialty?: string | null;
  redFlags?: string[];
  suggestedQuestions?: string[];
  shouldNavigate?: boolean;
  followUpQuestions?: string[];
};

export type HealthAssistantRequest = {
  session_id?: string;
  message: string;
  selectedMode?: AssistantMode | null;
};