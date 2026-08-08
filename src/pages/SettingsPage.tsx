import { useState, useEffect, useRef } from 'react';
import { Save, ExternalLink, Download, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { getApiToken, setApiToken } from '../services/quoteService';
import { usePortfolioStore } from '../store/usePortfolioStore';

export function SettingsPage() {
  const [token, setToken] = useState('');
  const [saved, setSaved] = useState(false);
  const [backupMsg, setBackupMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const refresh = usePortfolioStore((s) => s.refreshQuotes);

  useEffect(() => { setToken(getApiToken()); }, []);

  const save = () => { setApiToken(token); setSaved(true); refresh(); setTimeout(() => setSaved(false), 2000); };

  const exportData = () => {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      portfolio: JSON.parse(localStorage.getItem('portfolio-storage') ?? '{}'),
      fixedIncome: JSON.parse(localStorage.getItem('fixed-income-storage') ?? '{}'),
      invoices: JSON.parse(localStorage.getItem('invoice-storage') ?? '{}'),
      goals: JSON.parse(localStorage.getItem('goals-storage') ?? '{}'),
      brapiToken: getApiToken(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kdmeusalario_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setBackupMsg({ type: 'ok', text: 'Backup exportado com sucesso' });
    setTimeout(() => setBackupMsg(null), 3000);
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        if (!data.version) throw new Error('Arquivo inválido');

        if (data.portfolio?.state) {
          localStorage.setItem('portfolio-storage', JSON.stringify(data.portfolio));
        }
        if (data.fixedIncome?.state) {
          localStorage.setItem('fixed-income-storage', JSON.stringify(data.fixedIncome));
        }
        if (data.invoices?.state) {
          localStorage.setItem('invoice-storage', JSON.stringify(data.invoices));
        }
        if (data.goals?.state) {
          localStorage.setItem('goals-storage', JSON.stringify(data.goals));
        }
        if (data.brapiToken) {
          setApiToken(data.brapiToken);
          setToken(data.brapiToken);
        }

        setBackupMsg({ type: 'ok', text: 'Backup importado. Recarregando...' });
        setTimeout(() => window.location.reload(), 1500);
      } catch {
        setBackupMsg({ type: 'err', text: 'Arquivo inválido. Use um backup exportado pelo Cadê Meu Salário.' });
        setTimeout(() => setBackupMsg(null), 4000);
      }
    };
    reader.readAsText(file);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-[#f0ece4] tracking-tight">Configurações</h1>
        <p className="text-[#8a8580] text-sm mt-1">Token da API e backup dos dados</p>
      </div>

      {/* Brapi Token */}
      <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="text-[#f0ece4] font-semibold text-sm mb-1">Token da Brapi</h2>
          <p className="text-[#8a8580] text-sm mb-3">Necessário para buscar cotações de ações. Crie uma conta gratuita na Brapi.</p>
          <a href="https://brapi.dev/dashboard" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-[#d4a017] hover:text-[#e8b420] transition-colors mb-4">
            Obter token <ExternalLink size={12} />
          </a>
        </div>
        <div>
          <label htmlFor="apiToken" className="block text-sm text-[#8a8580] mb-1.5 font-medium">API Token</label>
          <input id="apiToken" type="password" placeholder="Cole seu token aqui" value={token} onChange={(e) => setToken(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-[#f0ece4] text-sm placeholder:text-[#8a8580] focus:outline-none focus:border-[#d4a017] focus:shadow-[0_0_0_3px_rgba(212,160,23,0.12)] transition-all" />
        </div>
        <button onClick={save}
          className="flex items-center gap-2 bg-[#d4a017] hover:bg-[#b8890f] text-[#1a1a1a] text-sm font-semibold px-5 py-2.5 rounded-xl transition-all hover:shadow-[0_4px_12px_rgba(212,160,23,0.4)] cursor-pointer">
          <Save size={14} />{saved ? 'Salvo' : 'Salvar'}
        </button>
      </div>

      {/* Backup */}
      <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="text-[#f0ece4] font-semibold text-sm mb-1">Backup dos dados</h2>
          <p className="text-[#8a8580] text-sm">Seus dados ficam no navegador (localStorage). Exporte um backup pra não perder nada, e importe em qualquer máquina.</p>
        </div>

        {backupMsg && (
          <div className={`flex items-center gap-2 text-sm px-4 py-3 rounded-xl ${
            backupMsg.type === 'ok' ? 'bg-[rgba(45,157,78,0.1)] border border-[#2d9d4e]/20 text-[#2d9d4e]' : 'bg-[rgba(217,54,54,0.1)] border border-[#d93636]/20 text-[#d93636]'
          }`}>
            {backupMsg.type === 'ok' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
            {backupMsg.text}
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={exportData}
            className="flex items-center gap-2 bg-[rgba(45,157,78,0.15)] hover:bg-[rgba(45,157,78,0.25)] text-[#2d9d4e] text-sm font-medium px-5 py-2.5 rounded-xl border border-[#2d9d4e]/20 transition-all cursor-pointer">
            <Download size={14} />Exportar backup
          </button>
          <button onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 bg-[#1a1a1a] hover:bg-[#1f1f1f] text-[#a0998a] text-sm font-medium px-5 py-2.5 rounded-xl border border-[#2a2a2a] transition-all cursor-pointer">
            <Upload size={14} />Importar backup
          </button>
          <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={importData} />
        </div>

        <p className="text-[#8a8580] text-sm">O backup inclui: carteira de ações, renda fixa, faturas processadas e token da Brapi.</p>
      </div>
    </div>
  );
}
