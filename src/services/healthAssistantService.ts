import type {
  HealthAssistantRequest,
  HealthAssistantResponse,
} from '../types/healthAssistant';

const API_BASE = 'http://127.0.0.1:5000';

export async function startHealthAssistantSession(): Promise<{ sessionid: string }> {
  const response = await fetch(`${API_BASE}/api/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to start session');
  }

  return response.json();
}

export async function sendHealthAssistantMessage(
  payload: HealthAssistantRequest
): Promise<HealthAssistantResponse> {
  const response = await fetch(`${API_BASE}/api/message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to contact health assistant');
  }

  return response.json();
}