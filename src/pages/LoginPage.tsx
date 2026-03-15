import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useGlobal } from '../context/GlobalContext';
import { Lock, Mail, Eye, EyeOff, Loader2, ShieldAlert } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { user, loading: globalLoading } = useGlobal();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Se o usuário já estiver logado e ativo, redireciona direto
  useEffect(() => {
    if (!globalLoading && user && user.status !== 'bloqueado') {
      navigate('/app/dashboard');
    }
  }, [user, globalLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      const { data: profile } = await supabase
        .from('perfil')
        .select('status, motivo_bloqueio')
        .eq('id', data.user.id)
        .single();

      if (profile?.status === 'bloqueado') {
        await supabase.auth.signOut();
        setError(`Acesso Suspenso: ${profile.motivo_bloqueio || 'Verifique sua assinatura'}.`);
        setLoading(false);
        return;
      }

      if (data.user?.user_metadata?.must_change_password) {
        setMustChangePassword(true);
      } else {
        navigate('/app/dashboard');
      }
    } catch (err: any) {
      setError(err.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ 
        password: newPassword,
        data: { must_change_password: false }
      });

      if (error) throw error;
      navigate('/app/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 selection:bg-[#0217ff]/30">
      <div className="w-full max-w-[440px]">
        <div className="bg-zinc-950 border border-white/5 rounded-[48px] p-10 shadow-2xl relative overflow-hidden">
          
          {!mustChangePassword ? (
            <form onSubmit={handleLogin} className="space-y-8 relative z-10">
              <div className="text-center">
                <h2 className="text-3xl font-black italic uppercase tracking-tighter">Entrar na <span className="text-[#0217ff]">Área VIP</span></h2>
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mt-2 italic">Aceda ao seu ecossistema ImobiPro</p>
              </div>

              <div className="space-y-4">
                <div className="relative group">
                  <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-[#0217ff] transition-colors" size={18} />
                  <input 
                    type="email" required placeholder="E-mail de acesso"
                    className="w-full bg-black border-2 border-white/5 rounded-2xl py-5 pl-16 pr-6 outline-none focus:border-[#0217ff] transition-all font-bold text-white placeholder:text-zinc-700"
                    value={email} onChange={e => setEmail(e.target.value)}
                  />
                </div>

                <div className="relative group">
                  <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-[#0217ff] transition-colors" size={18} />
                  <input 
                    type={showPassword ? "text" : "password"} required placeholder="Sua senha"
                    className="w-full bg-black border-2 border-white/5 rounded-2xl py-5 pl-16 pr-16 outline-none focus:border-[#0217ff] transition-all font-bold text-white placeholder:text-zinc-700"
                    value={password} onChange={e => setPassword(e.target.value)}
                  />
                  <button 
                    type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3">
                  <ShieldAlert className="text-red-500 shrink-0" size={18} />
                  <p className="text-red-500 text-[10px] font-black uppercase tracking-tight leading-tight">{error}</p>
                </div>
              )}

              <button disabled={loading} type="submit" className="w-full py-6 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">
                {loading ? <Loader2 className="animate-spin" /> : "Aceder ao Painel"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleUpdatePassword} className="space-y-8 relative z-10">
              <div className="text-center">
                <h2 className="text-3xl font-black italic uppercase tracking-tighter">Primeiro <span className="text-[#0217ff]">Acesso</span></h2>
                <p className="text-zinc-500 text-xs font-medium mt-2 italic">Por segurança, crie uma nova senha agora.</p>
              </div>

              <div className="space-y-4">
                <input 
                  type="password" required placeholder="Nova Senha"
                  className="w-full bg-black border-2 border-white/5 rounded-2xl py-5 px-6 outline-none focus:border-[#0217ff] transition-all font-bold text-white placeholder:text-zinc-700"
                  value={newPassword} onChange={e => setNewPassword(e.target.value)}
                />
                <input 
                  type="password" required placeholder="Confirme a Nova Senha"
                  className="w-full bg-black border-2 border-white/5 rounded-2xl py-5 px-6 outline-none focus:border-[#0217ff] transition-all font-bold text-white placeholder:text-zinc-700"
                  value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                />
              </div>

              {error && <p className="text-red-500 text-[10px] font-black uppercase text-center italic">{error}</p>}

              <button disabled={loading} type="submit" className="w-full py-6 bg-[#0217ff] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">
                {loading ? <Loader2 className="animate-spin" /> : "Ativar Minha Conta"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}