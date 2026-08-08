import type { StockQuote, StockSearchResult } from '../types';
import { getIdToken } from './authService';

const BASE_URL = 'https://brapi.dev/api';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

let defaultToken: string | null = null;

async function fetchDefaultToken(): Promise<string> {
  if (defaultToken) return defaultToken;
  try {
    const idToken = await getIdToken();
    const res = await fetch(`${API_URL}/config`, {
      headers: idToken ? { Authorization: idToken } : {},
    });
    if (res.ok) {
      const data = await res.json();
      defaultToken = data.brapiToken ?? '';
      return defaultToken ?? '';
    }
  } catch { /* ignore */ }
  return '';
}

export function getApiToken(): string {
  return localStorage.getItem('brapi-token') ?? '';
}

export function setApiToken(token: string) {
  localStorage.setItem('brapi-token', token.trim());
}

async function resolveToken(): Promise<string> {
  const userToken = getApiToken();
  if (userToken) return userToken;
  return fetchDefaultToken();
}

function buildHeadersSync(token: string): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchQuotes(tickers: string[]): Promise<Map<string, StockQuote>> {
  if (tickers.length === 0) return new Map();
  const token = await resolveToken();
  if (!token) {
    throw new Error('Token da Brapi necessário. Configure em Configurações.');
  }
  const quotes = new Map<string, StockQuote>();
  const results = await Promise.allSettled(
    tickers.map(async (ticker) => {
      const url = new URL(`${BASE_URL}/quote/${ticker}`);
      url.searchParams.set('fundamental', 'false');
      const res = await fetch(url.toString(), { headers: buildHeadersSync(token) });
      if (!res.ok) return null;
      const data = await res.json();
      return data.results?.[0] ?? null;
    })
  );
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      const r = result.value;
      quotes.set(r.symbol, {
        symbol: r.symbol, shortName: r.shortName ?? r.symbol,
        regularMarketPrice: r.regularMarketPrice,
        regularMarketChange: r.regularMarketChange ?? 0,
        regularMarketChangePercent: r.regularMarketChangePercent ?? 0,
        logourl: r.logourl,
      });
    }
  }
  if (quotes.size === 0) throw new Error('Não foi possível buscar cotações. Verifique seu token.');
  return quotes;
}

export async function searchStock(ticker: string, range = '1mo', interval = '1d'): Promise<StockSearchResult | null> {
  const upper = ticker.toUpperCase().trim();
  const token = await resolveToken();
  if (!token) throw new Error('Token da Brapi necessário. Configure em Configurações.');
  const url = new URL(`${BASE_URL}/quote/${upper}`);
  url.searchParams.set('range', range);
  url.searchParams.set('interval', interval);
  url.searchParams.set('fundamental', 'false');
  const res = await fetch(url.toString(), { headers: buildHeadersSync(token) });
  if (res.status === 401) throw new Error('Token inválido.');
  if (!res.ok) throw new Error(`Erro: ${res.status}`);
  const data = await res.json();
  const r = data.results?.[0];
  if (!r) return null;
  return {
    symbol: r.symbol, shortName: r.shortName ?? r.symbol, longName: r.longName ?? r.shortName ?? r.symbol,
    regularMarketPrice: r.regularMarketPrice, regularMarketChange: r.regularMarketChange ?? 0,
    regularMarketChangePercent: r.regularMarketChangePercent ?? 0, marketCap: r.marketCap ?? 0,
    regularMarketVolume: r.regularMarketVolume ?? 0, fiftyTwoWeekHigh: r.fiftyTwoWeekHigh ?? 0,
    fiftyTwoWeekLow: r.fiftyTwoWeekLow ?? 0, logourl: r.logourl,
    historicalDataPrice: (r.historicalDataPrice ?? []).map((h: HistoricalPrice) => ({
      date: h.date, open: h.open, high: h.high, low: h.low, close: h.close, volume: h.volume,
    })),
  };
}

type HistoricalPrice = { date: number; open: number; high: number; low: number; close: number; volume: number };

export async function fetchHistorical(tickers: string[], range = '3mo', interval = '1d'): Promise<Map<string, StockSearchResult>> {
  if (tickers.length === 0) return new Map();
  const token = await resolveToken();
  const results = new Map<string, StockSearchResult>();
  const settled = await Promise.allSettled(
    tickers.map(async (ticker) => {
      const url = new URL(`${BASE_URL}/quote/${ticker}`);
      url.searchParams.set('range', range);
      url.searchParams.set('interval', interval);
      url.searchParams.set('fundamental', 'false');
      const res = await fetch(url.toString(), { headers: buildHeadersSync(token) });
      if (!res.ok) return null;
      const data = await res.json();
      return data.results?.[0] ?? null;
    })
  );
  for (const result of settled) {
    if (result.status === 'fulfilled' && result.value) {
      const r = result.value;
      results.set(r.symbol, {
        symbol: r.symbol, shortName: r.shortName ?? r.symbol, longName: r.longName ?? '',
        regularMarketPrice: r.regularMarketPrice, regularMarketChange: r.regularMarketChange ?? 0,
        regularMarketChangePercent: r.regularMarketChangePercent ?? 0, marketCap: r.marketCap ?? 0,
        regularMarketVolume: r.regularMarketVolume ?? 0, fiftyTwoWeekHigh: r.fiftyTwoWeekHigh ?? 0,
        fiftyTwoWeekLow: r.fiftyTwoWeekLow ?? 0, logourl: r.logourl,
        historicalDataPrice: (r.historicalDataPrice ?? []).map((h: HistoricalPrice) => ({
          date: h.date, open: h.open, high: h.high, low: h.low, close: h.close, volume: h.volume,
        })),
      });
    }
  }
  return results;
}
