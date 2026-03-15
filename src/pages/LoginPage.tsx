import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Lock, Mail, Eye, EyeOff, Loader2, ShieldAlert } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Estados Primeiro Acesso
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;

      // VALIDAR PERFIL E STATUS
      const { data: profile } = await supabase
        .from('perfil')
        .select('status, motivo_bloqueio')
        .eq('id', data.user.id)
        .single();

      if (profile?.status === 'bloqueado') {
        await supabase.auth.signOut();
        throw new Error(`Acesso Suspenso: ${profile.motivo_bloqueio || 'Verifique a sua assinatura'}`);
      }

      if (data.user?.user_metadata?.must_change_password) {
        setMustChangePassword(true);
      } else {
        navigate('/app/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-[440px] bg-zinc-950 border border-white/5 rounded-[48px] p-10">
        <form onSubmit={handleLogin} className="space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-black italic uppercase tracking-tighter">Entrar na <span className="text-[#0217ff]">Área VIP</span></h2>
          </div>

          <div className="space-y-4">
            <input 
              className="w-full bg-black border-2 border-white/5 rounded-2xl py-5 px-6 outline-none focus:border-[#0217ff]"
              type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)}
            />
            <div className="relative">
              <input 
                className="w-full bg-black border-2 border-white/5 rounded-2xl py-5 px-6 outline-none focus:border-[#0217ff]"
                type={showPassword ? "text" : "password"} placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && <div className="text-red-500 text-[10px] font-black uppercase text-center italic">{error}</div>}

          <button className="w-full py-6 bg-white text-black rounded-2xl font-black uppercase tracking-widest hover:bg-zinc-200 transition-all">
            {loading ? <Loader2 className="animate-spin mx-auto" /> : "Aceder ao Painel"}
          </button>
        </form>
      </div>
    </div>
  );
}