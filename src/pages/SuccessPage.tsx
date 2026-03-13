import { CheckCircle, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SuccessPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 font-sans">
      <div className="max-w-2xl w-full text-center space-y-10">
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center animate-bounce">
            <CheckCircle size={48} className="text-emerald-500" />
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl font-black uppercase italic tracking-tighter">
            BEM-VINDO AO <span className="text-[#0217ff]">IMOBI-PRO</span>
          </h1>
          <p className="text-zinc-400 text-xl font-medium italic">
            Seu pagamento foi aprovado. Preparamos seu ecossistema imobiliário.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          <div className="p-8 rounded-[32px] bg-zinc-900/50 border border-white/5">
            <Mail className="text-[#0217ff] mb-4" size={32} />
            <h3 className="font-black uppercase text-sm mb-2">Acesso por E-mail</h3>
            <p className="text-zinc-500 text-xs italic">Enviamos seus dados de acesso para o e-mail cadastrado na Nexano.</p>
          </div>
          <div className="p-8 rounded-[32px] bg-zinc-900/50 border border-white/5">
            <ShieldCheck className="text-[#0217ff] mb-4" size={32} />
            <h3 className="font-black uppercase text-sm mb-2">Primeiro Acesso</h3>
            <p className="text-zinc-500 text-xs italic">Seu login inicial será seu E-mail e a senha será o seu CPF (apenas números).</p>
          </div>
        </div>

        <div className="pt-8">
          <button 
            onClick={() => navigate('/login')}
            className="w-full py-6 bg-[#0217ff] text-white rounded-[24px] font-black text-xl uppercase tracking-widest shadow-2xl shadow-blue-600/40 hover:scale-[1.02] transition-all flex items-center justify-center gap-4"
          >
            Ir para Login <ArrowRight size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}