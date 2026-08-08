import type { Invoice } from '../types';
import { getIdToken } from './authService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function computeFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

function getDemoSessionId(): string {
  let id = sessionStorage.getItem('kdms-demo-session');
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem('kdms-demo-session', id);
  }
  return id;
}

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getIdToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: token } : {}),
  };
}

async function getUploadUrl(filename: string, contentType: string, fileSize: number, fileHash: string) {
  const res = await fetch(`${API_URL}/upload-url`, {
    method: 'POST', headers: await authHeaders(),
    body: JSON.stringify({ filename, contentType, fileSize, fileHash }),
  });
  if (res.status === 429) {
    const data = await res.json();
    throw new Error(data.error || 'Limite mensal de faturas excedido.');
  }
  if (res.status === 409) {
    const data = await res.json();
    throw new Error(data.error || 'Esta fatura já foi processada anteriormente.');
  }
  if (!res.ok) throw new Error(`Erro ao gerar URL de upload: ${res.status}`);
  return res.json() as Promise<{ uploadUrl: string; key: string; remaining: number; limit: number }>;
}

async function uploadToS3(url: string, file: File) {
  const res = await fetch(url, { method: 'PUT', headers: { 'Content-Type': file.type || 'application/pdf' }, body: file });
  if (!res.ok) throw new Error('Erro no upload');
}

async function startProcessing(key: string, fileHash: string) {
  const res = await fetch(`${API_URL}/process`, {
    method: 'POST', headers: await authHeaders(),
    body: JSON.stringify({ key, fileHash }),
  });
  if (res.status === 429) {
    const data = await res.json();
    throw new Error(data.error || 'Limite mensal de faturas excedido.');
  }
  if (!res.ok) throw new Error(`Erro ao processar: ${res.status}`);
  return res.json() as Promise<{
    status: string; jobId?: string; key?: string; remaining?: number;
    expenses?: { category: string; description: string; amount: number; date?: string }[];
    totalAmount?: number; expensesTotal?: number; referenceMonth?: string;
  }>;
}

async function checkStatus(params: { jobId?: string; key?: string }) {
  const res = await fetch(`${API_URL}/check-status`, {
    method: 'POST', headers: await authHeaders(),
    body: JSON.stringify(params),
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
  const fileHash = await computeFileHash(file);
  const { uploadUrl, key } = await getUploadUrl(file.name, file.type || 'application/pdf', file.size, fileHash);
  await uploadToS3(uploadUrl, file);
  const start = await startProcessing(key, fileHash);

  let expenses: { category: string; description: string; amount: number; date?: string }[] = [];
  let totalAmount = 0;
  let expensesTotal: number | undefined;
  let referenceMonth = '';

  if (start.status === 'done') {
    expenses = start.expenses ?? [];
    totalAmount = start.totalAmount ?? 0;
    expensesTotal = start.expensesTotal;
    referenceMonth = start.referenceMonth ?? '';
  } else if (start.status === 'queued' || start.status === 'processing') {
    // Poll using key (new SQS flow) or jobId (legacy)
    const pollParams = start.key ? { key: start.key } : { jobId: start.jobId };
    let found = false;
    for (let i = 0; i < 90; i++) {
      await sleep(3000);
      const s = await checkStatus(pollParams);
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

export async function processDemoInvoice(file: File): Promise<Omit<Invoice, 'id' | 'status'>> {
  const sessionId = getDemoSessionId();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Demo-Session': sessionId,
  };

  // Step 1: Get upload URL
  const urlRes = await fetch(`${API_URL}/demo/invoice`, {
    method: 'POST', headers,
    body: JSON.stringify({ action: 'upload-url', filename: file.name, contentType: file.type || 'application/pdf', fileSize: file.size }),
  });
  if (urlRes.status === 429) {
    const data = await urlRes.json();
    throw new Error(data.error || 'Limite do demo atingido. Crie uma conta para processar mais.');
  }
  if (!urlRes.ok) throw new Error(`Erro: ${urlRes.status}`);
  const { uploadUrl, key } = await urlRes.json() as { uploadUrl: string; key: string };

  // Step 2: Upload to S3
  const upRes = await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type || 'application/pdf' }, body: file });
  if (!upRes.ok) throw new Error('Erro no upload');

  // Step 3: Start processing
  const procRes = await fetch(`${API_URL}/demo/invoice`, {
    method: 'POST', headers,
    body: JSON.stringify({ action: 'process', key }),
  });
  if (procRes.status === 429) {
    const data = await procRes.json();
    throw new Error(data.error || 'Limite do demo atingido.');
  }
  if (!procRes.ok) throw new Error(`Erro ao processar: ${procRes.status}`);

  // Step 4: Poll for result
  let expenses: { category: string; description: string; amount: number; date?: string }[] = [];
  let totalAmount = 0;
  let referenceMonth = '';

  for (let i = 0; i < 90; i++) {
    await sleep(3000);
    const statusRes = await fetch(`${API_URL}/demo/invoice`, {
      method: 'POST', headers,
      body: JSON.stringify({ action: 'check-status', key }),
    });
    if (!statusRes.ok) continue;
    const s = await statusRes.json() as { status: string; expenses?: typeof expenses; totalAmount?: number; referenceMonth?: string; error?: string };
    if (s.status === 'done') {
      expenses = s.expenses ?? [];
      totalAmount = s.totalAmount ?? 0;
      referenceMonth = s.referenceMonth ?? '';
      break;
    }
    if (s.status === 'error') throw new Error(s.error ?? 'Erro no processamento');
  }

  const now = new Date();
  if (!referenceMonth) referenceMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  return { fileName: file.name, uploadDate: now.toISOString(), referenceMonth, totalAmount, expenses };
}
