import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useGlobal } from '../context/GlobalContext';
import { Lock, Mail, Eye, EyeOff, Loader2, ShieldAlert, ArrowRight } from 'lucide-react';
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

  // Redirecionamento automático se já estiver logado
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
          throw new Error('E-mail ou senha incorretos.');
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
      `}</style>

      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#0217ff]/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-md w-full space-y-10 relative z-10 animate-in fade-in slide-in-from-bottom-10 duration-700">
        
        {/* Header do Login */}
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-6">
            <Logo className="w-12 h-12" />
          </div>
          <h1 className="text-4xl font-[900] uppercase italic tracking-tighter">
            Aceder ao <span className="text-[#0217ff]">Painel</span>
          </h1>
          <p className="text-zinc-500 text-sm font-medium italic">
            Insira as suas credenciais para gerir o seu ecossistema.
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <div className="relative group">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-[#0217ff] transition-colors" size={20} />
              <input 
                type="email" 
                required 
                placeholder="E-mail profissional"
                className="w-full bg-zinc-950 border border-white/5 rounded-[24px] py-5 pl-14 pr-6 outline-none focus:border-[#0217ff]/50 transition-all font-bold text-sm"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-[#0217ff] transition-colors" size={20} />
              <input 
                type={showPassword ? "text" : "password"} 
                required 
                placeholder="Palavra-passe"
                className="w-full bg-zinc-950 border border-white/5 rounded-[24px] py-5 pl-14 pr-14 outline-none focus:border-[#0217ff]/50 transition-all font-bold text-sm"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Erro de Autenticação */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 animate-shake">
              <ShieldAlert className="text-red-500 shrink-0" size={18} />
              <p className="text-red-500 text-[10px] font-black uppercase italic tracking-tight">{error}</p>
            </div>
          )}

          <button 
            disabled={loading} 
            type="submit" 
            className="w-full py-6 bg-[#0217ff] text-white rounded-[24px] font-[900] uppercase text-xs tracking-[0.2em] shadow-xl shadow-blue-600/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>Entrar no Sistema <ArrowRight size={18} /></>
            )}
          </button>
        </form>

        {/* Footer do Login */}
        <div className="pt-8 text-center space-y-6">
          <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest">
            Não tem acesso? <a href="/#plans" className="text-white hover:text-[#0217ff] underline transition-colors">Assinar ImobiPro</a>
          </p>
          
          <div className="flex justify-center gap-6 text-[9px] font-black uppercase tracking-widest text-zinc-800">
            <Link to="/terms" className="hover:text-zinc-500 transition-colors">Termos</Link>
            <Link to="/privacy" className="hover:text-zinc-500 transition-colors">Privacidade</Link>
          </div>
        </div>
      </div>
    </div>
  );
}