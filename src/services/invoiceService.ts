import type { Invoice } from '../types';
import { getIdToken } from './authService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getIdToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: token } : {}),
  };
}

async function getUploadUrl(filename: string, contentType: string, fileSize: number) {
  const res = await fetch(`${API_URL}/upload-url`, {
    method: 'POST', headers: await authHeaders(),
    body: JSON.stringify({ filename, contentType, fileSize }),
  });
  if (!res.ok) throw new Error(`Erro ao gerar URL de upload: ${res.status}`);
  return res.json() as Promise<{ uploadUrl: string; key: string }>;
}

async function uploadToS3(url: string, file: File) {
  const res = await fetch(url, { method: 'PUT', headers: { 'Content-Type': file.type || 'application/pdf' }, body: file });
  if (!res.ok) throw new Error('Erro no upload');
}

async function startProcessing(key: string) {
  const res = await fetch(`${API_URL}/process`, {
    method: 'POST', headers: await authHeaders(),
    body: JSON.stringify({ key }),
  });
  if (!res.ok) throw new Error(`Erro ao processar: ${res.status}`);
  return res.json() as Promise<{
    status: string; jobId?: string; key?: string;
    expenses?: { category: string; description: string; amount: number; date?: string }[];
    totalAmount?: number; expensesTotal?: number; referenceMonth?: string;
  }>;
}

async function checkStatus(jobId: string) {
  const res = await fetch(`${API_URL}/check-status`, {
    method: 'POST', headers: await authHeaders(),
    body: JSON.stringify({ jobId }),
  });
  if (!res.ok) throw new Error(`Erro ao verificar: ${res.status}`);
  return res.json() as Promise<{
    status: string;
    expenses?: { category: string; description: string; amount: number; date?: string }[];
    totalAmount?: number; expensesTotal?: number; referenceMonth?: string; error?: string;
  }>;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function processInvoice(file: File): Promise<Omit<Invoice, 'id' | 'status'>> {
  const { uploadUrl, key } = await getUploadUrl(file.name, file.type || 'application/pdf', file.size);
  await uploadToS3(uploadUrl, file);
  const start = await startProcessing(key);

  let expenses: { category: string; description: string; amount: number; date?: string }[] = [];
  let totalAmount = 0;
  let expensesTotal: number | undefined;
  let referenceMonth = '';

  if (start.status === 'done') {
    expenses = start.expenses ?? [];
    totalAmount = start.totalAmount ?? 0;
    expensesTotal = start.expensesTotal;
    referenceMonth = start.referenceMonth ?? '';
  } else if (start.status === 'processing' && start.jobId) {
    const jobId = start.jobId;
    let found = false;
    for (let i = 0; i < 60; i++) {
      await sleep(3000);
      const s = await checkStatus(jobId);
      if (s.status === 'done') {
        expenses = s.expenses ?? [];
        totalAmount = s.totalAmount ?? 0;
        expensesTotal = s.expensesTotal;
        referenceMonth = s.referenceMonth ?? '';
        found = true;
        break;
      }
      if (s.status === 'error') {
        const msg = s.error ?? 'Erro no processamento';
        if (msg.includes('PASSWORD_PROTECTED')) throw new Error('PDF protegido por senha. Remova a senha e tente novamente.');
        throw new Error(msg);
      }
    }
    if (!found) throw new Error('Tempo limite excedido. O documento pode ser muito grande ou complexo.');
  }

  const now = new Date();
  if (!referenceMonth) referenceMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  return { fileName: file.name, uploadDate: now.toISOString(), referenceMonth, totalAmount, expensesTotal, expenses };
}
