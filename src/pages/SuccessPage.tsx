import { CheckCircle, Mail, ArrowRight, ShieldCheck, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SuccessPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 font-sans selection:bg-[#0217ff]/30 relative overflow-hidden">
      
      {/* Detalhe de fundo para profundidade */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#0217ff]/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-2xl w-full text-center space-y-12 relative z-10 animate-in fade-in zoom-in duration-700">
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center shadow-[0_0_50px_-12px_rgba(16,185,129,0.5)]">
            <CheckCircle size={48} className="text-emerald-500" />
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter leading-none">
            PAGAMENTO <br /> <span className="text-[#0217ff]">CONFIRMADO!</span>
          </h1>
          <p className="text-zinc-500 text-xl font-medium italic max-w-lg mx-auto">
            O seu ecossistema imobiliário de alta performance já está pronto para ser utilizado.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          <div className="p-8 rounded-[40px] bg-zinc-950 border border-white/5 group hover:border-[#0217ff]/30 transition-colors">
            <Mail className="text-[#0217ff] mb-6" size={32} />
            <h3 className="font-black uppercase text-xs tracking-widest mb-2 text-white">Acesso via E-mail</h3>
            <p className="text-zinc-500 text-sm italic leading-relaxed">Utilize o e-mail cadastrado na compra para entrar na sua conta.</p>
          </div>
          
          <div className="p-8 rounded-[40px] bg-zinc-950 border border-white/5 group hover:border-[#0217ff]/30 transition-colors">
            <ShieldCheck className="text-[#0217ff] mb-6" size={32} />
            <h3 className="font-black uppercase text-xs tracking-widest mb-2 text-white">Sua Senha Inicial</h3>
            <p className="text-zinc-500 text-sm italic leading-relaxed">A sua senha padrão é o seu <b>CPF (apenas números)</b> conforme cadastrado na Nexano.</p>
          </div>

          {/* Novo Card de WhatsApp */}
          <div className="md:col-span-2 p-6 rounded-[32px] bg-[#0217ff]/5 border border-[#0217ff]/20 flex items-center gap-4">
             <div className="w-12 h-12 bg-[#25d366]/10 rounded-2xl flex items-center justify-center">
                <MessageCircle size={24} className="text-[#25d366]" />
             </div>
             <p className="text-xs text-zinc-400 italic">Acabámos de enviar os seus dados detalhados para o seu <b>WhatsApp</b> através da nossa central.</p>
          </div>
        </div>

        <div className="pt-4">
          <button 
            onClick={() => navigate('/login')}
            className="w-full py-7 bg-[#0217ff] hover:bg-blue-600 text-white rounded-[32px] font-black text-xl uppercase tracking-[0.2em] shadow-2xl shadow-blue-600/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4"
          >
            Aceder ao Painel Agora <ArrowRight size={24} />
          </button>
        </div>

        <div className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-700 italic">
          ImobiPro Software Solutions © {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}