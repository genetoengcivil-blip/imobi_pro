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
          throw new Error('E-mail ou palavra-passe incorretos.');
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
      
      {/* Importação Forçada da Fonte Inter 900 */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        
        @keyframes bg-pulse {
          0% { transform: scale(1); opacity: 0.1; }
          50% { transform: scale(1.2); opacity: 0.15; }
          100% { transform: scale(1); opacity: 0.1; }
        }
        .animate-bg-pulse { animation: bg-pulse 8s infinite ease-in-out; }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
      `}</style>

      {/* Luzes de Fundo de Alta Performance */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#0217ff]/20 blur-[150px] rounded-full animate-bg-pulse pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-900/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-md w-full relative z-10 animate-in fade-in slide-in-from-bottom-10 duration-1000">
        
        {/* Branding Superior */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-8">
            <div className="p-5 bg-white/5 rounded-[32px] border border-white/10 backdrop-blur-xl shadow-2xl">
              <Logo className="w-14 h-14" />
            </div>
          </div>
          <h1 className="text-5xl font-[900] uppercase italic tracking-tighter leading-none mb-4">
            LOGIN <br /> <span className="text-[#0217ff]">IMOBIPRO</span>
          </h1>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10">
            <ShieldCheck size={12} className="text-[#0217ff]" />
            <span className="text-[9px] font-[900] uppercase tracking-[0.3em] text-zinc-400 italic">Sessão Criptografada</span>
          </div>
        </div>

        {/* Card de Login com Glassmorphism Pesado */}
        <div className="bg-zinc-950/40 backdrop-blur-3xl border border-white/10 rounded-[50px] p-10 md:p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)]">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              {/* E-mail */}
              <div className="relative group">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-[#0217ff] transition-all" size={20} />
                <input 
                  type="email" 
                  required 
                  placeholder="E-mail profissional"
                  className="w-full bg-black/50 border border-white/5 rounded-[24px] py-5 pl-16 pr-6 outline-none focus:border-[#0217ff] focus:ring-4 focus:ring-[#0217ff]/10 transition-all font-bold text-sm placeholder:text-zinc-800"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>

              {/* Palavra-passe */}
              <div className="relative group">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-[#0217ff] transition-all" size={20} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  required 
                  placeholder="Palavra-passe"
                  className="w-full bg-black/50 border border-white/5 rounded-[24px] py-5 pl-16 pr-16 outline-none focus:border-[#0217ff] focus:ring-4 focus:ring-[#0217ff]/10 transition-all font-bold text-sm placeholder:text-zinc-800"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                </button>
              </div>
            </div>

            {/* Alerta de Erro com Animação Shake */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 p-5 rounded-[24px] flex items-center gap-4 animate-shake">
                <ShieldAlert className="text-red-500 shrink-0" size={20} />
                <p className="text-red-500 text-[11px] font-[900] uppercase italic tracking-tight leading-tight">{error}</p>
              </div>
            )}

            {/* Botão de Submissão Ultra-Vibrante */}
            <button 
              disabled={loading} 
              type="submit" 
              className="w-full py-7 bg-[#0217ff] text-white rounded-[24px] font-[900] uppercase text-xs tracking-[0.3em] shadow-[0_20px_40px_-10px_rgba(2,23,255,0.4)] hover:bg-[#0011cc] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 group"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                <>ACEDER AO ECOSSISTEMA <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" /></>
              )}
            </button>
          </form>
        </div>

        {/* Rodapé do Login */}
        <div className="mt-12 text-center space-y-8">
          <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.3em]">
            Não tem uma conta? <a href="/#plans" className="text-white border-b border-white/20 hover:border-[#0217ff] hover:text-[#0217ff] transition-all pb-1">Ver Planos de Elite</a>
          </p>
          
          <div className="flex justify-center gap-10 text-[9px] font-black uppercase tracking-[0.4em] text-zinc-800 italic">
            <Link to="/terms" className="hover:text-zinc-400 transition-colors">Termos</Link>
            <Link to="/privacy" className="hover:text-zinc-400 transition-colors">Privacidade</Link>
          </div>
        </div>
      </div>
    </div>
  );
}