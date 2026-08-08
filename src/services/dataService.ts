import { getIdToken } from './authService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function authFetch(path: string, options: RequestInit = {}) {
  const token = await getIdToken();
  if (!token) throw new Error('Not authenticated');
  return fetch(`${API_URL}${path}`, {
    ...options,
    headers: { ...options.headers, 'Content-Type': 'application/json', Authorization: token },
  });
}

export async function loadUserData<T>(dataType: string): Promise<T | null> {
  const res = await authFetch(`/user-data/${dataType}`);
  if (!res.ok) return null;
  const json = await res.json();
  return json.data ?? null;
}

export async function saveUserData<T>(dataType: string, data: T): Promise<void> {
  const res = await authFetch(`/user-data/${dataType}`, {
    method: 'PUT',
    body: JSON.stringify({ data }),
  });
  if (!res.ok) throw new Error('Failed to save');
}
