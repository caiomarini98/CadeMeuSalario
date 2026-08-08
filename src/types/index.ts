export interface Stock {
  ticker: string;
  quantity: number;
  averagePrice: number;
}

export interface StockQuote {
  symbol: string;
  shortName: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  logourl?: string;
}

export interface HistoricalPrice {
  date: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockSearchResult {
  symbol: string;
  shortName: string;
  longName: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  marketCap: number;
  regularMarketVolume: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  logourl?: string;
  historicalDataPrice: HistoricalPrice[];
}

export interface InvoiceExpense {
  category: string;
  description: string;
  amount: number;
  date?: string;
}

export type FixedIncomeType = 'tesouro' | 'cdb' | 'lci' | 'lca' | 'fundo' | 'debenture' | 'outro';

export interface FixedIncome {
  id: string;
  name: string;
  type: FixedIncomeType;
  investedAmount: number;
  currentAmount: number;
  rate: string;
  purchaseDate: string;
  maturityDate?: string;
  notes?: string;
}

export const FIXED_INCOME_TYPES: { value: FixedIncomeType; label: string }[] = [
  { value: 'tesouro', label: 'Tesouro Direto' },
  { value: 'cdb', label: 'CDB' },
  { value: 'lci', label: 'LCI' },
  { value: 'lca', label: 'LCA' },
  { value: 'fundo', label: 'Fundo de Investimento' },
  { value: 'debenture', label: 'Debênture' },
  { value: 'outro', label: 'Outro' },
];

export interface Invoice {
  id: string;
  fileName: string;
  uploadDate: string;
  referenceMonth: string;
  cardName?: string;
  totalAmount: number;
  expensesTotal?: number;
  expenses: InvoiceExpense[];
  status: 'uploading' | 'processing' | 'done' | 'error';
  errorMessage?: string;
}

export const EXPENSE_CATEGORIES = [
  'Mercado',
  'Alimentação (Trabalho)',
  'Alimentação (Lazer)',
  'Transporte',
  'Moradia',
  'Saúde',
  'Educação',
  'Lazer',
  'Assinaturas',
  'Compras',
  'Serviços',
  'Outros',
] as const;

export type GoalIcon = 'shield' | 'car' | 'home' | 'plane' | 'graduation' | 'heart' | 'gift' | 'piggy' | 'star';

export interface SavingsGoal {
  id: string;
  name: string;
  icon: GoalIcon;
  targetAmount: number;
  currentAmount: number;
  investedAmount: number;
  color: string;
  createdAt: string;
}

export const GOAL_PRESETS: { icon: GoalIcon; label: string; color: string }[] = [
  { icon: 'shield', label: 'Reserva de Emergência', color: '#2d9d4e' },
  { icon: 'car', label: 'Carro', color: '#d4a017' },
  { icon: 'home', label: 'Apartamento', color: '#d93636' },
  { icon: 'plane', label: 'Viagem', color: '#06b6d4' },
  { icon: 'graduation', label: 'Educação', color: '#8a6bbf' },
  { icon: 'heart', label: 'Casamento', color: '#ec4899' },
  { icon: 'gift', label: 'Presente', color: '#e08a1e' },
  { icon: 'piggy', label: 'Poupança', color: '#10b981' },
  { icon: 'star', label: 'Outro', color: '#6366f1' },
];

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
