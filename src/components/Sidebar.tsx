import { useState } from 'react';
import { Home, Briefcase, Receipt, Settings, LogOut, Menu, X } from 'lucide-react';
import { useFeatureGate } from '../hooks/useFeatureGate';

export type Page = 'home' | 'portfolio' | 'invoices' | 'settings' | 'income';

const navItems: { page: Page; label: string; icon: typeof Home; feature?: 'settings' }[] = [
  { page: 'home', label: 'Home', icon: Home },
  { page: 'portfolio', label: 'Carteira', icon: Briefcase },
  { page: 'invoices', label: 'Faturas', icon: Receipt },
  { page: 'settings', label: 'Config', icon: Settings, feature: 'settings' },
];

export function Sidebar({ currentPage, onNavigate, userName, onSignOut }: {
  currentPage: Page; onNavigate: (p: Page) => void; userName?: string; onSignOut?: () => void;
}) {
  const { hasAccess } = useFeatureGate();
  const visibleItems = navItems.filter((item) => !item.feature || hasAccess(item.feature));
  const [open, setOpen] = useState(false);

  const navigate = (p: Page) => { onNavigate(p); setOpen(false); };

  return (
    <>
      {/* Desktop: collapsed bar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-16 bg-[#050505] flex-col items-center z-10 border-r border-white/[0.06]">
        <button onClick={() => setOpen(true)} className="mt-4 p-2 rounded-xl hover:bg-white/[0.06] cursor-pointer transition-colors">
          <Menu size={20} className="text-[#8a8580]" />
        </button>
        <button onClick={() => navigate('home')} className="mt-4 cursor-pointer">
          <img src="/logo.png" alt="Cadê Meu Salário" className="w-9 h-9 rounded-lg" />
        </button>
        <nav className="flex-1 flex flex-col items-center gap-2 mt-6">
          {visibleItems.map(({ page, icon: Icon }) => (
            <button key={page} onClick={() => navigate(page)}
              className={`p-3 rounded-xl transition-all cursor-pointer ${
                currentPage === page ? 'bg-[#d4a017] text-[#1a1a1a]' : 'text-[#8a8580] hover:text-white hover:bg-white/[0.06]'
              }`}>
              <Icon size={18} />
            </button>
          ))}
        </nav>
        {userName && (
          <button onClick={() => navigate('income')} className="mb-4 cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#d4a017] to-[#f0c940] flex items-center justify-center">
              <span className="text-[#1a1a1a] text-sm font-bold">{userName.charAt(0).toUpperCase()}</span>
            </div>
          </button>
        )}
      </aside>

      {/* Desktop: expanded overlay */}
      {open && (
        <>
          <div className="hidden md:block fixed inset-0 bg-black/50 z-20" onClick={() => setOpen(false)} />
          <aside className="hidden md:flex fixed left-0 top-0 h-screen w-72 bg-[#050505] flex-col z-30 shadow-2xl animate-[slideIn_0.2s_ease]">
            <div className="px-6 py-5 border-b border-white/[0.06] flex items-center justify-between">
              <button onClick={() => navigate('home')} className="flex items-center gap-3 cursor-pointer">
                <img src="/logo.png" alt="Cadê Meu Salário" className="w-10 h-10 rounded-xl" />
                <span className="text-lg font-bold text-white tracking-tight">Cadê Meu Salário</span>
              </button>
              <button onClick={() => setOpen(false)} className="text-[#8a8580] hover:text-white cursor-pointer p-1">
                <X size={18} />
              </button>
            </div>
            <nav className="flex-1 px-4 mt-4">
              <div className="flex flex-col gap-1">
                {visibleItems.map(({ page, label, icon: Icon }) => (
                  <button key={page} onClick={() => navigate(page)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                      currentPage === page
                        ? 'bg-[#d4a017] text-[#1a1a1a] shadow-[0_4px_12px_rgba(212,160,23,0.4)]'
                        : 'text-[#8a8580] hover:text-white hover:bg-white/[0.06]'
                    }`}>
                    <Icon size={18} />{label}
                  </button>
                ))}
              </div>
            </nav>
            <div className="px-4 pb-4 border-t border-white/[0.06] pt-4">
              {userName && (
                <div className="flex items-center justify-between px-4 py-2">
                  <button onClick={() => navigate('income')} className="flex items-center gap-2 min-w-0 cursor-pointer hover:opacity-80 transition-opacity">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#d4a017] to-[#f0c940] flex items-center justify-center flex-shrink-0">
                      <span className="text-[#1a1a1a] text-sm font-bold">{userName.charAt(0).toUpperCase()}</span>
                    </div>
                    <span className="text-[#a0998a] text-sm truncate">{userName}</span>
                  </button>
                  {onSignOut && (
                    <button onClick={onSignOut} className="text-[#8a8580] hover:text-[#d93636] transition-colors cursor-pointer p-1" title="Sair">
                      <LogOut size={14} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </aside>
        </>
      )}

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#050505] border-t border-white/[0.06] z-50 safe-bottom">
        <div className="flex items-center justify-around px-2 py-2">
          {visibleItems.map(({ page, label, icon: Icon }) => (
            <button key={page} onClick={() => onNavigate(page)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all cursor-pointer min-w-[60px] ${
                currentPage === page ? 'text-[#d4a017]' : 'text-[#8a8580]'
              }`}>
              <Icon size={20} />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
          {onSignOut && (
            <button onClick={onSignOut}
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-[#8a8580] cursor-pointer min-w-[60px]">
              <LogOut size={20} />
              <span className="text-sm font-medium">Sair</span>
            </button>
          )}
        </div>
      </nav>
    </>
  );
}
