import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { Logo } from '../components/Logo';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, user } = useGlobal();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
    } catch (err) {
      setError('Credenciais inválidas. Verifique o seu e-mail e senha.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-black border border-white/10 rounded-2xl py-4 pl-12 pr-12 focus:outline-none focus:border-[#0217ff] text-white placeholder-zinc-600 transition-colors";

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 selection:bg-[#0217ff]/30 relative overflow-hidden">
      
      {/* Fundo Minimalista com o novo azul */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#0217ff]/10 blur-[150px] rounded-full pointer-events-none" />

      {/* Botão Voltar para a Landing Page */}
      <button 
        onClick={() => navigate('/landing')}
        className="absolute top-8 left-8 text-zinc-500 hover:text-white transition-colors font-bold text-sm hidden md:block z-20"
      >
        &larr; Voltar ao site
      </button>

      {/* Cartão de Login */}
      <div className="w-full max-w-md bg-zinc-950/90 backdrop-blur-xl border border-white/10 p-8 md:p-10 rounded-[40px] shadow-2xl relative z-10 animate-fade-in">
        
        {/* Cabeçalho */}
        <div className="flex flex-col items-center mb-10">
          <div className="flex items-center gap-3 mb-8">
            <Logo className="w-10 h-10" />
            <span className="font-bold text-3xl tracking-tight">Imobi<span className="text-[#0217ff]">Pro</span></span>
          </div>
          <h1 className="text-2xl font-black mb-2">Acesse a sua conta</h1>
          <p className="text-zinc-400 text-sm text-center">Bem-vindo de volta! Insira os seus dados para continuar.</p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="seu@email.com"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between ml-1">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Senha</label>
              <button type="button" className="text-[10px] font-bold text-[#0217ff] hover:underline uppercase tracking-widest transition-colors">
                Esqueceu?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl text-sm font-medium animate-shake text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-4 bg-[#0217ff] hover:bg-[#0211bf] text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100 shadow-[0_0_30px_rgba(2,23,255,0.3)]"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                Entrar no Sistema
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {/* Rodapé do Login */}
        <div className="mt-8 pt-8 border-t border-white/5 text-center">
          <p className="text-zinc-500 text-sm font-medium">
            Ainda não tem uma conta?{' '}
            <button 
              onClick={() => navigate('/landing')}
              className="text-[#0217ff] font-bold hover:underline transition-all"
            >
              Ver planos
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}