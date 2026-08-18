import { useState, useMemo } from 'react';
import { TrendingUp, Calculator } from 'lucide-react';

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

interface Projection {
  year: number;
  age: number;
  balance: number;
}

export function RetirementPlanner() {
  const [currentAge, setCurrentAge] = useState(30);
  const [currentBalance, setCurrentBalance] = useState(50000);
  const [monthlyContribution, setMonthlyContribution] = useState(2000);
  const [annualReturn, setAnnualReturn] = useState(10);
  const [targetAmount, setTargetAmount] = useState(2000000);
  const [showPlanner, setShowPlanner] = useState(false);

  const projection = useMemo((): Projection[] => {
    const monthlyRate = annualReturn / 100 / 12;
    let balance = currentBalance;
    const data: Projection[] = [];
    
    for (let year = 0; year <= 40; year++) {
      data.push({ year, age: currentAge + year, balance: Math.round(balance) });
      if (balance >= targetAmount) break;
      for (let m = 0; m < 12; m++) {
        balance = balance * (1 + monthlyRate) + monthlyContribution;
      }
    }
    return data;
  }, [currentAge, currentBalance, monthlyContribution, annualReturn, targetAmount]);

  const yearsToTarget = projection.findIndex((p) => p.balance >= targetAmount);
  const retirementAge = yearsToTarget >= 0 ? projection[yearsToTarget].age : null;
  const finalBalance = projection[projection.length - 1].balance;

  if (!showPlanner) {
    return (
      <button onClick={() => setShowPlanner(true)}
        className="w-full bg-[#141414] border border-[#2a2a2a] rounded-2xl p-4 sm:p-6 text-left hover:border-[#d4a017]/30 transition-all cursor-pointer group">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[rgba(212,160,23,0.1)] flex items-center justify-center">
            <TrendingUp size={20} className="text-[#d4a017]" />
          </div>
          <div>
            <p className="text-[#f0ece4] font-medium group-hover:text-[#d4a017] transition-colors">Simulador de aposentadoria</p>
            <p className="text-[#8a8580] text-sm">Descubra quando pode se aposentar com base no seu ritmo de investimento</p>
          </div>
        </div>
      </button>
    );
  }

  return (
    <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-4 sm:p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Calculator size={16} className="text-[#d4a017]" />
          <h3 className="text-[#8a8580] text-sm font-semibold uppercase tracking-wider">Simulador de aposentadoria</h3>
        </div>
        <button onClick={() => setShowPlanner(false)} className="text-[#8a8580] hover:text-[#f0ece4] text-sm cursor-pointer">Fechar</button>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <div>
          <label className="text-[#8a8580] text-xs block mb-1">Idade atual</label>
          <input type="number" value={currentAge} onChange={(e) => setCurrentAge(Number(e.target.value))}
            className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[#f0ece4] text-sm" />
        </div>
        <div>
          <label className="text-[#8a8580] text-xs block mb-1">Patrimônio atual</label>
          <input type="number" value={currentBalance} onChange={(e) => setCurrentBalance(Number(e.target.value))}
            className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[#f0ece4] text-sm" />
        </div>
        <div>
          <label className="text-[#8a8580] text-xs block mb-1">Aporte mensal</label>
          <input type="number" value={monthlyContribution} onChange={(e) => setMonthlyContribution(Number(e.target.value))}
            className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[#f0ece4] text-sm" />
        </div>
        <div>
          <label className="text-[#8a8580] text-xs block mb-1">Retorno anual (%)</label>
          <input type="number" value={annualReturn} onChange={(e) => setAnnualReturn(Number(e.target.value))} step="0.5"
            className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[#f0ece4] text-sm" />
        </div>
        <div>
          <label className="text-[#8a8580] text-xs block mb-1">Objetivo</label>
          <input type="number" value={targetAmount} onChange={(e) => setTargetAmount(Number(e.target.value))}
            className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[#f0ece4] text-sm" />
        </div>
      </div>

      {/* Result */}
      <div className="bg-[#0a0a0a] rounded-xl p-4 mb-4">
        {retirementAge ? (
          <div className="text-center">
            <p className="text-[#8a8580] text-sm">Com esse ritmo, você atinge {fmt(targetAmount)} aos</p>
            <p className="text-[#d4a017] text-4xl font-bold my-2">{retirementAge} anos</p>
            <p className="text-[#8a8580] text-sm">em {yearsToTarget} anos a partir de agora</p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-[#8a8580] text-sm">Em 40 anos você acumula</p>
            <p className="text-[#d4a017] text-3xl font-bold my-2">{fmt(finalBalance)}</p>
            <p className="text-[#8a8580] text-sm">Aumente o aporte ou retorno para atingir {fmt(targetAmount)} mais rápido</p>
          </div>
        )}
      </div>

      {/* Mini timeline */}
      <div className="space-y-1 max-h-[200px] overflow-y-auto">
        {projection.filter((_, i) => i % 5 === 0 || i === projection.length - 1).map((p) => (
          <div key={p.year} className="flex items-center justify-between text-sm px-2 py-1 rounded-lg hover:bg-[#1a1a1a]">
            <span className="text-[#8a8580]">{p.age} anos ({p.year > 0 ? `+${p.year}a` : 'hoje'})</span>
            <span className={`font-medium ${p.balance >= targetAmount ? 'text-[#2d9d4e]' : 'text-[#f0ece4]'}`}>{fmt(p.balance)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
