import type { ChatMessage } from '../types';
import { getIdToken } from './authService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function sendAdvisorMessage(
  message: string,
  portfolioContext: string,
  history: ChatMessage[]
): Promise<string> {
  const token = await getIdToken();
  const res = await fetch(`${API_URL}/advisor-chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: token } : {}),
    },
    body: JSON.stringify({
      message,
      context: portfolioContext,
      history: history.map((m) => ({ role: m.role, content: m.content })),
    }),
  });
  if (!res.ok) throw new Error(`Erro: ${res.status}`);
  const data = await res.json();
  return data.reply;
}
