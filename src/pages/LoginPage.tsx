import { useState } from 'react';
import { Mail, Lock, User, Loader2, ArrowRight, KeyRound, Play } from 'lucide-react';
import { useAuth } from '../components/AuthProvider';
import { forgotPassword, confirmForgotPassword } from '../services/authService';

type Mode = 'login' | 'signup' | 'confirm' | 'forgot' | 'reset';

export function LoginPage() {
  const { signIn, signUp, confirmSignUp, enterDemo } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      if (mode === 'login') {
        await signIn(email, password);
      } else if (mode === 'signup') {
        await signUp(email, password, name || undefined);
        setMode('confirm');
      } else if (mode === 'confirm') {
        await confirmSignUp(email, code);
        await signIn(email, password);
      } else if (mode === 'forgot') {
        await forgotPassword(email);
        setMode('reset');
        setSuccess('Código enviado para ' + email);
      } else if (mode === 'reset') {
        await confirmForgotPassword(email, code, newPassword);
        setSuccess('Senha alterada com sucesso!');
        setPassword(newPassword);
        setMode('login');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally { setLoading(false); }
  };

  const inputCls = "w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl pl-11 pr-4 py-3 text-[#f0ece4] text-sm placeholder:text-[#8a8580] focus:border-[#d4a017] focus:shadow-[0_0_0_3px_rgba(212,160,23,0.12)] transition-all";

  const subtitle: Record<Mode, string> = {
    login: 'Entre na sua conta',
    signup: 'Crie sua conta',
    confirm: 'Confirme seu e-mail',
    forgot: 'Recuperar senha',
    reset: 'Nova senha',
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Cadê Meu Salário" className="w-16 h-16 rounded-2xl mx-auto mb-4 shadow-[0_8px_24px_rgba(212,160,23,0.3)]" />
          <h1 className="text-2xl font-bold text-[#f0ece4] tracking-tight">Cadê Meu Salário</h1>
          <p className="text-[#8a8580] text-sm mt-1">{subtitle[mode]}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-8 space-y-4">
          {error && (
            <div className="bg-[rgba(217,54,54,0.1)] border border-[#d93636]/20 text-[#d93636] text-sm rounded-xl px-4 py-3">{error}</div>
          )}
          {success && (
            <div className="bg-[rgba(45,157,78,0.1)] border border-[#2d9d4e]/20 text-[#2d9d4e] text-sm rounded-xl px-4 py-3">{success}</div>
          )}

          {mode === 'confirm' && (
            <>
              <p className="text-[#a0998a] text-sm text-center">Enviamos um código para {email}</p>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8a8580]" />
                <input type="text" placeholder="Código de verificação" value={code} onChange={(e) => setCode(e.target.value)} className={inputCls} autoFocus />
              </div>
            </>
          )}

          {mode === 'forgot' && (
            <>
              <p className="text-[#a0998a] text-sm text-center">Informe seu e-mail para receber o código de recuperação</p>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8a8580]" />
                <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} autoFocus />
              </div>
            </>
          )}

          {mode === 'reset' && (
            <>
              <div className="relative">
                <KeyRound size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8a8580]" />
                <input type="text" placeholder="Código de verificação" value={code} onChange={(e) => setCode(e.target.value)} className={inputCls} autoFocus />
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8a8580]" />
                <input type="password" placeholder="Nova senha" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputCls} />
              </div>
            </>
          )}

          {(mode === 'login' || mode === 'signup') && (
            <>
              {mode === 'signup' && (
                <div className="relative">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8a8580]" />
                  <input type="text" placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
                </div>
              )}
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8a8580]" />
                <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} autoFocus />
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8a8580]" />
                <input type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} />
              </div>
            </>
          )}

          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-[#d4a017] hover:bg-[#b8890f] text-[#1a1a1a] font-semibold py-3 rounded-xl transition-all hover:shadow-[0_4px_12px_rgba(212,160,23,0.4)] disabled:opacity-50 cursor-pointer">
            {loading ? <Loader2 size={18} className="animate-spin" /> : (
              <>
                {mode === 'login' && 'Entrar'}
                {mode === 'signup' && 'Criar conta'}
                {mode === 'confirm' && 'Confirmar'}
                {mode === 'forgot' && 'Enviar código'}
                {mode === 'reset' && 'Redefinir senha'}
                <ArrowRight size={16} />
              </>
            )}
          </button>

          <div className="text-center space-y-2">
            {mode === 'login' && (
              <>
                <button type="button" onClick={() => { setMode('forgot'); setError(''); setSuccess(''); }}
                  className="text-[#8a8580] text-sm hover:text-[#d4a017] cursor-pointer block mx-auto">
                  Esqueci minha senha
                </button>
                <p className="text-[#8a8580] text-sm">
                  Não tem conta?{' '}
                  <button type="button" onClick={() => { setMode('signup'); setError(''); setSuccess(''); }}
                    className="text-[#d4a017] hover:underline cursor-pointer font-medium">Criar conta</button>
                </p>
              </>
            )}
            {mode === 'signup' && (
              <p className="text-[#8a8580] text-sm">
                Já tem conta?{' '}
                <button type="button" onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                  className="text-[#d4a017] hover:underline cursor-pointer font-medium">Entrar</button>
              </p>
            )}
            {(mode === 'forgot' || mode === 'reset') && (
              <button type="button" onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                className="text-[#8a8580] text-sm hover:text-[#d4a017] cursor-pointer">
                Voltar para login
              </button>
            )}
          </div>
        </form>

        {/* Demo button */}
        <div className="mt-6 text-center">
          <div className="relative flex items-center justify-center mb-4">
            <div className="border-t border-[#2a2a2a] flex-1"></div>
            <span className="px-4 text-[#8a8580] text-xs uppercase tracking-wider">ou</span>
            <div className="border-t border-[#2a2a2a] flex-1"></div>
          </div>
          <button onClick={enterDemo}
            className="w-full flex items-center justify-center gap-2 bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#d4a017]/50 text-[#f0ece4] font-medium py-3 rounded-xl transition-all hover:shadow-[0_4px_12px_rgba(212,160,23,0.15)] cursor-pointer group">
            <Play size={16} className="text-[#d4a017] group-hover:scale-110 transition-transform" />
            <span>Ver Demonstração</span>
          </button>
          <p className="text-[#8a8580] text-xs mt-2">Explore o app com dados fictícios, sem criar conta</p>
        </div>
      </div>
    </div>
  );
}
