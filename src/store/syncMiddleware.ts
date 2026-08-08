import { loadUserData, saveUserData } from '../services/dataService';

let syncEnabled = false;
const pendingSaves = new Map<string, ReturnType<typeof setTimeout>>();

export function enableSync() { syncEnabled = true; }
export function disableSync() { syncEnabled = false; }

export async function loadFromCloud<T>(dataType: string): Promise<T | null> {
  if (!syncEnabled) return null;
  try { return await loadUserData<T>(dataType); }
  catch { return null; }
}

export function saveToCloud<T>(dataType: string, data: T): void {
  if (!syncEnabled) return;
  // Debounce saves to avoid hammering the API
  const existing = pendingSaves.get(dataType);
  if (existing) clearTimeout(existing);
  pendingSaves.set(dataType, setTimeout(async () => {
    try { await saveUserData(dataType, data); }
    catch (e) { console.error(`Failed to save ${dataType}:`, e); }
    pendingSaves.delete(dataType);
  }, 1000));
}
