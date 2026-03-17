import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useGlobal } from '../context/GlobalContext';
import { Lock, Mail, Eye, EyeOff, Loader2, ShieldAlert, ArrowRight, ShieldCheck } from 'lucide-react';
import { Logo } from '../components/Logo';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: globalLoading } = useGlobal();
  
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (!globalLoading && user && user.status !== 'bloqueado') {
      const from = (location.state as any)?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    }
  }, [user, globalLoading, navigate, location]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    setLoading(true);
    setError(null);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        if (signInError.message === 'Invalid login credentials') {
          throw new Error('Credenciais de acesso inválidas.');
        }
        throw signInError;
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 selection:bg-[#0217ff]/30 relative overflow-hidden font-['Inter',sans-serif]">
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
      `}</style>

      {/* Luzes de Fundo Dinâmicas */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#0217ff]/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-md w-full relative z-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
        
        {/* Logo e Título */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-white/5 rounded-[24px] border border-white/10 backdrop-blur-md">
              <Logo className="w-12 h-12" />
            </div>
          </div>
          <h1 className="text-4xl font-[900] uppercase italic tracking-tighter leading-none mb-3">
            AUTENTICAÇÃO <br /> <span className="text-[#0217ff]">IMOBIPRO</span>
          </h1>
          <div className="flex items-center justify-center gap-2 text-zinc-500">
            <ShieldCheck size={14} className="text-[#0217ff]" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Acesso Seguro Nexano Systems</span>
          </div>
        </div>

        {/* Card de Login Glassmorphism */}
        <div className="bg-zinc-950/50 backdrop-blur-2xl border border-white/10 rounded-[40px] p-10 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              {/* Campo de E-mail */}
              <div className="relative group">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-[#0217ff] group-focus-within:scale-110 transition-all" size={18} />
                <input 
                  type="email" 
                  required 
                  placeholder="Seu e-mail"
                  className="w-full bg-black/40 border border-white/5 rounded-[22px] py-5 pl-16 pr-6 outline-none focus:border-[#0217ff] focus:ring-4 focus:ring-[#0217ff]/10 transition-all font-bold text-sm placeholder:text-zinc-700"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>

              {/* Campo de Senha */}
              <div className="relative group">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-[#0217ff] group-focus-within:scale-110 transition-all" size={18} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  required 
                  placeholder="Sua senha"
                  className="w-full bg-black/40 border border-white/5 rounded-[22px] py-5 pl-16 pr-16 outline-none focus:border-[#0217ff] focus:ring-4 focus:ring-[#0217ff]/10 transition-all font-bold text-sm placeholder:text-zinc-700"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Mensagem de Erro */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 animate-shake">
                <ShieldAlert className="text-red-500 shrink-0" size={18} />
                <p className="text-red-500 text-[10px] font-[900] uppercase italic tracking-tight leading-tight">{error}</p>
              </div>
            )}

            {/* Botão de Ação */}
            <button 
              disabled={loading} 
              type="submit" 
              className="w-full py-6 bg-[#0217ff] text-white rounded-[24px] font-[900] uppercase text-xs tracking-[0.3em] shadow-[0_10px_40px_-10px_rgba(2,23,255,0.5)] hover:bg-[#0011cc] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>Entrar no Ecossistema <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
              )}
            </button>
          </form>
        </div>

        {/* Links de Rodapé */}
        <div className="mt-10 text-center space-y-6">
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">
            Novo por aqui? <a href="/#plans" className="text-white hover:text-[#0217ff] border-b border-white/10 hover:border-[#0217ff] transition-all pb-1">Adquirir Licença</a>
          </p>
          
          <div className="flex justify-center gap-8 text-[9px] font-black uppercase tracking-widest text-zinc-700 italic">
            <Link to="/terms" className="hover:text-zinc-400 transition-colors">Termos de Uso</Link>
            <Link to="/privacy" className="hover:text-zinc-400 transition-colors">Privacidade</Link>
          </div>
        </div>
      </div>
    </div>
  );
}