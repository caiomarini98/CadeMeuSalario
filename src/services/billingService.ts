import { getIdToken } from './authService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export type PlanId = 'essencial_monthly' | 'essencial_yearly' | 'pro_monthly' | 'pro_yearly';

export async function createCheckoutSession(plan: PlanId): Promise<string> {
  const token = await getIdToken();
  if (!token) throw new Error('Não autenticado');

  const res = await fetch(`${API_URL}/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: token },
    body: JSON.stringify({ plan }),
  });

  if (!res.ok) throw new Error('Erro ao criar sessão de pagamento');
  const data = await res.json();
  return data.url;
}

export async function redirectToCheckout(plan: PlanId): Promise<void> {
  const url = await createCheckoutSession(plan);
  window.location.href = url;
}
