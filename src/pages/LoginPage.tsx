import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Lock, Mail, Eye, EyeOff, Loader2, ShieldAlert, CheckCircle } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para o Primeiro Acesso
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

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

      // VERIFICAÇÃO DE PRIMEIRO ACESSO
      // Verificamos se a flag enviada pelo Webhook da Nexano está presente
      const isFirstAccess = data.user?.user_metadata?.must_change_password;

      if (isFirstAccess) {
        setMustChangePassword(true);
      } else {
        navigate('/app/dashboard');
      }
    } catch (err: any) {
      setError('Credenciais inválidas ou erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    if (newPassword.length < 6) {
      setError('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      // 1. Atualiza a senha no Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      // 2. Remove a flag de "must_change_password" para que ele não caia aqui de novo
      await supabase.auth.updateUser({
        data: { must_change_password: false }
      });

      // 3. Atualiza o perfil no banco de dados (Profiles)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('profiles').update({ is_temporary_password: false }).eq('id', user.id);
      }

      navigate('/app/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md">
        
        {/* LOGO */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white">
            IMOBI<span className="text-[#0217ff]">PRO</span>
          </h1>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Acesso restrito ao corretor</p>
        </div>

        <div className="bg-zinc-900/50 border border-white/5 p-8 md:p-12 rounded-[48px] shadow-2xl backdrop-blur-xl">
          
          {!mustChangePassword ? (
            /* FORMULÁRIO DE LOGIN NORMAL */
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">E-mail de Acesso</label>
                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-[#0217ff]" size={20} />
                  <input 
                    type="email" required
                    className="w-full bg-black border-2 border-white/5 rounded-2xl py-5 pl-14 pr-6 outline-none focus:border-[#0217ff] transition-all font-bold text-white"
                    placeholder="seu@email.com"
                    value={email} onChange={e => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Senha (CPF Inicial)</label>
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-[#0217ff]" size={20} />
                  <input 
                    type={showPassword ? "text" : "password"} required
                    className="w-full bg-black border-2 border-white/5 rounded-2xl py-5 pl-14 pr-14 outline-none focus:border-[#0217ff] transition-all font-bold text-white"
                    placeholder="••••••••"
                    value={password} onChange={e => setPassword(e.target.value)}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-600">
                    {showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold flex items-center gap-3 italic">
                  <ShieldAlert size={18} /> {error}
                </div>
              )}

              <button disabled={loading} type="submit" className="w-full py-6 bg-[#0217ff] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-blue-600/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">
                {loading ? <Loader2 className="animate-spin" /> : "Entrar no Sistema"}
              </button>
            </form>
          ) : (
            /* FORMULÁRIO DE TROCA DE SENHA (PRIMEIRO ACESSO) */
            <form onSubmit={handleChangePassword} className="space-y-6 animate-fade-in">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-[#0217ff]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="text-[#0217ff]" size={32} />
                </div>
                <h2 className="text-xl font-black uppercase italic text-white leading-tight">Primeiro Acesso Detectado!</h2>
                <p className="text-zinc-500 text-xs font-medium mt-2 italic">Por segurança, crie uma nova senha agora.</p>
              </div>

              <div className="space-y-4">
                <input 
                  type="password" required placeholder="Nova Senha Definida"
                  className="w-full bg-black border-2 border-white/5 rounded-2xl py-5 px-6 outline-none focus:border-[#0217ff] transition-all font-bold text-white"
                  value={newPassword} onChange={e => setNewPassword(e.target.value)}
                />
                <input 
                  type="password" required placeholder="Confirme a Nova Senha"
                  className="w-full bg-black border-2 border-white/5 rounded-2xl py-5 px-6 outline-none focus:border-[#0217ff] transition-all font-bold text-white"
                  value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                />
              </div>

              {error && <p className="text-red-500 text-xs font-bold text-center italic">{error}</p>}

              <button disabled={loading} type="submit" className="w-full py-6 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">
                {loading ? <Loader2 className="animate-spin" /> : "Ativar Minha Conta"}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}