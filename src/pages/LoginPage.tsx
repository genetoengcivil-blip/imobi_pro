import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useGlobal } from '../context/GlobalContext';
import { Lock, Mail, Eye, EyeOff, Loader2, ShieldAlert } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: globalLoading } = useGlobal();
  
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // 1️⃣ MUDA DE /app/dashboard PARA /dashboard
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
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      // O useEffect acima faz o redirecionamento assim que o estado atualizar.
    } catch (err: any) {
      setError(err.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-[440px]">
        <div className="bg-zinc-950 border border-white/5 rounded-[48px] p-10 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-black italic uppercase tracking-tighter">Área <span className="text-[#0217ff]">Exclusiva</span></h2>
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mt-2 italic">Identifique-se para entrar</p>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                <input 
                  type="email" required placeholder="E-mail"
                  className="w-full bg-black border-2 border-white/5 rounded-2xl py-5 pl-16 pr-6 outline-none focus:border-[#0217ff] transition-all font-bold"
                  value={email} onChange={e => setEmail(e.target.value)}
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                <input 
                  type={showPassword ? "text" : "password"} required placeholder="Senha"
                  className="w-full bg-black border-2 border-white/5 rounded-2xl py-5 pl-16 pr-6 outline-none focus:border-[#0217ff] transition-all font-bold"
                  value={password} onChange={e => setPassword(e.target.value)}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3">
                <ShieldAlert className="text-red-500" size={18} />
                <p className="text-red-500 text-[10px] font-black uppercase italic">{error}</p>
              </div>
            )}

            <button disabled={loading} type="submit" className="w-full py-6 bg-white text-black rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-105 transition-all">
              {loading ? <Loader2 className="animate-spin mx-auto" /> : "Entrar no Sistema"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}